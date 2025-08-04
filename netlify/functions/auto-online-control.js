const { createClient } = require('@supabase/supabase-js');

// Supabaseクライアント初期化（サービスロールキーを使用）
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  console.log('Auto online control job started');

  try {
    // オンライン状態の自動制御を実行
    const { error } = await supabase.rpc('update_auto_online_status');

    if (error) {
      throw new Error(`Auto online status update failed: ${error.message}`);
    }

    // 処理結果を確認
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 最近オンライン状態が変更されたカウンセラーを取得
    const { data: recentStatusChanges, error: statusError } = await supabase
      .from('counselor_online_status')
      .select(`
        counselor_id,
        is_online,
        auto_online_start,
        auto_online_end,
        counselor:counselors!counselor_online_status_counselor_id_fkey (
          user:users!counselors_user_id_fkey (name)
        )
      `)
      .gte('updated_at', fiveMinutesAgo.toISOString());

    // 最近開始されたセッションを取得
    const { data: recentSessions, error: sessionError } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        status,
        auto_started,
        actual_start,
        counselor:counselors!chat_sessions_counselor_id_fkey (
          user:users!counselors_user_id_fkey (name)
        ),
        booking:bookings!chat_sessions_booking_id_fkey (
          user:users!bookings_user_id_fkey (name)
        )
      `)
      .gte('updated_at', fiveMinutesAgo.toISOString())
      .in('status', ['active', 'completed']);

    const result = {
      message: 'Auto online control completed',
      timestamp: now.toISOString(),
      statusChanges: recentStatusChanges?.length || 0,
      sessionUpdates: recentSessions?.length || 0,
      details: {
        statusChanges: recentStatusChanges || [],
        sessionUpdates: recentSessions || []
      }
    };

    console.log('Auto online control completed:', result);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Auto online control error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Auto online control failed',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};