import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { Textarea } from '../components/ui/Textarea';

const MENU = [
  { key: 'stats', label: '売上統計', disabled: true },
  { key: 'users', label: 'ユーザー管理', disabled: true },
  { key: 'counselors', label: 'カウンセラー登録', disabled: false },
  { key: 'payments', label: '決済履歴', disabled: true },
  { key: 'settings', label: 'システム設定', disabled: true },
];

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  // デバッグログを削除
  const [activeTab, setActiveTab] = useState('counselors');
  // フォーム用state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // フォーム用
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // カウンセラー一覧
  const [counselors, setCounselors] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);

  // カウンセラー一覧取得
  useEffect(() => {
    if (activeTab === 'counselors') {
      (async () => {
        const { data, error } = await supabase
          .from('counselors')
          .select('id, user_id, bio, specialties, profile_image, profile_url, hourly_rate, is_active, rating, review_count, user:users(id, name, email, avatar, phone), created_at, updated_at');
        if (!error) setCounselors(data || []);
      })();
    }
  }, [activeTab, refresh]);

  // 編集用state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  // 編集開始
  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setEditProfile({
      name: c.user?.name || '',
      email: c.user?.email || '',
      phone: c.user?.phone || '',
      avatar: c.user?.avatar || '',
      profileImage: c.profile_image || '',
      bio: c.bio || '',
      specialties: Array.isArray(c.specialties) && c.specialties.length > 0 
        ? c.specialties.filter((s: string) => s && s.trim().length > 0).join(',') 
        : '',
      profileUrl: c.profile_url || '',
      hourlyRate: c.hourly_rate || 0,
      isActive: c.is_active,
      reviewCount: c.review_count || 0,
      rating: c.rating || 0,
    });
    setEditMsg('');
  };

  // 編集保存
  const handleEditSave = async (id: string, userId: string) => {
    setEditLoading(true);
    setEditMsg('');
    try {
      // usersテーブル更新
      await supabase.from('users').update({
        name: editProfile.name,
        email: editProfile.email,
        phone: editProfile.phone,
        avatar: editProfile.avatar
      }).eq('id', userId);
      // counselorsテーブル更新
      await supabase.from('counselors').update({
        profile_image: editProfile.profileImage,
        bio: editProfile.bio,
        specialties: editProfile.specialties.trim() 
          ? editProfile.specialties.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
          : [],
        profile_url: editProfile.profileUrl,
        hourly_rate: Number(editProfile.hourlyRate),
        is_active: editProfile.isActive,
        review_count: Number(editProfile.reviewCount),
        rating: Number(editProfile.rating)
      }).eq('id', id);
      setEditMsg('保存しました');
      setEditingId(null);
      setRefresh(r => !r);
    } catch (err: any) {
      setEditMsg('エラー: ' + err.message);
    } finally {
      setEditLoading(false);
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
      if (!counselor.user?.id) {
        throw new Error('カウンセラーのユーザーIDが見つかりません');
      }
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }
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

  console.log('rendering AdminPage');
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
              <h2 className="text-xl font-semibold mb-4">カウンセラー一覧</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {counselors.map(c => (
                  <Card key={c.id} className="p-4 flex flex-col gap-4 md:flex-row md:items-start">
                    {editingId === c.id ? (
                      <form className="flex-1 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); if (c.user?.id) handleEditSave(c.id, c.user.id); }}>
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-shrink-0 flex flex-col items-center gap-2">
                            {editProfile.profileImage ? (
                              <img src={editProfile.profileImage} alt={editProfile.name} className="w-20 h-20 rounded-full object-cover border" />
                            ) : (
                              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                                <span className="text-slate-400">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-1 gap-2">
                            <Input label="名前" value={editProfile.name} onChange={e => setEditProfile((p: any) => ({ ...p, name: e.target.value }))} required />
                            <Input label="メールアドレス" type="email" value={editProfile.email} onChange={e => setEditProfile((p: any) => ({ ...p, email: e.target.value }))} required />
                            <Input label="電話番号" value={editProfile.phone || ''} onChange={e => setEditProfile((p: any) => ({ ...p, phone: e.target.value }))} />
                            <Input label="アバターURL" value={editProfile.avatar || ''} onChange={e => setEditProfile((p: any) => ({ ...p, avatar: e.target.value }))} />
                          </div>
                        </div>
                        <Input label="プロフィール画像URL" value={editProfile.profileImage} onChange={e => setEditProfile((p: any) => ({ ...p, profileImage: e.target.value }))} />
                        <Input label="自己紹介" value={editProfile.bio} onChange={e => setEditProfile((p: any) => ({ ...p, bio: e.target.value }))} />
                        <Input label="専門分野（カンマ区切り）" value={editProfile.specialties} onChange={e => setEditProfile((p: any) => ({ ...p, specialties: e.target.value }))} />
                        <Input label="プロフィールURL" value={editProfile.profileUrl} onChange={e => setEditProfile((p: any) => ({ ...p, profileUrl: e.target.value }))} />
                        <Input label="時給" type="number" value={editProfile.hourlyRate} onChange={e => setEditProfile((p: any) => ({ ...p, hourlyRate: e.target.value }))} />
                        <Input label="レビュー数" type="number" value={editProfile.reviewCount || 0} onChange={e => setEditProfile((p: any) => ({ ...p, reviewCount: e.target.value }))} />
                        <Input label="評価" type="number" value={editProfile.rating || 0} onChange={e => setEditProfile((p: any) => ({ ...p, rating: e.target.value }))} />
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={editProfile.isActive} onChange={e => setEditProfile((p: any) => ({ ...p, isActive: e.target.checked }))} />
                          有効
                        </label>
                        <div className="flex gap-2 mt-2">
                          <Button type="submit" loading={editLoading}>保存</Button>
                          <Button type="button" variant="outline" onClick={() => setEditingId(null)}>キャンセル</Button>
                        </div>
                        {editMsg && <div className="text-sm mt-1">{editMsg}</div>}
                      </form>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
                          {c.profile_image ? (
                            <img src={c.profile_image} alt={c.user?.name} className="w-20 h-20 rounded-full object-cover border" />
                          ) : (
                            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                              <span className="text-slate-400">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="font-bold text-lg">{c.user?.name}</div>
                          <div className="text-xs text-slate-500 break-all">{c.user?.email}</div>
                          <div className="text-xs text-slate-500 break-all">電話: {c.user?.phone || '-'}</div>
                          <div className="text-xs text-slate-500 break-all">アバター: {c.user?.avatar || '-'}</div>
                          <div className="text-sm text-slate-600 mt-2">{c.bio}</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(c.specialties || []).map((s: string, i: number) => (
                              <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{s}</span>
                            ))}
                          </div>
                          {c.profile_url && (
                            <a href={c.profile_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 underline break-all">プロフィールサイト</a>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                            <span>レビュー数: {c.review_count}</span>
                            <span>評価: {c.rating}</span>
                            <span>有効: {c.is_active ? '○' : '×'}</span>
                            <span>時給: {c.hourly_rate}円</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">作成日: {c.created_at?.slice(0,10)} / 更新日: {c.updated_at?.slice(0,10)}</div>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => handleEdit(c)}>編集</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
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