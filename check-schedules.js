const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = 'https://bakrkcdfscddmbyltmim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJha3JrY2Rmc2NkZG1ieWx0bWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTc4MjEsImV4cCI6MjA2ODkzMzgyMX0.9N-UAClK2gvKXKBK3drOIRhM0OoifZmq4Rbgs9h8cuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchedules() {
  try {
    console.log('=== スケジュールテーブルの状況確認 ===');
    
    // 1. スケジュールテーブルの構造確認
    console.log('\n1. スケジュールテーブルの構造:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('schedules')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('テーブル構造確認エラー:', tableError);
      console.error('エラー詳細:', tableError.message);
      console.error('エラーコード:', tableError.code);
    } else {
      if (tableInfo && tableInfo.length > 0) {
        console.log('テーブル構造:', Object.keys(tableInfo[0]));
      } else {
        console.log('テーブルは空です');
      }
    }
    
    // 2. 全スケジュールデータの確認
    console.log('\n2. 全スケジュールデータ:');
    const { data: allSchedules, error: allError } = await supabase
      .from('schedules')
      .select('*')
      .order('date, start_time');
    
    if (allError) {
      console.error('全データ取得エラー:', allError);
      console.error('エラー詳細:', allError.message);
      console.error('エラーコード:', allError.code);
    } else {
      console.log('総スケジュール数:', allSchedules?.length || 0);
      if (allSchedules && allSchedules.length > 0) {
        console.log('最新5件:');
        allSchedules.slice(0, 5).forEach((schedule, index) => {
          console.log(`${index + 1}. ID: ${schedule.id}, カウンセラーID: ${schedule.counselor_id}, 日付: ${schedule.date}, 時間: ${schedule.start_time}-${schedule.end_time}, 利用可能: ${schedule.is_available}`);
        });
      }
    }
    
    // 3. カウンセラーデータの確認
    console.log('\n3. カウンセラーデータ:');
    const { data: counselors, error: counselorsError } = await supabase
      .from('counselors')
      .select('id, user_id, is_active');
    
    if (counselorsError) {
      console.error('カウンセラーデータ取得エラー:', counselorsError);
      console.error('エラー詳細:', counselorsError.message);
      console.error('エラーコード:', counselorsError.code);
    } else {
      console.log('カウンセラー数:', counselors?.length || 0);
      if (counselors && counselors.length > 0) {
        counselors.forEach((counselor, index) => {
          console.log(`${index + 1}. ID: ${counselor.id}, ユーザーID: ${counselor.user_id}, アクティブ: ${counselor.is_active}`);
        });
      }
    }
    
    // 4. 特定のカウンセラーのスケジュール確認
    const counselorId = '35891501-1b36-44c2-bdf7-7c1309eb9d9f';
    console.log(`\n4. カウンセラーID ${counselorId} のスケジュール:`);
    const { data: counselorSchedules, error: counselorError } = await supabase
      .from('schedules')
      .select('*')
      .eq('counselor_id', counselorId)
      .order('date, start_time');
    
    if (counselorError) {
      console.error('カウンセラースケジュール取得エラー:', counselorError);
      console.error('エラー詳細:', counselorError.message);
      console.error('エラーコード:', counselorError.code);
    } else {
      console.log('このカウンセラーのスケジュール数:', counselorSchedules?.length || 0);
      if (counselorSchedules && counselorSchedules.length > 0) {
        counselorSchedules.forEach((schedule, index) => {
          console.log(`${index + 1}. 日付: ${schedule.date}, 時間: ${schedule.start_time}-${schedule.end_time}, 利用可能: ${schedule.is_available}`);
        });
      } else {
        console.log('このカウンセラーのスケジュールはありません');
      }
    }
    
    // 5. 今日から1週間のスケジュール確認
    console.log('\n5. 今日から1週間のスケジュール:');
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    
    const { data: weekSchedules, error: weekError } = await supabase
      .from('schedules')
      .select('*')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date, start_time');
    
    if (weekError) {
      console.error('週間スケジュール取得エラー:', weekError);
      console.error('エラー詳細:', weekError.message);
      console.error('エラーコード:', weekError.code);
    } else {
      console.log('今週のスケジュール数:', weekSchedules?.length || 0);
      if (weekSchedules && weekSchedules.length > 0) {
        weekSchedules.forEach((schedule, index) => {
          console.log(`${index + 1}. 日付: ${schedule.date}, 時間: ${schedule.start_time}-${schedule.end_time}, カウンセラーID: ${schedule.counselor_id}`);
        });
      } else {
        console.log('今週のスケジュールはありません');
      }
    }
    
    // 6. RLSポリシーの確認
    console.log('\n6. RLSポリシーの確認:');
    console.log('匿名キーでは認証されたユーザーのデータにアクセスできません。');
    console.log('ブラウザでログインした状態でのみデータが表示されます。');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkSchedules(); 