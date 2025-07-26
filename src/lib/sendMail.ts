import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // .envファイルなどで設定
    pass: process.env.GMAIL_APP_PASSWORD, // .envファイルなどで設定
  },
});

export async function sendReservationMail(to: string, reservationInfo: string) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'ご予約ありがとうございます',
    text: `ご予約が完了しました。\n\n${reservationInfo}\n\nご不明点があればご連絡ください。`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('送信成功:', info.response);
    return true;
  } catch (error) {
    console.error('送信エラー:', error);
    return false;
  }
} 