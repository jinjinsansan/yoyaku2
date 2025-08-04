-- カウンセラーテーブルにフィルタリング用のカラムを追加
ALTER TABLE counselors 
ADD COLUMN region TEXT DEFAULT 'オンライン',
ADD COLUMN session_type TEXT DEFAULT 'both' CHECK (session_type IN ('online', 'in_person', 'both')),
ADD COLUMN experience_years INTEGER DEFAULT 0,
ADD COLUMN credentials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN languages JSONB DEFAULT '["日本語"]'::jsonb,
ADD COLUMN introduction_video_url TEXT,
ADD COLUMN availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable'));

-- お気に入りカウンセラーテーブル
CREATE TABLE favorite_counselors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, counselor_id)
);

-- レビューテーブルを作成（まだない場合）
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- カウンセラーのスケジュールテーブル
CREATE TABLE IF NOT EXISTS counselor_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  recurring_weekly BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(counselor_id, date, start_time)
);

-- RLSポリシー
ALTER TABLE favorite_counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselor_schedules ENABLE ROW LEVEL SECURITY;

-- お気に入りのポリシー
CREATE POLICY "Users can manage their own favorites" ON favorite_counselors
  FOR ALL USING (auth.uid() = user_id);

-- レビューのポリシー
CREATE POLICY "Users can view all reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id);

-- スケジュールのポリシー
CREATE POLICY "Everyone can view schedules" ON counselor_schedules
  FOR SELECT USING (true);

CREATE POLICY "Counselors can manage their own schedules" ON counselor_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- インデックス作成
CREATE INDEX idx_favorite_counselors_user_id ON favorite_counselors(user_id);
CREATE INDEX idx_favorite_counselors_counselor_id ON favorite_counselors(counselor_id);
CREATE INDEX idx_reviews_counselor_id ON reviews(counselor_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_counselor_schedules_counselor_date ON counselor_schedules(counselor_id, date);
CREATE INDEX idx_counselors_region ON counselors(region);
CREATE INDEX idx_counselors_session_type ON counselors(session_type);
CREATE INDEX idx_counselors_hourly_rate ON counselors(hourly_rate);
CREATE INDEX idx_counselors_rating ON counselors(rating);
CREATE INDEX idx_counselors_availability_status ON counselors(availability_status);

-- 既存のカウンセラーデータを更新（サンプルデータ）
UPDATE counselors SET 
  region = CASE 
    WHEN id = (SELECT id FROM counselors LIMIT 1) THEN '東京都'
    WHEN id = (SELECT id FROM counselors OFFSET 1 LIMIT 1) THEN '大阪府'
    ELSE 'オンライン'
  END,
  session_type = 'both',
  experience_years = FLOOR(RANDOM() * 15) + 1,
  credentials = '["臨床心理士", "公認心理師"]'::jsonb,
  languages = '["日本語", "英語"]'::jsonb
WHERE true;