const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Supabaseクライアント初期化
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// メール送信設定
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// リマインダーメール送信関数
const sendReminderEmail = async (reminderJob, booking) => {
  const reminderType = reminderJob.reminder_type === '24h' ? '1日前' : '1時間前';
  const scheduledDate = new Date(booking.scheduled_at).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  });

  const subject = `【カウンセリング予約リマインダー】${reminderType}のお知らせ`;
  const htmlContent = `
    <div style="font-family: 'Hiragino Sans', 'ヒラギノ角ゴシック', 'Yu Gothic', 'メイリオ', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px;">カウンセリング予約リマインダー</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">${reminderType}のお知らせ</p>
      </div>
      
      <div style="background: #f8f9ff; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">予約詳細</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">お客様名：</td>
            <td style="padding: 8px 0; color: #333;">${booking.user.name}様</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">カウンセラー：</td>
            <td style="padding: 8px 0; color: #333;">${booking.counselor.user.name}先生</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">予約日時：</td>
            <td style="padding: 8px 0; color: #333; font-size: 16px; font-weight: bold;">${scheduledDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">サービス：</td>
            <td style="padding: 8px 0; color: #333;">
              ${booking.service_type === 'monthly' ? 'カウンセリング1ヶ月コース' : 
                booking.service_type === 'single' ? 'カウンセリング1回分' : 'チャット予約'}
            </td>
          </tr>
        </table>
      </div>

      ${reminderJob.reminder_type === '1h' ? `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
        <h3 style="color: #856404; margin-top: 0;">⏰ まもなく開始時間です</h3>
        <p style="color: #856404; margin: 10px 0;">
          カウンセリング開始まで残り1時間です。<br>
          チャットルームの準備を整えてお待ちください。
        </p>
      </div>
      ` : `
      <div style="background: #e7f3ff; border: 1px solid #b8daff; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
        <h3 style="color: #004085; margin-top: 0;">📅 明日がカウンセリング予定日です</h3>
        <p style="color: #004085; margin: 10px 0;">
          カウンセリング予定日の前日になりました。<br>
          当日は時間に余裕を持ってご準備ください。
        </p>
      </div>
      `}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.SITE_URL}/chat/${booking.id}" 
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
          チャットルームに入る
        </a>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 30px;">
        <h4 style="color: #333; margin-top: 0;">ご注意事項</h4>
        <ul style="color: #666; padding-left: 20px;">
          <li>予約の変更・キャンセルは、開始時間の2時間前までにお願いします。</li>
          <li>チャットルームは予約時間の5分前から入室可能です。</li>
          <li>技術的な問題がございましたら、サポートまでお気軽にお問い合わせください。</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #888; font-size: 14px; margin: 0;">
          このメールは自動送信されています。<br>
          心理カウンセリング予約システム
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: booking.user.email,
    subject: subject,
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
};

// メイン処理関数
exports.handler = async (event, context) => {
  // Netlify Scheduledでの実行またはcronジョブからの呼び出し
  console.log('Scheduled reminder job started');

  try {
    const now = new Date().toISOString();
    
    // 送信予定のリマインダージョブを取得
    const { data: reminderJobs, error: jobsError } = await supabase
      .from('reminder_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });

    if (jobsError) {
      throw new Error(`Error fetching reminder jobs: ${jobsError.message}`);
    }

    if (!reminderJobs || reminderJobs.length === 0) {
      console.log('No pending reminder jobs found');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No pending reminder jobs', 
          processed: 0 
        })
      };
    }

    let successful = 0;
    let failed = 0;
    const errors = [];

    // 各リマインダージョブを処理
    for (const job of reminderJobs) {
      try {
        // 予約詳細を取得
        const { data: booking, error: bookingError } = await supabase
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
          .eq('id', job.booking_id)
          .single();

        if (bookingError || !booking) {
          throw new Error(`Booking not found: ${job.booking_id}`);
        }

        // メール送信
        await sendReminderEmail(job, booking);

        // ジョブステータスを更新
        const { error: updateError } = await supabase
          .from('reminder_jobs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (updateError) {
          console.error('Error updating job status:', updateError);
        }

        successful++;
        console.log(`Successfully sent ${job.reminder_type} reminder for booking ${job.booking_id}`);

      } catch (error) {
        failed++;
        const errorMessage = error.message || 'Unknown error';
        errors.push(`Job ${job.id}: ${errorMessage}`);
        
        // エラー情報をデータベースに記録
        await supabase
          .from('reminder_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.error(`Failed to process reminder job ${job.id}:`, error);
      }
    }

    // 期限切れジョブのクリーンアップ（3日前より古いもの）
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await supabase
      .from('reminder_jobs')
      .delete()
      .lt('scheduled_at', threeDaysAgo.toISOString())
      .neq('status', 'pending');

    const result = {
      message: 'Reminder processing completed',
      processed: reminderJobs.length,
      successful,
      failed,
      errors
    };

    console.log('Reminder job completed:', result);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Scheduled reminder job error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Scheduled reminder job failed',
        details: error.message 
      })
    };
  }
};