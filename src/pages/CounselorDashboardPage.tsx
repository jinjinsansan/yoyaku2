import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';

const MENU = [
  { key: 'profile', label: 'プロフィール編集' },
  { key: 'bookings', label: '予約管理' },
  { key: 'chat', label: 'チャット' },
  { key: 'users', label: 'ユーザー一覧' },
  { key: 'sales', label: '売上' },
  { key: 'memo', label: 'メモ書き' },
];

export const CounselorDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // カウンセラー以外はアクセス不可（仮: user_metadata.role === 'counselor' で判定予定）
  if (!isAuthenticated || user?.user_metadata?.role !== 'counselor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="text-center p-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">アクセス権限がありません</h2>
          <p className="text-slate-600">このページはカウンセラーのみアクセス可能です。</p>
        </Card>
      </div>
    );
  }

  // プロフィール編集用state
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    password: '',
    profileImage: '',
    bio: '',
    specialties: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // 予約管理用
  const { user: authUser } = useAuth();
  const [counselorBookings, setCounselorBookings] = useState<any[]>([]);
  useEffect(() => {
    if (activeTab === 'bookings' && authUser) {
      (async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, user:users(*), counselor:counselors(*)')
          .eq('counselor_id', authUser.id)
          .order('scheduled_at', { ascending: false });
        if (!error) setCounselorBookings(data || []);
      })();
    }
  }, [activeTab, authUser]);

  // チャット管理用
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  useEffect(() => {
    if (activeTab === 'chat' && authUser) {
      (async () => {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('id, booking:bookings(*, user:users(*)), chat_messages(message, created_at)')
          .order('created_at', { ascending: false });
        if (!error && data) {
          // カウンセラー自身の予約のみ抽出
          const filtered = data.filter((room: any) => room.booking?.counselor_id === authUser.id);
          setChatRooms(filtered);
        }
      })();
    }
  }, [activeTab, authUser]);

  // ユーザー一覧用
  const [userList, setUserList] = useState<any[]>([]);
  useEffect(() => {
    if (activeTab === 'users' && authUser) {
      (async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select('user:users(id, name, email)')
          .eq('counselor_id', authUser.id);
        if (!error && data) {
          // ユーザーごとに予約回数を集計
          const userMap: Record<string, { id: string, name: string, email: string, count: number }> = {};
          data.forEach((b: any) => {
            if (b.user) {
              if (!userMap[b.user.id]) {
                userMap[b.user.id] = { ...b.user, count: 1 };
              } else {
                userMap[b.user.id].count++;
              }
            }
          });
          setUserList(Object.values(userMap));
        }
      })();
    }
  }, [activeTab, authUser]);

  // 売上用
  const [sales, setSales] = useState({ total: 0, count: 0, monthly: {} });
  useEffect(() => {
    if (activeTab === 'sales' && authUser) {
      (async () => {
        const { data, error } = await supabase
          .from('payments')
          .select('amount, status, created_at, booking:bookings(counselor_id)')
          .eq('status', 'completed');
        if (!error && data) {
          // カウンセラー自身の売上のみ集計
          const filtered = data.filter((p: any) => p.booking?.counselor_id === authUser.id);
          const total = filtered.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          const count = filtered.length;
          // 月別集計
          const monthly: Record<string, number> = {};
          filtered.forEach((p: any) => {
            const month = p.created_at?.slice(0, 7) || '不明';
            monthly[month] = (monthly[month] || 0) + (p.amount || 0);
          });
          setSales({ total, count, monthly });
        }
      })();
    }
  }, [activeTab, authUser]);

  // メモ書き用
  const [memo, setMemo] = useState('');
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoMsg, setMemoMsg] = useState('');
  useEffect(() => {
    if (activeTab === 'memo' && authUser) {
      (async () => {
        const { data, error } = await supabase.from('counselors').select('memo').eq('user_id', authUser.id).single();
        if (!error && data) setMemo(data.memo || '');
      })();
    }
  }, [activeTab, authUser]);
  const handleMemoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemoLoading(true);
    setMemoMsg('');
    try {
      await supabase.from('counselors').update({ memo }).eq('user_id', authUser.id);
      setMemoMsg('保存しました');
    } catch (err: any) {
      setMemoMsg('エラー: ' + err.message);
    } finally {
      setMemoLoading(false);
    }
  };

  // 初期値取得
  useEffect(() => {
    (async () => {
      if (user) {
        const { data, error } = await supabase.from('counselors').select('profile_image, bio, specialties').eq('user_id', user.id).single();
        if (data) {
          setProfile(p => ({
            ...p,
            profileImage: data.profile_image || '',
            bio: data.bio || '',
            specialties: (data.specialties || []).join(',')
          }));
        }
      }
    })();
  }, [user]);

  // プロフィール保存
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      // Auth情報更新
      if (profile.email !== user?.email || profile.name !== user?.user_metadata?.name) {
        await supabase.auth.updateUser({
          email: profile.email,
          data: { name: profile.name }
        });
      }
      if (profile.password) {
        await supabase.auth.updateUser({ password: profile.password });
      }
      // counselorsテーブル更新
      await supabase.from('counselors').update({
        profile_image: profile.profileImage,
        bio: profile.bio,
        specialties: profile.specialties.split(',').map(s => s.trim())
      }).eq('user_id', user.id);
      setProfileMsg('プロフィールを更新しました');
      setProfile(p => ({ ...p, password: '' }));
    } catch (err: any) {
      setProfileMsg('エラー: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">カウンセラーダッシュボード</h1>
        <div className="flex space-x-4 mb-8">
          {MENU.map(menu => (
            <Button
              key={menu.key}
              variant={activeTab === menu.key ? 'primary' : 'outline'}
              onClick={() => setActiveTab(menu.key)}
            >
              {menu.label}
            </Button>
          ))}
        </div>
        <div>
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">プロフィール編集</h2>
              <form className="space-y-4" onSubmit={handleProfileSave}>
                <Input label="名" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
                <Input label="メールアドレス" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} required />
                <Input label="パスワード（変更時のみ入力）" type="password" value={profile.password} onChange={e => setProfile(p => ({ ...p, password: e.target.value }))} />
                <Input label="プロフィール画像URL" value={profile.profileImage} onChange={e => setProfile(p => ({ ...p, profileImage: e.target.value }))} />
                <Textarea label="自己紹介" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                <Input label="専門分野（カンマ区切り）" value={profile.specialties} onChange={e => setProfile(p => ({ ...p, specialties: e.target.value }))} />
                <Button type="submit" loading={profileLoading}>保存</Button>
                {profileMsg && <div className="text-sm mt-2">{profileMsg}</div>}
              </form>
            </Card>
          )}
          {activeTab === 'bookings' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">予約管理</h2>
              {counselorBookings.length === 0 ? (
                <div className="text-slate-500 text-center py-8">担当する予約はありません。</div>
              ) : (
                <div className="space-y-4">
                  {counselorBookings.map(booking => (
                    <div key={booking.id} className="bg-slate-100 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-semibold">{booking.user?.name} さん</div>
                        <div className="text-xs text-slate-500">{formatDate(booking.scheduled_at)}</div>
                        <div className="text-xs">サービス: {booking.service_type === 'monthly' ? '1ヶ月コース' : '1回分'}</div>
                        <div className="text-xs">金額: {formatCurrency(booking.amount)}</div>
                        <div className="text-xs">ステータス: {booking.status}</div>
                      </div>
                      <div className="mt-2 md:mt-0 flex gap-2">
                        <Button size="sm" onClick={() => window.location.href = `/chat/${booking.id}`}>チャット</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          {activeTab === 'chat' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">チャット一覧</h2>
              {chatRooms.length === 0 ? (
                <div className="text-slate-500 text-center py-8">チャットルームはありません。</div>
              ) : (
                <div className="space-y-4">
                  {chatRooms.map(room => (
                    <div key={room.id} className="bg-slate-100 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-semibold">{room.booking?.user?.name} さん</div>
                        <div className="text-xs text-slate-500">予約日: {formatDate(room.booking?.scheduled_at)}</div>
                        <div className="text-xs">サービス: {room.booking?.service_type === 'monthly' ? '1ヶ月コース' : '1回分'}</div>
                        <div className="text-xs">最新メッセージ: {room.chat_messages?.length > 0 ? room.chat_messages[room.chat_messages.length-1].message : '（未送信）'}</div>
                      </div>
                      <div className="mt-2 md:mt-0 flex gap-2">
                        <Button size="sm" onClick={() => window.location.href = `/chat/${room.booking?.id}`}>チャットルームへ</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          {activeTab === 'users' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">ユーザー一覧</h2>
              {userList.length === 0 ? (
                <div className="text-slate-500 text-center py-8">担当したユーザーはいません。</div>
              ) : (
                <div className="space-y-2">
                  {userList.map(user => (
                    <div key={user.id} className="bg-slate-100 rounded px-4 py-2 flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                      <div className="text-xs">予約回数: {user.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          {activeTab === 'sales' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">売上</h2>
              <div className="mb-4">
                <div className="text-lg font-bold">合計売上: {formatCurrency(sales.total)}</div>
                <div className="text-sm text-slate-600">件数: {sales.count}</div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">月別売上</h3>
                <div className="space-y-1">
                  {Object.entries(sales.monthly).length === 0 ? (
                    <div className="text-slate-400">データなし</div>
                  ) : (
                    Object.entries(sales.monthly).map(([month, amount]) => (
                      <div key={month} className="flex justify-between">
                        <span>{month}</span>
                        <span>{formatCurrency(amount as number)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          )}
          {activeTab === 'memo' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">メモ書き</h2>
              <form onSubmit={handleMemoSave} className="space-y-4">
                <Textarea label="メモ" value={memo} onChange={e => setMemo(e.target.value)} rows={8} />
                <Button type="submit" loading={memoLoading}>保存</Button>
                {memoMsg && <div className="text-sm mt-2">{memoMsg}</div>}
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 