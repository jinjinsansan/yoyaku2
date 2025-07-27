import { createClient } from '@supabase/supabase-js';

// 環境変数を直接設定（実際の値に置き換えてください）
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('データベース状況を確認中...\n');

  // 1. ユーザーテーブルを確認
  console.log('=== ユーザーテーブル ===');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, name, created_at')
    .limit(10);

  if (userError) {
    console.error('ユーザー取得エラー:', userError.message);
  } else {
    console.log(`ユーザー数: ${users?.length || 0}`);
    if (users && users.length > 0) {
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email} (${user.name}) - ${user.id}`);
      });
    }
  }

  console.log('\n=== カウンセラーテーブル ===');
  const { data: counselors, error: counselorError } = await supabase
    .from('counselors')
    .select(`
      id,
      user_id,
      is_active,
      rating,
      created_at,
      user:users(id, email, name)
    `)
    .limit(10);

  if (counselorError) {
    console.error('カウンセラー取得エラー:', counselorError.message);
  } else {
    console.log(`カウンセラー数: ${counselors?.length || 0}`);
    if (counselors && counselors.length > 0) {
      counselors.forEach((counselor, i) => {
        console.log(`${i + 1}. ID: ${counselor.id}, User ID: ${counselor.user_id}, Active: ${counselor.is_active}, Rating: ${counselor.rating}`);
        if (counselor.user) {
          console.log(`   User: ${counselor.user.email} (${counselor.user.name})`);
        } else {
          console.log(`   User: 関連するユーザーが見つかりません`);
        }
      });
    }
  }

  // 3. カウンセラーとユーザーの関連を確認
  console.log('\n=== カウンセラー・ユーザー関連確認 ===');
  const { data: counselorWithUser, error: relationError } = await supabase
    .from('counselors')
    .select(`
      *,
      user:users(*)
    `);

  if (relationError) {
    console.error('関連確認エラー:', relationError.message);
  } else {
    console.log(`カウンセラー総数: ${counselorWithUser?.length || 0}`);
    if (counselorWithUser && counselorWithUser.length > 0) {
      counselorWithUser.forEach((counselor, i) => {
        console.log(`${i + 1}. カウンセラーID: ${counselor.id}`);
        console.log(`   User ID: ${counselor.user_id}`);
        console.log(`   Is Active: ${counselor.is_active}`);
        console.log(`   User Data:`, counselor.user);
        console.log('   ---');
      });
    }
  }
}

checkDatabase().then(() => {
  console.log('\n確認完了');
  process.exit(0);
}).catch((error) => {
  console.error('確認中にエラーが発生しました:', error);
  process.exit(1);
}); 