const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bakrkcdfscddmbyltmim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJha3JrY2Rmc2NkZG1ieWx0bWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTc4MjEsImV4cCI6MjA2ODkzMzgyMX0.9N-UAClK2gvKXKBK3drOIRhM0OoifZmq4Rbgs9h8cuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('=== テーブル構造確認 ===');
  
  try {
    // counselorsテーブルの構造を確認
    console.log('\n--- counselorsテーブル ---');
    const { data: counselors, error: counselorsError } = await supabase
      .from('counselors')
      .select('*')
      .limit(1);
    
    if (counselorsError) {
      console.log('counselorsテーブルエラー:', counselorsError);
    } else if (counselors && counselors.length > 0) {
      console.log('counselorsテーブルのカラム:', Object.keys(counselors[0]));
      console.log('サンプルデータ:', counselors[0]);
    }

    // usersテーブルの構造を確認（RLSの影響でアクセスできない可能性）
    console.log('\n--- usersテーブル ---');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('usersテーブルエラー:', usersError);
    } else if (users && users.length > 0) {
      console.log('usersテーブルのカラム:', Object.keys(users[0]));
      console.log('サンプルデータ:', users[0]);
    }

  } catch (error) {
    console.error('エラー:', error);
  }
}

checkTableStructure(); 