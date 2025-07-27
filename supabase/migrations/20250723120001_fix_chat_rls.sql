/*
  # チャット機能のRLSポリシー修正

  既存のRLSポリシーを削除して、より確実なアクセス制御を実装します。
*/

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Booking participants can access chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Room participants can access messages" ON chat_messages;
DROP POLICY IF EXISTS "Room participants can send messages" ON chat_messages;

-- 新しいRLSポリシーを作成（より確実なアクセス制御）

-- チャットルーム: 予約の当事者のみアクセス可能（修正版）
CREATE POLICY "Booking participants can access chat rooms"
  ON chat_rooms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = chat_rooms.booking_id 
      AND (
        b.user_id = auth.uid() OR
        b.counselor_id IN (
          SELECT id FROM counselors WHERE user_id = auth.uid()
        )
      )
    )
  );

-- チャットメッセージ: ルーム参加者のみアクセス可能（修正版）
CREATE POLICY "Room participants can access messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN bookings b ON cr.booking_id = b.id
      WHERE cr.id = chat_messages.room_id
      AND (
        b.user_id = auth.uid() OR
        b.counselor_id IN (
          SELECT id FROM counselors WHERE user_id = auth.uid()
        )
      )
    )
  );

-- メッセージ送信: ルーム参加者のみ可能（修正版）
CREATE POLICY "Room participants can send messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN bookings b ON cr.booking_id = b.id
      WHERE cr.id = chat_messages.room_id
      AND (
        b.user_id = auth.uid() OR
        b.counselor_id IN (
          SELECT id FROM counselors WHERE user_id = auth.uid()
        )
      )
    )
  );

-- デバッグ用: チャットルームの存在確認クエリ
-- このクエリでカウンセラーが自分のチャットルームにアクセスできるかテストできます
-- SELECT cr.*, b.user_id, b.counselor_id, c.user_id as counselor_user_id
-- FROM chat_rooms cr
-- JOIN bookings b ON cr.booking_id = b.id
-- JOIN counselors c ON b.counselor_id = c.id
-- WHERE c.user_id = auth.uid(); 