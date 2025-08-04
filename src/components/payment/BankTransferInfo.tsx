import React, { useState } from 'react';
import { Copy, Building2, Clock, Mail } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';

interface BankTransferInfoProps {
  amount: number;
  bookingId: string;
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
  service: {
    id: string;
    name: string;
    price: number;
  };
  scheduledAt: string;
  onConfirm: () => void;
}

export const BankTransferInfo: React.FC<BankTransferInfoProps> = ({
  amount,
  bookingId,
  user,
  counselor,
  service,
  scheduledAt,
  onConfirm
}) => {
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const bankInfo = {
    bankName: '三菱UFJ銀行',
    branchName: '新宿支店',
    accountType: '普通',
    accountNumber: '1234567',
    accountName: 'カウンセリング サービス カブシキガイシャ'
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`${label}をコピーしました`);
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const sendBankTransferEmail = async () => {
    setEmailSending(true);
    try {
      const response = await fetch('/.netlify/functions/send-bank-transfer-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking: {
            id: bookingId,
            amount,
            scheduled_at: scheduledAt
          },
          user,
          counselor,
          service
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      setEmailSent(true);
    } catch (error) {
      console.error('Error sending bank transfer email:', error);
      alert('メール送信に失敗しました。お手数ですが、画面の情報を保存してください。');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <Card>
      <div className="space-y-6">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            銀行振込
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(amount)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            振込先情報
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded border">
              <span className="text-slate-600 font-medium">銀行名</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">{bankInfo.bankName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo.bankName, '銀行名')}
                  className="p-1 h-auto hover:bg-green-50"
                  title="銀行名をコピー"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded border">
              <span className="text-slate-600 font-medium">支店名</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">{bankInfo.branchName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo.branchName, '支店名')}
                  className="p-1 h-auto hover:bg-green-50"
                  title="支店名をコピー"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded border">
              <span className="text-slate-600 font-medium">口座種別</span>
              <span className="font-bold text-lg">{bankInfo.accountType}預金</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded border">
              <span className="text-slate-600 font-medium">口座番号</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl font-mono text-green-700">{bankInfo.accountNumber}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo.accountNumber, '口座番号')}
                  className="p-1 h-auto hover:bg-green-50"
                  title="口座番号をコピー"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded border">
              <span className="text-slate-600 font-medium">口座名義</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">{bankInfo.accountName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo.accountName, '口座名義')}
                  className="p-1 h-auto hover:bg-green-50"
                  title="口座名義をコピー"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {copyMessage && (
            <div className="mt-3 p-2 bg-green-100 text-green-700 rounded text-sm text-center">
              ✓ {copyMessage}
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <h5 className="font-medium text-amber-800 mb-2">振込時の注意事項</h5>
              <ul className="text-amber-700 space-y-1">
                <li>• 振込名義人は「<strong>{user.name}</strong>」でお願いします</li>
                <li>• 振込手数料はお客様負担となります</li>
                <li>• 振込確認後、予約が確定されます（通常1-2営業日）</li>
                <li>• 振込期限：予約日の3営業日前まで</li>
                <li>• 領収書が必要な場合は、振込完了後にお知らせください</li>
              </ul>
            </div>
          </div>
        </div>

        {/* メール送信セクション */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-medium text-blue-800 mb-2">振込案内メール</h5>
              <p className="text-sm text-blue-700 mb-3">
                振込先情報を詳細に記載したメールをお送りします。メール内容には振込期限や注意事項も含まれています。
              </p>
              <Button
                onClick={sendBankTransferEmail}
                loading={emailSending}
                disabled={emailSent}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {emailSent ? '✓ メール送信済み' : emailSending ? '送信中...' : '振込案内メールを送信'}
              </Button>
              {emailSent && (
                <p className="text-xs text-blue-600 mt-2 text-center">
                  {user.email} に送信しました
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-600 mb-2">
            振込予約ID: <span className="font-mono font-medium bg-slate-100 px-2 py-1 rounded">{bookingId.slice(-8)}</span>
          </p>
          <p className="text-xs text-slate-500 mb-4">
            振込完了報告時にこのIDをお知らせください
          </p>
          <Button onClick={onConfirm} className="w-full bg-green-600 hover:bg-green-700">
            振込予約を確定する
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            確定後、振込確認まで予約は仮予約状態となります
          </p>
        </div>
      </div>
    </Card>
  );
};