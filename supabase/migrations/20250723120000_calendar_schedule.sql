/*
  # カレンダー方式スケジュール管理への変更

  1. 既存のschedulesテーブルを変更
    - `day_of_week` を `date` に変更
    - 日付ベースのスケジュール管理に変更

  2. データ移行
    - 既存の曜日ベースデータを日付ベースに変換
    - 2025年1月から12月までのデータを生成
*/

-- 既存のschedulesテーブルをバックアップ
CREATE TABLE IF NOT EXISTS schedules_backup AS 
SELECT * FROM schedules;

-- 既存のschedulesテーブルを削除
DROP TABLE IF EXISTS schedules CASCADE;

-- 新しいカレンダー方式のschedulesテーブルを作成
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id uuid REFERENCES counselors(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  UNIQUE(counselor_id, date, start_time, end_time) -- 同じ日時の重複を防ぐ
);

-- RLSを有効化
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがスケジュールを閲覧可能
CREATE POLICY "Anyone can view schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (true);

-- カウンセラーは自分のスケジュールを管理可能
CREATE POLICY "Counselors can manage own schedules"
  ON schedules
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM counselors WHERE id = schedules.counselor_id
    )
  );

-- 更新日時の自動更新
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 既存データを日付ベースに変換（2025年1月から12月まで）
INSERT INTO schedules (counselor_id, date, start_time, end_time, is_available)
SELECT 
  counselor_id,
  generate_series(
    '2025-01-01'::date,
    '2025-12-31'::date,
    '1 day'::interval
  )::date as date,
  start_time,
  end_time,
  is_available
FROM schedules_backup
WHERE EXTRACT(dow FROM generate_series(
  '2025-01-01'::date,
  '2025-12-31'::date,
  '1 day'::interval
)::date) = day_of_week;

-- バックアップテーブルを削除
DROP TABLE schedules_backup; 