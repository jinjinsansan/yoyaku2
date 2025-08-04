-- カウンセラーのGoogleカレンダー連携設定
CREATE TABLE counselor_calendar_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  google_calendar_id TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  sync_enabled BOOLEAN DEFAULT false,
  auto_sync_bookings BOOLEAN DEFAULT true,
  sync_buffer_minutes INTEGER DEFAULT 15, -- 予約前後のバッファ時間
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(counselor_id)
);

-- 休暇・不在期間管理
CREATE TABLE counselor_time_off (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- null の場合は終日
  end_time TIME,   -- null の場合は終日
  is_all_day BOOLEAN DEFAULT true,
  time_off_type TEXT NOT NULL CHECK (time_off_type IN ('vacation', 'sick_leave', 'personal', 'training', 'other')),
  recurring_type TEXT CHECK (recurring_type IN ('none', 'weekly', 'monthly', 'yearly')),
  recurring_end_date DATE,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 繰り返しスケジュールテンプレート
CREATE TABLE schedule_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weekdays INTEGER[] NOT NULL, -- 0=日曜日, 1=月曜日, ... 6=土曜日
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_duration_minutes INTEGER DEFAULT 60,
  buffer_minutes INTEGER DEFAULT 15, -- セッション間のバッファ
  is_active BOOLEAN DEFAULT true,
  effective_start_date DATE DEFAULT CURRENT_DATE,
  effective_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- スケジュール生成履歴
CREATE TABLE schedule_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  template_id UUID REFERENCES schedule_templates(id) ON DELETE SET NULL,
  generation_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  slots_created INTEGER DEFAULT 0,
  slots_failed INTEGER DEFAULT 0,
  error_messages TEXT[],
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- カウンセラースケジュールテーブルに追加フィールド
ALTER TABLE counselor_schedules 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES schedule_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'none' CHECK (sync_status IN ('none', 'synced', 'sync_failed', 'sync_pending')),
ADD COLUMN IF NOT EXISTS buffer_before_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buffer_after_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_counselor_calendar_settings_counselor_id ON counselor_calendar_settings(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counselor_time_off_counselor_id ON counselor_time_off(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counselor_time_off_dates ON counselor_time_off(counselor_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_counselor_id ON schedule_templates(counselor_id);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_active ON schedule_templates(counselor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_schedule_generation_logs_counselor_id ON schedule_generation_logs(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counselor_schedules_template_id ON counselor_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_counselor_schedules_google_event_id ON counselor_schedules(google_event_id);

-- RLSポリシー
ALTER TABLE counselor_calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselor_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_generation_logs ENABLE ROW LEVEL SECURITY;

-- カレンダー設定のポリシー
CREATE POLICY "Counselors can manage their own calendar settings" ON counselor_calendar_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- 休暇設定のポリシー
CREATE POLICY "Counselors can manage their own time off" ON counselor_time_off
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- スケジュールテンプレートのポリシー
CREATE POLICY "Counselors can manage their own schedule templates" ON schedule_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- スケジュール生成ログのポリシー
CREATE POLICY "Counselors can view their own generation logs" ON schedule_generation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- 管理者は全ての生成ログを作成可能
CREATE POLICY "System can create generation logs" ON schedule_generation_logs
  FOR INSERT WITH CHECK (true);

-- 関数：指定期間の休暇をチェック
CREATE OR REPLACE FUNCTION is_time_off(
  p_counselor_id UUID,
  p_date DATE,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM counselor_time_off 
    WHERE counselor_id = p_counselor_id
      AND status = 'approved'
      AND start_date <= p_date 
      AND end_date >= p_date
      AND (
        is_all_day = true 
        OR (
          p_start_time IS NOT NULL 
          AND p_end_time IS NOT NULL
          AND NOT (end_time <= p_start_time OR start_time >= p_end_time)
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数：スケジュールテンプレートから一括スケジュール生成
CREATE OR REPLACE FUNCTION generate_schedule_from_template(
  p_template_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  created_count INTEGER,
  skipped_count INTEGER,
  error_count INTEGER,
  errors TEXT[]
) AS $$
DECLARE
  template_record RECORD;
  current_date DATE;
  current_time TIME;
  slot_end_time TIME;
  slots_per_session INTEGER;
  i INTEGER;
  created INTEGER := 0;
  skipped INTEGER := 0;
  error_cnt INTEGER := 0;
  error_list TEXT[] := '{}';
  weekday_num INTEGER;
BEGIN
  -- テンプレート情報を取得
  SELECT * INTO template_record 
  FROM schedule_templates 
  WHERE id = p_template_id AND is_active = true;
  
  IF NOT FOUND THEN
    error_list := array_append(error_list, 'Template not found or inactive');
    RETURN QUERY SELECT 0, 0, 1, error_list;
    RETURN;
  END IF;

  -- セッション数を計算
  slots_per_session := EXTRACT(EPOCH FROM (template_record.end_time - template_record.start_time)) / 60 / 
                      (template_record.session_duration_minutes + template_record.buffer_minutes);

  -- 日付をループ
  current_date := p_start_date;
  WHILE current_date <= p_end_date LOOP
    weekday_num := EXTRACT(DOW FROM current_date);
    
    -- この曜日がテンプレートに含まれているかチェック
    IF weekday_num = ANY(template_record.weekdays) THEN
      -- 休暇チェック
      IF NOT is_time_off(template_record.counselor_id, current_date) THEN
        -- 時間スロットを生成
        current_time := template_record.start_time;
        FOR i IN 1..slots_per_session LOOP
          slot_end_time := current_time + (template_record.session_duration_minutes || ' minutes')::INTERVAL;
          
          -- 既存スロットチェック
          IF NOT EXISTS (
            SELECT 1 FROM counselor_schedules 
            WHERE counselor_id = template_record.counselor_id 
              AND date = current_date 
              AND start_time = current_time
          ) THEN
            BEGIN
              INSERT INTO counselor_schedules (
                counselor_id, date, start_time, end_time, 
                is_available, template_id, buffer_before_minutes, buffer_after_minutes
              ) VALUES (
                template_record.counselor_id, current_date, current_time, slot_end_time,
                true, p_template_id, 
                CASE WHEN i = 1 THEN template_record.buffer_minutes ELSE 0 END,
                CASE WHEN i = slots_per_session THEN template_record.buffer_minutes ELSE 0 END
              );
              created := created + 1;
            EXCEPTION WHEN OTHERS THEN
              error_cnt := error_cnt + 1;
              error_list := array_append(error_list, 
                format('Failed to create slot for %s %s: %s', current_date, current_time, SQLERRM));
            END;
          ELSE
            skipped := skipped + 1;
          END IF;
          
          -- 次の時間スロット
          current_time := slot_end_time + (template_record.buffer_minutes || ' minutes')::INTERVAL;
          
          -- 終了時間を超えたら終了
          IF current_time >= template_record.end_time THEN
            EXIT;
          END IF;
        END LOOP;
      ELSE
        skipped := skipped + 1;
      END IF;
    END IF;
    
    current_date := current_date + 1;
  END LOOP;

  -- ログ記録
  INSERT INTO schedule_generation_logs (
    counselor_id, template_id, generation_date, start_date, end_date,
    slots_created, slots_failed, error_messages, 
    status
  ) VALUES (
    template_record.counselor_id, p_template_id, CURRENT_DATE, p_start_date, p_end_date,
    created, error_cnt, error_list,
    CASE WHEN error_cnt = 0 THEN 'completed' ELSE 'failed' END
  );

  RETURN QUERY SELECT created, skipped, error_cnt, error_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;