import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const MENU = [
  { key: 'stats', label: '売上統計', disabled: true },
  { key: 'users', label: 'ユーザー管理', disabled: true },
  { key: 'counselors', label: 'カウンセラー登録', disabled: false },
  { key: 'payments', label: '決済履歴', disabled: true },
  { key: 'settings', label: 'システム設定', disabled: true },
];

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('counselors');

  // 管理者以外はアクセス不可
  if (!isAuthenticated || user?.email !== 'goldbenchan@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="text-center p-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">アクセス権限がありません</h2>
          <p className="text-slate-600">このページはマスター管理者のみアクセス可能です。</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">マスター管理画面</h1>
        <div className="flex space-x-4 mb-8">
          {MENU.map(menu => (
            <Button
              key={menu.key}
              variant={activeTab === menu.key ? 'primary' : 'outline'}
              onClick={() => setActiveTab(menu.key)}
              disabled={menu.disabled}
              className={menu.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {menu.label}
            </Button>
          ))}
        </div>
        <div>
          {activeTab === 'counselors' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">カウンセラー登録</h2>
              {/* ここにカウンセラー登録フォームを今後実装 */}
              <p className="text-slate-600">カウンセラー登録機能をここに実装します。</p>
            </Card>
          )}
          {activeTab !== 'counselors' && (
            <Card className="p-6 text-slate-400 text-center">
              <p>この機能は現在ご利用いただけません。</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 