const nodemailer = require('nodemailer');

// メール送信設定（Gmailを使用）
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { type, booking } = JSON.parse(event.body);
    
    if (!booking || !booking.user || !booking.counselor) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid booking data' })
      };
    }

    const reminderType = type === '24h' ? '1日前' : '1時間前';
    const scheduledDate = new Date(booking.scheduled_at).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });

    // メール本文作成
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

        ${type === '1h' ? `
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

    // メール送信
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.user.email,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `${reminderType}リマインダーメールを送信しました` 
      })
    };

  } catch (error) {
    console.error('Reminder email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send reminder email',
        details: error.message 
      })
    };
  }
};