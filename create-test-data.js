const { createClient } = require('@supabase/supabase-js');

// Supabaseクライアントの初期化
// 実際のSupabase URLとキーを設定してください
const supabaseUrl = 'https://your-actual-project.supabase.co'; // 実際のURLに変更してください
const supabaseKey = 'your-actual-anon-key'; // 実際のキーに変更してください

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '設定済み' : '未設定');

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('=== テストデータ作成開始 ===');

  try {
    // 1. 既存のカウンセラーを確認
    const { data: existingCounselors, error: counselorCheckError } = await supabase
      .from('counselors')
      .select('id, user_id, user:users(id, name, email)')
      .limit(5);

    if (counselorCheckError) {
      console.error('カウンセラー確認エラー:', counselorCheckError);
      return;
    }

    console.log(`既存カウンセラー取得: ${existingCounselors.length}件`);

    if (existingCounselors.length === 0) {
      console.log('カウンセラーが存在しません。まずカウンセラーを作成してください。');
      return;
    }

    // 2. 既存のユーザーを確認
    const { data: existingUsers, error: userCheckError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5);

    if (userCheckError) {
      console.error('ユーザー確認エラー:', userCheckError);
      return;
    }

    console.log(`既存ユーザー取得: ${existingUsers.length}件`);

    if (existingUsers.length === 0) {
      console.log('ユーザーが存在しません。まずユーザーを作成してください。');
      return;
    }

    // 3. テスト予約を作成（既存のユーザーとカウンセラーを使用）
    const testBookings = [];
    const testChatRooms = [];

    for (let i = 0; i < Math.min(3, existingUsers.length, existingCounselors.length); i++) {
      const user = existingUsers[i];
      const counselor = existingCounselors[i];

      console.log(`予約作成: ${user.email} と ${counselor.user?.email}`);

      // 予約を作成
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          counselor_id: counselor.id,
          service_type: 'single',
          scheduled_at: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(), // 1日後、2日後、3日後
          status: 'confirmed',
          amount: 5000 + (i * 1000),
          notes: `テスト予約 ${i + 1}`
        })
        .select()
        .single();

      if (bookingError) {
        console.error(`予約作成エラー ${i + 1}:`, bookingError);
        continue;
      }

      testBookings.push(booking);
      console.log(`予約作成成功: ${user.email} と ${counselor.user?.email}`);

      // チャットルームを作成
      const { data: chatRoom, error: chatRoomError } = await supabase
        .from('chat_rooms')
        .insert({
          booking_id: booking.id,
          is_active: true
        })
        .select()
        .single();

      if (chatRoomError) {
        console.error(`チャットルーム作成エラー ${i + 1}:`, chatRoomError);
        continue;
      }

      testChatRooms.push(chatRoom);
      console.log(`チャットルーム作成成功: booking ${booking.id}`);

      // テストメッセージを作成
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: chatRoom.id,
          sender_id: user.id,
          message: `こんにちは、テストメッセージ ${i + 1} です。`
        })
        .select()
        .single();

      if (messageError) {
        console.error(`メッセージ作成エラー ${i + 1}:`, messageError);
        continue;
      }

      console.log(`テストメッセージ作成成功: chat room ${chatRoom.id}`);
    }

    console.log('=== テストデータ作成完了 ===');
    console.log(`既存ユーザー: ${existingUsers.length}件`);
    console.log(`既存カウンセラー: ${existingCounselors.length}件`);
    console.log(`作成された予約: ${testBookings.length}件`);
    console.log(`作成されたチャットルーム: ${testChatRooms.length}件`);

    console.log('\n=== テストアカウント情報 ===');
    console.log('既存ユーザー:');
    existingUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} (${user.name})`);
    });

    console.log('\n既存カウンセラー:');
    existingCounselors.forEach((counselor, i) => {
      console.log(`${i + 1}. ${(counselor.user as { email?: string; name?: string })?.email} (${(counselor.user as { email?: string; name?: string })?.name})`);
    });

  } catch (error) {
    console.error('テストデータ作成エラー:', error);
  }

  console.log('テストデータ作成処理が完了しました');
}

createTestData(); 