-- RLSポリシーの修正と有効化
-- チャット関連テーブルのRLSを確実に有効化

-- chat_roomsテーブルのRLSを有効化
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- chat_messagesテーブルのRLSを有効化
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- reviewsテーブルのRLSを有効化（もし存在する場合）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Booking participants can access chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Room participants can access messages" ON chat_messages;
DROP POLICY IF EXISTS "Room participants can send messages" ON chat_messages;

-- チャットルーム: 予約の当事者のみアクセス可能
CREATE POLICY "Booking participants can access chat rooms"
  ON chat_rooms
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT b.user_id FROM bookings b WHERE b.id = chat_rooms.booking_id
      UNION
      SELECT c.user_id FROM bookings b 
      JOIN counselors c ON b.counselor_id = c.id 
      WHERE b.id = chat_rooms.booking_id
    )
  );

-- チャットメッセージ: ルーム参加者のみアクセス可能
CREATE POLICY "Room participants can access messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT b.user_id FROM chat_rooms cr
      JOIN bookings b ON cr.booking_id = b.id
      WHERE cr.id = chat_messages.room_id
      UNION
      SELECT c.user_id FROM chat_rooms cr
      JOIN bookings b ON cr.booking_id = b.id
      JOIN counselors c ON b.counselor_id = c.id
      WHERE cr.id = chat_messages.room_id
    )
  );

-- メッセージ送信: ルーム参加者のみ可能
CREATE POLICY "Room participants can send messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT b.user_id FROM chat_rooms cr
      JOIN bookings b ON cr.booking_id = b.id
      WHERE cr.id = chat_messages.room_id
      UNION
      SELECT c.user_id FROM chat_rooms cr
      JOIN bookings b ON cr.booking_id = b.id
      JOIN counselors c ON b.counselor_id = c.id
      WHERE cr.id = chat_messages.room_id
    )
  );

-- メッセージ更新: 送信者のみ可能
CREATE POLICY "Message sender can update messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- メッセージ削除: 送信者のみ可能
CREATE POLICY "Message sender can delete messages"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- reviewsテーブルのポリシー（もし存在する場合）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- 既存のポリシーを削除
    DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
    DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
    DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
    DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
    
    -- レビュー閲覧: 全員可能
    CREATE POLICY "Users can view reviews"
      ON reviews
      FOR SELECT
      TO authenticated
      USING (true);
    
    -- レビュー作成: 認証済みユーザーのみ
    CREATE POLICY "Users can create reviews"
      ON reviews
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    -- レビュー更新: 作成者のみ
    CREATE POLICY "Users can update own reviews"
      ON reviews
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    -- レビュー削除: 作成者のみ
    CREATE POLICY "Users can delete own reviews"
      ON reviews
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$; 