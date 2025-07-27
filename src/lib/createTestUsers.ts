import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 環境変数を読み込み
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestData() {
  console.log('テストデータ作成を開始します...');

  // 1. 既存のカウンセラーを取得
  const { data: existingCounselors, error: counselorError } = await supabase
    .from('counselors')
    .select(`
      id, 
      user_id, 
      user:users(name, email)
    `)
    .limit(2);

  if (counselorError) {
    console.error('既存カウンセラー取得エラー:', counselorError.message);
    return;
  }

  if (!existingCounselors || existingCounselors.length === 0) {
    console.error('既存のカウンセラーが見つかりません');
    return;
  }

  console.log(`既存カウンセラー取得: ${existingCounselors.length}件`);

  // 2. 既存のユーザーを取得（テスト用）
  const { data: existingUsers, error: userError } = await supabase
    .from('users')
    .select('id, name, email')
    .limit(3);

  if (userError) {
    console.error('既存ユーザー取得エラー:', userError.message);
    return;
  }

  if (!existingUsers || existingUsers.length === 0) {
    console.error('既存のユーザーが見つかりません');
    return;
  }

  console.log(`既存ユーザー取得: ${existingUsers.length}件`);

  // 3. テスト予約を作成
  const testBookings = [];
  for (let i = 0; i < existingUsers.length && i < existingCounselors.length; i++) {
    const user = existingUsers[i];
    const counselor = existingCounselors[i];
    
    if (user?.id && counselor?.id) {
      const { data: booking, error } = await supabase.from('bookings').insert({
        user_id: user.id,
        counselor_id: counselor.id,
        service_type: 'single',
        scheduled_at: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(), // 1日後から順次
        status: 'confirmed',
        amount: 11000,
        notes: `テスト予約 ${i + 1}: ${user.name} と ${(counselor.user as { name?: string })?.name} のセッション`
      }).select().single();

      if (error) {
        console.error(`予約作成失敗: ${user.email}`, error.message);
      } else {
        console.log(`予約作成成功: ${user.email} と ${(counselor.user as { email?: string })?.email}`);
        testBookings.push(booking);
      }
    }
  }

  // 4. チャットルームを作成
  const testChatRooms = [];
  for (const booking of testBookings) {
    const { data: chatRoom, error } = await supabase.from('chat_rooms').insert({
      booking_id: booking.id,
      is_active: true
    }).select().single();

    if (error) {
      console.error(`チャットルーム作成失敗: booking ${booking.id}`, error.message);
    } else {
      console.log(`チャットルーム作成成功: booking ${booking.id}`);
      testChatRooms.push(chatRoom);
    }
  }

  // 5. テストメッセージを作成
  for (const chatRoom of testChatRooms) {
    const booking = testBookings.find(b => b.id === chatRoom.booking_id);
    if (booking) {
      const user = existingUsers.find(u => u.id === booking.user_id);
      const counselor = existingCounselors.find(c => c.id === booking.counselor_id);
      
      if (user && counselor) {
        // ユーザーからのメッセージ
        await supabase.from('chat_messages').insert({
          room_id: chatRoom.id,
          sender_id: user.id,
          message: `こんにちは、${(counselor.user as { name?: string })?.name}先生。今日はよろしくお願いします。`,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30分前
        });

        // カウンセラーからの返信
        await supabase.from('chat_messages').insert({
          room_id: chatRoom.id,
          sender_id: counselor.user_id,
          message: `こんにちは、${user.name}さん。お疲れ様です。今日はどのようなお話をしましょうか？`,
          created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25分前
        });

        // ユーザーからの追加メッセージ
        await supabase.from('chat_messages').insert({
          room_id: chatRoom.id,
          sender_id: user.id,
          message: '最近、仕事でストレスを感じることが多くて...',
          created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() // 20分前
        });

        console.log(`テストメッセージ作成成功: chat room ${chatRoom.id}`);
      }
    }
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
}

createTestData().then(() => {
  console.log('テストデータ作成処理が完了しました');
  process.exit(0);
}).catch((error) => {
  console.error('テストデータ作成中にエラーが発生しました:', error);
  process.exit(1);
}); 