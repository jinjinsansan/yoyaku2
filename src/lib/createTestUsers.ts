import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUsers = [
  { email: 'testuser1@gmail.com', password: 'Test1234!', name: 'テストユーザー1' },
  { email: 'testuser2@gmail.com', password: 'Test1234!', name: 'テストユーザー2' },
  { email: 'testuser3@gmail.com', password: 'Test1234!', name: 'テストユーザー3' },
];

async function createTestUsers() {
  for (const user of testUsers) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: { name: user.name }
      }
    });
    if (error) {
      console.error(`ユーザー作成失敗: ${user.email}`, error.message);
    } else {
      console.log(`ユーザー作成成功: ${user.email}`);
    }
  }
}

createTestUsers().then(() => {
  console.log('テストユーザー作成処理が完了しました');
  process.exit(0);
}); 