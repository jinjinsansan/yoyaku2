const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bakrkcdfscddmbyltmim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJha3JrY2Rmc2NkZG1ieWx0bWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTc4MjEsImV4cCI6MjA2ODkzMzgyMX0.9N-UAClK2gvKXKBK3drOIRhM0OoifZmq4Rbgs9h8cuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounselorNames() {
  console.log('=== カウンセラー名確認 ===');
  
  try {
    // カウンセラーデータを取得
    const { data: counselors, error: counselorsError } = await supabase
      .from('counselors')
      .select(`
        *,
        user:users(*)
      `);
    
    if (counselorsError) {
      console.log('カウンセラー取得エラー:', counselorsError);
      return;
    }

    console.log('取得されたカウンセラー数:', counselors?.length || 0);
    
    counselors?.forEach((counselor, index) => {
      console.log(`\n--- カウンセラー ${index + 1} ---`);
      console.log('カウンセラーID:', counselor.id);
      console.log('user_id:', counselor.user_id);
      console.log('カウンセラーデータ:', {
        bio: counselor.bio,
        specialties: counselor.specialties,
        hourly_rate: counselor.hourly_rate
      });
      
      if (counselor.user) {
        console.log('ユーザーデータ:', {
          id: counselor.user.id,
          email: counselor.user.email,
          name: counselor.user.name,
          user_metadata: counselor.user.user_metadata
        });
      } else {
        console.log('ユーザーデータ: null');
      }
    });

  } catch (error) {
    console.error('エラー:', error);
  }
}

checkCounselorNames(); 