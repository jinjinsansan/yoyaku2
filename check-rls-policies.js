const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bakrkcdfscddmbyltmim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJha3JrY2Rmc2NkZG1ieWx0bWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTc4MjEsImV4cCI6MjA2ODkzMzgyMX0.9N-UAClK2gvKXKBK3drOIRhM0OoifZmq4Rbgs9h8cuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('=== RLSポリシー確認 ===');
  
  try {
    // カウンセラーテーブルのRLSポリシーを確認
    const { data: counselorPolicies, error: counselorError } = await supabase
      .rpc('get_policies', { table_name: 'counselors' });
    
    if (counselorError) {
      console.log('カウンセラーテーブルのポリシー確認エラー:', counselorError);
    } else {
      console.log('カウンセラーテーブルのポリシー:', counselorPolicies);
    }

    // スケジュールテーブルのRLSポリシーを確認
    const { data: schedulePolicies, error: scheduleError } = await supabase
      .rpc('get_policies', { table_name: 'schedules' });
    
    if (scheduleError) {
      console.log('スケジュールテーブルのポリシー確認エラー:', scheduleError);
    } else {
      console.log('スケジュールテーブルのポリシー:', schedulePolicies);
    }

    // 未ログイン状態でカウンセラーデータを取得してみる
    console.log('\n=== 未ログイン状態でのカウンセラー取得テスト ===');
    const { data: counselors, error: counselorsError } = await supabase
      .from('counselors')
      .select('*')
      .eq('is_active', true);
    
    if (counselorsError) {
      console.log('カウンセラー取得エラー:', counselorsError);
    } else {
      console.log('取得されたカウンセラー数:', counselors?.length || 0);
      console.log('カウンセラーデータ:', counselors);
    }

  } catch (error) {
    console.error('エラー:', error);
  }
}

checkRLSPolicies(); 