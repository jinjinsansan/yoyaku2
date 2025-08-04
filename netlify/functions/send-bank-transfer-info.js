const nodemailer = require('nodemailer');

// メール送信設定（Gmailを使用）
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 銀行口座情報（実際の運用時は環境変数に設定）
const BANK_INFO = {
  bankName: '三菱UFJ銀行',
  branchName: '新宿支店',
  accountType: '普通',
  accountNumber: '1234567',
  accountHolder: 'カウンセリング サービス カブシキガイシャ',
  transferDeadline: 3 // 振込期限（日数）
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { booking, user, counselor, service } = JSON.parse(event.body);
    
    if (!booking || !user || !counselor || !service) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required data' })
      };
    }

    // 振込期限を計算
    const transferDeadline = new Date();
    transferDeadline.setDate(transferDeadline.getDate() + BANK_INFO.transferDeadline);
    
    const transferDeadlineStr = transferDeadline.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    // 予約日時のフォーマット
    const scheduledDate = new Date(booking.scheduled_at).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });

    // メール本文作成
    const subject = '【銀行振込のご案内】カウンセリング予約の決済について';
    const htmlContent = `
      <div style="font-family: 'Hiragino Sans', 'ヒラギノ角ゴシック', 'Yu Gothic', 'メイリオ', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px;">🏦 銀行振込のご案内</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">カウンセリング予約の決済について</p>
        </div>
        
        <div style="background: #f8f9ff; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
          <h2 style="color: #333; margin-top: 0;">ご予約内容</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">お客様名：</td>
              <td style="padding: 8px 0; color: #333;">${user.name}様</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">カウンセラー：</td>
              <td style="padding: 8px 0; color: #333;">${counselor.user.name}先生</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">サービス：</td>
              <td style="padding: 8px 0; color: #333;">${service.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">予約日時：</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold;">${scheduledDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">料金：</td>
              <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold; color: #e74c3c;">¥${booking.amount.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ 重要：振込期限</h3>
          <p style="color: #856404; margin: 10px 0; font-size: 16px; font-weight: bold;">
            ${transferDeadlineStr}までにお振込みください
          </p>
          <p style="color: #856404; margin: 5px 0; font-size: 14px;">
            期限までにお振込みが確認できない場合、予約がキャンセルされる可能性があります。
          </p>
        </div>

        <div style="background: #e8f5e8; border: 1px solid #c3e6c3; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="color: #2d5a2d; margin-top: 0;">💰 お振込み先口座</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; padding: 15px;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; font-weight: bold; color: #555; width: 30%;">銀行名：</td>
              <td style="padding: 12px 0; color: #333; font-size: 16px; font-weight: bold;">${BANK_INFO.bankName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; font-weight: bold; color: #555;">支店名：</td>
              <td style="padding: 12px 0; color: #333; font-size: 16px; font-weight: bold;">${BANK_INFO.branchName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; font-weight: bold; color: #555;">口座種別：</td>
              <td style="padding: 12px 0; color: #333; font-size: 16px;">${BANK_INFO.accountType}預金</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0; font-weight: bold; color: #555;">口座番号：</td>
              <td style="padding: 12px 0; color: #333; font-size: 18px; font-weight: bold; font-family: monospace;">${BANK_INFO.accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #555;">口座名義：</td>
              <td style="padding: 12px 0; color: #333; font-size: 14px; font-weight: bold;">${BANK_INFO.accountHolder}</td>
            </tr>
          </table>
        </div>

        <div style="background: #e7f3ff; border: 1px solid #b8daff; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="color: #004085; margin-top: 0;">📝 お振込み時のご注意</h3>
          <ul style="color: #004085; padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 8px;">振込名義人は<strong>「${user.name}」</strong>でお振込みください</li>
            <li style="margin-bottom: 8px;">振込手数料はお客様ご負担となります</li>
            <li style="margin-bottom: 8px;">領収書が必要な場合は、振込完了後にお知らせください</li>
            <li style="margin-bottom: 8px;">お振込み確認後、予約確定メールをお送りします</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.SITE_URL}/dashboard" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; display: inline-block;">
            マイページで予約を確認
          </a>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 30px;">
          <h4 style="color: #333; margin-top: 0;">お振込み完了のご連絡</h4>
          <p style="color: #666; margin-bottom: 15px;">
            お振込みが完了しましたら、以下の情報をお知らせください：
          </p>
          <ul style="color: #666; padding-left: 20px;">
            <li>お振込み日時</li>
            <li>お振込み金額</li>
            <li>振込名義人名</li>
          </ul>
          <p style="color: #666; margin-top: 15px;">
            <strong>連絡先：</strong> ${process.env.EMAIL_USER}<br>
            <strong>件名：</strong> 振込完了報告 - ${user.name}様
          </p>
        </div>

        <div style="background: #ffe6e6; border: 1px solid #ffcccc; padding: 20px; border-radius: 10px; margin-top: 25px;">
          <h4 style="color: #cc0000; margin-top: 0;">⚠️ キャンセルポリシー</h4>
          <ul style="color: #cc0000; padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 5px;">予約日の2日前まで：全額返金</li>
            <li style="margin-bottom: 5px;">予約日の前日：50%返金</li>
            <li style="margin-bottom: 5px;">予約日当日：返金不可</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 14px; margin: 0;">
            ご不明な点がございましたら、お気軽にお問い合わせください。<br>
            心理カウンセリング予約システム
          </p>
        </div>
      </div>
    `;

    // メール送信
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: '銀行振込案内メールを送信しました',
        transferDeadline: transferDeadlineStr,
        bankInfo: BANK_INFO
      })
    };

  } catch (error) {
    console.error('Bank transfer email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send bank transfer email',
        details: error.message 
      })
    };
  }
};