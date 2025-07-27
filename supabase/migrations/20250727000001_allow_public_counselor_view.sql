-- カウンセラー一覧を未ログインユーザーでも表示できるようにRLSポリシーを修正

-- 既存のカウンセラーテーブルのポリシーを削除
DROP POLICY IF EXISTS "Anyone can view counselors" ON counselors;
DROP POLICY IF EXISTS "Counselors can manage own profiles" ON counselors;

-- カウンセラー一覧閲覧: 全員可能（未ログイン含む）
CREATE POLICY "Anyone can view counselors"
  ON counselors
  FOR SELECT
  TO public
  USING (is_active = true);

-- カウンセラープロフィール管理: 本人のみ
CREATE POLICY "Counselors can manage own profiles"
  ON counselors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- スケジュール閲覧: 全員可能（未ログイン含む）
DROP POLICY IF EXISTS "Anyone can view schedules" ON schedules;
CREATE POLICY "Anyone can view schedules"
  ON schedules
  FOR SELECT
  TO public
  USING (true);

-- スケジュール管理: カウンセラーのみ
DROP POLICY IF EXISTS "Counselors can manage own schedules" ON schedules;
CREATE POLICY "Counselors can manage own schedules"
  ON schedules
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM counselors WHERE id = schedules.counselor_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM counselors WHERE id = schedules.counselor_id
    )
  ); 