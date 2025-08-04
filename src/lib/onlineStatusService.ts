import { supabase } from './supabase';

export interface CounselorOnlineStatus {
  id: string;
  counselor_id: string;
  is_online: boolean;
  last_activity: string;
  auto_online_start: string | null;
  auto_online_end: string | null;
  manual_override: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  booking_id: string;
  counselor_id: string;
  user_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'missed';
  auto_started: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * カウンセラーのオンライン状態を取得
 */
export const getCounselorOnlineStatus = async (counselorId: string): Promise<CounselorOnlineStatus | null> => {
  const { data, error } = await supabase
    .from('counselor_online_status')
    .select('*')
    .eq('counselor_id', counselorId)
    .single();

  if (error) {
    console.error('Error fetching counselor online status:', error);
    return null;
  }

  return data;
};

/**
 * 全てのカウンセラーのオンライン状態を取得
 */
export const getAllCounselorsOnlineStatus = async (): Promise<CounselorOnlineStatus[]> => {
  const { data, error } = await supabase
    .from('counselor_online_status')
    .select(`
      *,
      counselor:counselors!counselor_online_status_counselor_id_fkey (
        id,
        user:users!counselors_user_id_fkey (
          id,
          name
        )
      )
    `)
    .order('last_activity', { ascending: false });

  if (error) {
    console.error('Error fetching all counselors online status:', error);
    throw error;
  }

  return data || [];
};

/**
 * カウンセラーのオンライン状態を手動で変更
 */
export const setCounselorOnlineStatus = async (
  counselorId: string, 
  isOnline: boolean, 
  manualOverride: boolean = true
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('counselor_online_status')
      .update({
        is_online: isOnline,
        manual_override: manualOverride,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // 手動でオフラインにする場合は自動制御情報をクリア
        ...(manualOverride && !isOnline && {
          auto_online_start: null,
          auto_online_end: null
        })
      })
      .eq('counselor_id', counselorId);

    if (error) {
      console.error('Error updating counselor online status:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error setting counselor online status:', error);
    return false;
  }
};

/**
 * カウンセラーの手動オーバーライドを解除（自動制御に戻す）
 */
export const clearManualOverride = async (counselorId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('counselor_online_status')
      .update({
        manual_override: false,
        updated_at: new Date().toISOString()
      })
      .eq('counselor_id', counselorId);

    if (error) {
      console.error('Error clearing manual override:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error clearing manual override:', error);
    return false;
  }
};

/**
 * チャットセッション一覧を取得
 */
export const getChatSessions = async (
  counselorId?: string,
  userId?: string
): Promise<ChatSession[]> => {
  let query = supabase
    .from('chat_sessions')
    .select(`
      *,
      booking:bookings!chat_sessions_booking_id_fkey (
        id,
        service_type,
        amount,
        user:users!bookings_user_id_fkey (
          id,
          name,
          email
        )
      ),
      counselor:counselors!chat_sessions_counselor_id_fkey (
        id,
        user:users!counselors_user_id_fkey (
          id,
          name,
          email
        )
      )
    `)
    .order('scheduled_start', { ascending: false });

  if (counselorId) {
    query = query.eq('counselor_id', counselorId);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching chat sessions:', error);
    throw error;
  }

  return data || [];
};

/**
 * 今日のアクティブなセッションを取得
 */
export const getTodayActiveSessions = async (counselorId?: string): Promise<ChatSession[]> => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  let query = supabase
    .from('chat_sessions')
    .select(`
      *,
      booking:bookings!chat_sessions_booking_id_fkey (
        id,
        service_type,
        user:users!bookings_user_id_fkey (
          id,
          name,
          email
        )
      )
    `)
    .gte('scheduled_start', startOfDay.toISOString())
    .lt('scheduled_start', endOfDay.toISOString())
    .in('status', ['scheduled', 'active'])
    .order('scheduled_start', { ascending: true });

  if (counselorId) {
    query = query.eq('counselor_id', counselorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching today active sessions:', error);
    throw error;
  }

  return data || [];
};

/**
 * セッションのステータスを更新
 */
export const updateSessionStatus = async (
  sessionId: string,
  status: ChatSession['status'],
  notes?: string
): Promise<boolean> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    // セッション開始時の実際の開始時刻を記録
    if (status === 'active') {
      updateData.actual_start = new Date().toISOString();
    }

    // セッション終了時の実際の終了時刻を記録
    if (status === 'completed' || status === 'cancelled') {
      updateData.actual_end = new Date().toISOString();
    }

    const { error } = await supabase
      .from('chat_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session status:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating session status:', error);
    return false;
  }
};

/**
 * オンライン状態の自動制御を実行（管理者用）
 */
export const processAutoOnlineStatus = async (): Promise<{
  processed: number;
  onlineChanged: number;
  sessionsStarted: number;
  sessionsCompleted: number;
  errors: string[];
}> => {
  const result = {
    processed: 0,
    onlineChanged: 0,
    sessionsStarted: 0,
    sessionsCompleted: 0,
    errors: [] as string[]
  };

  try {
    // データベース関数を呼び出してオンライン状態を更新
    const { error } = await supabase.rpc('update_auto_online_status');

    if (error) {
      result.errors.push(`Auto online status update error: ${error.message}`);
      return result;
    }

    // 処理結果を取得するため、最近更新されたレコードを確認
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 最近オンライン状態が変更されたカウンセラー数を取得
    const { data: statusChanges, error: statusError } = await supabase
      .from('counselor_online_status')
      .select('id')
      .gte('updated_at', fiveMinutesAgo.toISOString());

    if (!statusError && statusChanges) {
      result.onlineChanged = statusChanges.length;
    }

    // 最近開始されたセッション数を取得
    const { data: startedSessions, error: startedError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('auto_started', true)
      .gte('actual_start', fiveMinutesAgo.toISOString());

    if (!startedError && startedSessions) {
      result.sessionsStarted = startedSessions.length;
    }

    // 最近完了したセッション数を取得
    const { data: completedSessions, error: completedError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('status', 'completed')
      .gte('updated_at', fiveMinutesAgo.toISOString());

    if (!completedError && completedSessions) {
      result.sessionsCompleted = completedSessions.length;
    }

    result.processed = 1; // 関数が実行されたことを示す

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Process auto online status error: ${errorMessage}`);
  }

  return result;
};

/**
 * オンライン状態のリアルタイム監視を開始
 */
export const subscribeToOnlineStatus = (
  counselorId: string,
  callback: (status: CounselorOnlineStatus | null) => void
) => {
  const subscription = supabase
    .channel(`online-status-${counselorId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'counselor_online_status',
        filter: `counselor_id=eq.${counselorId}`
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null);
        } else {
          callback(payload.new as CounselorOnlineStatus);
        }
      }
    )
    .subscribe();

  return subscription;
};

/**
 * チャットセッションのリアルタイム監視を開始
 */
export const subscribeToSessions = (
  counselorId: string,
  callback: (sessions: ChatSession[]) => void
) => {
  const subscription = supabase
    .channel(`sessions-${counselorId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_sessions',
        filter: `counselor_id=eq.${counselorId}`
      },
      async () => {
        // セッション情報が変更されたら最新のセッション一覧を取得
        try {
          const sessions = await getChatSessions(counselorId);
          callback(sessions);
        } catch (error) {
          console.error('Error fetching updated sessions:', error);
        }
      }
    )
    .subscribe();

  return subscription;
};