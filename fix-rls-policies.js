const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bakrkcdfscddmbyltmim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJha3JrY2Rmc2NkZG1ieWx0bWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTc4MjEsImV4cCI6MjA2ODkzMzgyMX0.9N-UAClK2gvKXKBK3drOIRhM0OoifZmq4Rbgs9h8cuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('=== RLSポリシー修正開始 ===');
  
  try {
    // カウンセラーテーブルのRLSポリシーを修正
    console.log('1. カウンセラーテーブルのRLSポリシーを修正中...');
    
    // 既存のポリシーを削除
    const { error: dropError1 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Anyone can view counselors" ON counselors;'
    });
    
    const { error: dropError2 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Counselors can manage own profiles" ON counselors;'
    });
    
    if (dropError1) console.log('既存ポリシー削除エラー1:', dropError1);
    if (dropError2) console.log('既存ポリシー削除エラー2:', dropError2);
    
    // 新しいポリシーを作成
    const { error: createError1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Anyone can view counselors"
        ON counselors
        FOR SELECT
        TO public
        USING (is_active = true);
      `
    });
    
    const { error: createError2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Counselors can manage own profiles"
        ON counselors
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
      `
    });
    
    if (createError1) console.log('カウンセラーポリシー作成エラー1:', createError1);
    if (createError2) console.log('カウンセラーポリシー作成エラー2:', createError2);
    
    // スケジュールテーブルのRLSポリシーを修正
    console.log('2. スケジュールテーブルのRLSポリシーを修正中...');
    
    const { error: dropError3 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Anyone can view schedules" ON schedules;'
    });
    
    const { error: dropError4 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Counselors can manage own schedules" ON schedules;'
    });
    
    if (dropError3) console.log('既存ポリシー削除エラー3:', dropError3);
    if (dropError4) console.log('既存ポリシー削除エラー4:', dropError4);
    
    const { error: createError3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Anyone can view schedules"
        ON schedules
        FOR SELECT
        TO public
        USING (true);
      `
    });
    
    const { error: createError4 } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (createError3) console.log('スケジュールポリシー作成エラー1:', createError3);
    if (createError4) console.log('スケジュールポリシー作成エラー2:', createError4);
    
    console.log('=== RLSポリシー修正完了 ===');
    
    // 修正後のテスト
    console.log('\n=== 修正後のテスト ===');
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

fixRLSPolicies(); 