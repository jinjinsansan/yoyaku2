import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

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
  // フォーム用state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // カウンセラー一覧
  const [counselors, setCounselors] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);

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

  // カウンセラー一覧取得
  useEffect(() => {
    if (activeTab === 'counselors') {
      (async () => {
        const { data, error } = await supabase.from('counselors').select('id, user_id, bio, specialties, profile_url, user:users(id, name, email)');
        if (!error) setCounselors(data || []);
      })();
    }
  }, [activeTab, refresh]);

  // カウンセラー登録処理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // 1. Supabase Authにユーザー登録
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role: 'counselor' },
        email_confirm: true
      });
      if (authError) throw new Error(authError.message);
      const userId = authData.user?.id;
      // 2. counselorsテーブルに登録
      const { error: dbError } = await supabase.from('counselors').insert({
        user_id: userId,
        bio: '',
        specialties: [],
        profile_url: '',
        is_active: true
      });
      if (dbError) throw new Error(dbError.message);
      setSuccess('カウンセラーを登録しました');
      setName(''); setEmail(''); setPassword('');
      setRefresh(r => !r);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // カウンセラー削除処理
  const handleDelete = async (counselor: any) => {
    if (!window.confirm('本当に削除しますか？')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // 1. Authユーザー削除
      await supabase.auth.admin.deleteUser(counselor.user.id);
      // 2. counselorsテーブルから削除
      await supabase.from('counselors').delete().eq('id', counselor.id);
      setSuccess('カウンセラーを削除しました');
      setRefresh(r => !r);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              <form className="space-y-4 mb-6" onSubmit={handleRegister}>
                <Input label="カウンセラー名" value={name} onChange={e => setName(e.target.value)} required />
                <Input label="メールアドレス" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input label="パスワード" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <Button type="submit" loading={loading}>登録</Button>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                {success && <div className="text-green-600 text-sm">{success}</div>}
              </form>
              <h3 className="text-lg font-bold mb-2">カウンセラー一覧</h3>
              <div className="space-y-2">
                {counselors.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-100 rounded px-4 py-2">
                    <div>
                      <div className="font-semibold">{c.user?.name}</div>
                      <div className="text-xs text-slate-500">{c.user?.email}</div>
                    </div>
                    <Button variant="outline" color="red" onClick={() => handleDelete(c)} disabled={loading}>削除</Button>
                  </div>
                ))}
              </div>
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