-- リマインダー管理テーブル
CREATE TABLE reminder_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_reminder_jobs_booking_id ON reminder_jobs(booking_id);
CREATE INDEX idx_reminder_jobs_scheduled_at ON reminder_jobs(scheduled_at);
CREATE INDEX idx_reminder_jobs_status ON reminder_jobs(status);

-- 予約作成時にリマインダージョブを自動作成する関数
CREATE OR REPLACE FUNCTION create_reminder_jobs()
RETURNS TRIGGER AS $$
BEGIN
  -- 1日前リマインダー
  INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_at)
  VALUES (
    NEW.id,
    '24h',
    NEW.scheduled_at - INTERVAL '1 day'
  );
  
  -- 1時間前リマインダー
  INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_at)
  VALUES (
    NEW.id,
    '1h',
    NEW.scheduled_at - INTERVAL '1 hour'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 予約テーブルのトリガー作成
CREATE TRIGGER trigger_create_reminder_jobs
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_reminder_jobs();

-- 予約日時変更時にリマインダージョブを更新する関数
CREATE OR REPLACE FUNCTION update_reminder_jobs()
RETURNS TRIGGER AS $$
BEGIN
  -- 予約日時が変更された場合
  IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
    -- 既存のリマインダージョブを削除
    DELETE FROM reminder_jobs 
    WHERE booking_id = NEW.id 
    AND status = 'pending';
    
    -- 新しいリマインダージョブを作成
    INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_at)
    VALUES 
      (NEW.id, '24h', NEW.scheduled_at - INTERVAL '1 day'),
      (NEW.id, '1h', NEW.scheduled_at - INTERVAL '1 hour');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 予約更新トリガー
CREATE TRIGGER trigger_update_reminder_jobs
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_reminder_jobs();

-- RLS ポリシー設定
ALTER TABLE reminder_jobs ENABLE ROW LEVEL SECURITY;

-- 管理者はすべてのリマインダージョブにアクセス可能
CREATE POLICY "Admin can manage reminder jobs" ON reminder_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND email = 'goldbenchan@gmail.com'
    )
  );

-- ユーザーは自分の予約に関するリマインダージョブのみ参照可能
CREATE POLICY "Users can view their reminder jobs" ON reminder_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = reminder_jobs.booking_id 
      AND user_id = auth.uid()
    )
  );

-- カウンセラーは自分の予約に関するリマインダージョブのみ参照可能
CREATE POLICY "Counselors can view their reminder jobs" ON reminder_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN counselors c ON b.counselor_id = c.id
      WHERE b.id = reminder_jobs.booking_id 
      AND c.user_id = auth.uid()
    )
  );