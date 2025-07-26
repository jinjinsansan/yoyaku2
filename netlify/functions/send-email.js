const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // CORS設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONSリクエスト（プリフライト）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POSTリクエストのみ処理
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, reservationInfo } = JSON.parse(event.body);

    // Gmail SMTP設定
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // メール送信
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject: 'ご予約ありがとうございます',
      text: `ご予約が完了しました。\n\n${reservationInfo}\n\nご不明点があればご連絡ください。`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('送信成功:', info.response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'メールを送信しました',
        messageId: info.messageId 
      })
    };

  } catch (error) {
    console.error('送信エラー:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'メール送信に失敗しました',
        details: error.message 
      })
    };
  }
}; 