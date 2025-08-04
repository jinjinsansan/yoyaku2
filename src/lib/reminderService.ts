import { supabase } from './supabase';

export interface ReminderJob {
  id: string;
  booking_id: string;
  reminder_type: '24h' | '1h';
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails {
  id: string;
  user_id: string;
  counselor_id: string;
  service_type: string;
  scheduled_at: string;
  status: string;
  amount: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  counselor: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

/**
 * 送信予定のリマインダージョブを取得
 */
export const getPendingReminderJobs = async (): Promise<ReminderJob[]> => {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('reminder_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending reminder jobs:', error);
    throw error;
  }

  return data || [];
};

/**
 * 予約詳細情報を取得
 */
export const getBookingWithDetails = async (bookingId: string): Promise<BookingWithDetails | null> => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      user_id,
      counselor_id,
      service_type,
      scheduled_at,
      status,
      amount,
      user:users!bookings_user_id_fkey (
        id,
        name,
        email
      ),
      counselor:counselors!bookings_counselor_id_fkey (
        id,
        user:users!counselors_user_id_fkey (
          id,
          name,
          email
        )
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching booking details:', error);
    return null;
  }

  return data;
};

/**
 * リマインダーメールを送信
 */
export const sendReminderEmail = async (reminderJob: ReminderJob): Promise<boolean> => {
  try {
    // 予約詳細を取得
    const booking = await getBookingWithDetails(reminderJob.booking_id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Netlify Functionにメール送信をリクエスト
    const response = await fetch('/.netlify/functions/send-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: reminderJob.reminder_type,
        booking: booking
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send reminder email');
    }

    // リマインダージョブのステータスを更新
    const { error: updateError } = await supabase
      .from('reminder_jobs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reminderJob.id);

    if (updateError) {
      console.error('Error updating reminder job status:', updateError);
      throw updateError;
    }

    return true;

  } catch (error) {
    console.error('Error sending reminder email:', error);
    
    // エラー情報をデータベースに記録
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabase
      .from('reminder_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', reminderJob.id);

    return false;
  }
};

/**
 * 期限切れのリマインダージョブをクリーンアップ
 */
export const cleanupExpiredReminderJobs = async (): Promise<void> => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { error } = await supabase
    .from('reminder_jobs')
    .delete()
    .lt('scheduled_at', threeDaysAgo.toISOString())
    .neq('status', 'pending');

  if (error) {
    console.error('Error cleaning up expired reminder jobs:', error);
    throw error;
  }
};

/**
 * リマインダーシステムの手動実行（管理者用）
 */
export const processReminderJobs = async (): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> => {
  const result = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // 送信予定のリマインダージョブを取得
    const pendingJobs = await getPendingReminderJobs();
    result.processed = pendingJobs.length;

    // 各リマインダージョブを処理
    for (const job of pendingJobs) {
      try {
        const success = await sendReminderEmail(job);
        if (success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push(`Failed to send ${job.reminder_type} reminder for booking ${job.booking_id}`);
        }
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error processing job ${job.id}: ${errorMessage}`);
      }
    }

    // 期限切れジョブのクリーンアップ
    await cleanupExpiredReminderJobs();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`System error: ${errorMessage}`);
  }

  return result;
};