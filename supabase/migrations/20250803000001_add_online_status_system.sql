-- カウンセラーのオンライン状態管理テーブル
CREATE TABLE counselor_online_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  auto_online_start TIMESTAMPTZ,
  auto_online_end TIMESTAMPTZ,
  manual_override BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 一つのカウンセラーにつき一つのレコードのみ
  UNIQUE(counselor_id)
);

-- インデックス作成
CREATE INDEX idx_counselor_online_status_counselor_id ON counselor_online_status(counselor_id);
CREATE INDEX idx_counselor_online_status_is_online ON counselor_online_status(is_online);
CREATE INDEX idx_counselor_online_status_auto_times ON counselor_online_status(auto_online_start, auto_online_end);

-- 予約セッション管理テーブル
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled', 'missed')),
  auto_started BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 一つの予約につき一つのセッション
  UNIQUE(booking_id)
);

-- インデックス作成
CREATE INDEX idx_chat_sessions_booking_id ON chat_sessions(booking_id);
CREATE INDEX idx_chat_sessions_counselor_id ON chat_sessions(counselor_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_scheduled_times ON chat_sessions(scheduled_start, scheduled_end);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);

-- カウンセラー作成時にオンライン状態レコードを自動作成
CREATE OR REPLACE FUNCTION create_counselor_online_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO counselor_online_status (counselor_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_counselor_online_status
  AFTER INSERT ON counselors
  FOR EACH ROW
  EXECUTE FUNCTION create_counselor_online_status();

-- 予約確定時にチャットセッションを作成
CREATE OR REPLACE FUNCTION create_chat_session()
RETURNS TRIGGER AS $$
BEGIN
  -- 予約が確定された場合（statusがconfirmedになった場合）
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- セッション時間を計算（予約時間から2時間）
    INSERT INTO chat_sessions (
      booking_id,
      counselor_id,
      user_id,
      scheduled_start,
      scheduled_end
    ) VALUES (
      NEW.id,
      NEW.counselor_id,
      NEW.user_id,
      NEW.scheduled_at,
      NEW.scheduled_at + INTERVAL '2 hours'
    )
    ON CONFLICT (booking_id) DO UPDATE SET
      scheduled_start = EXCLUDED.scheduled_start,
      scheduled_end = EXCLUDED.scheduled_end,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_chat_session
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_session();

-- オンライン状態の自動制御関数
CREATE OR REPLACE FUNCTION update_auto_online_status()
RETURNS void AS $$
DECLARE
  session_record RECORD;
  status_record RECORD;
BEGIN
  -- 現在時刻
  DECLARE current_time TIMESTAMPTZ := NOW();
  
  -- アクティブなセッションをチェック
  FOR session_record IN 
    SELECT cs.*, cos.counselor_id as status_counselor_id, cos.manual_override
    FROM chat_sessions cs
    JOIN counselor_online_status cos ON cs.counselor_id = cos.counselor_id
    WHERE cs.status = 'scheduled'
    AND cs.scheduled_start <= current_time + INTERVAL '5 minutes'
    AND cs.scheduled_end >= current_time
  LOOP
    -- 手動オーバーライドが無効な場合のみ自動制御
    IF NOT session_record.manual_override THEN
      -- セッション開始5分前からオンラインにする
      IF current_time >= session_record.scheduled_start - INTERVAL '5 minutes' 
         AND current_time <= session_record.scheduled_end THEN
        
        UPDATE counselor_online_status 
        SET 
          is_online = true,
          auto_online_start = session_record.scheduled_start,
          auto_online_end = session_record.scheduled_end,
          last_activity = current_time,
          updated_at = current_time
        WHERE counselor_id = session_record.counselor_id;
        
        -- セッションを開始状態に変更
        IF current_time >= session_record.scheduled_start 
           AND session_record.status = 'scheduled' THEN
          UPDATE chat_sessions
          SET 
            status = 'active',
            actual_start = current_time,
            auto_started = true,
            updated_at = current_time
          WHERE id = session_record.id;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  -- セッション終了時の自動オフライン化
  FOR status_record IN
    SELECT cos.*, cs.scheduled_end
    FROM counselor_online_status cos
    LEFT JOIN chat_sessions cs ON cos.counselor_id = cs.counselor_id 
      AND cs.status = 'active'
      AND cs.scheduled_end = cos.auto_online_end
    WHERE cos.is_online = true
    AND cos.auto_online_end IS NOT NULL
    AND cos.auto_online_end <= current_time
    AND NOT cos.manual_override
  LOOP
    -- 自動オフライン化
    UPDATE counselor_online_status
    SET 
      is_online = false,
      auto_online_start = NULL,
      auto_online_end = NULL,
      updated_at = current_time
    WHERE counselor_id = status_record.counselor_id;
    
    -- 対応するセッションを完了状態に変更
    UPDATE chat_sessions
    SET 
      status = 'completed',
      actual_end = current_time,
      updated_at = current_time
    WHERE counselor_id = status_record.counselor_id
    AND status = 'active'
    AND scheduled_end <= current_time;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RLS ポリシー設定
ALTER TABLE counselor_online_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- 管理者は全てのオンライン状態にアクセス可能
CREATE POLICY "Admin can manage online status" ON counselor_online_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND email = 'goldbenchan@gmail.com'
    )
  );

-- カウンセラーは自分のオンライン状態のみ管理可能
CREATE POLICY "Counselors can manage their online status" ON counselor_online_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE id = counselor_online_status.counselor_id 
      AND user_id = auth.uid()
    )
  );

-- ユーザーは全てのカウンセラーのオンライン状態を参照可能
CREATE POLICY "Users can view counselor online status" ON counselor_online_status
  FOR SELECT USING (true);

-- 管理者は全てのセッションにアクセス可能
CREATE POLICY "Admin can manage chat sessions" ON chat_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND email = 'goldbenchan@gmail.com'
    )
  );

-- カウンセラーは自分のセッションのみアクセス可能
CREATE POLICY "Counselors can manage their sessions" ON chat_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE id = chat_sessions.counselor_id 
      AND user_id = auth.uid()
    )
  );

-- ユーザーは自分のセッションのみアクセス可能
CREATE POLICY "Users can access their sessions" ON chat_sessions
  FOR ALL USING (user_id = auth.uid());