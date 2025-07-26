import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { CalendarSchedule } from '../components/counselor/CalendarSchedule';

const MENU = [
  { key: 'profile', label: 'プロフィール編集' },
  { key: 'schedule', label: 'スケジュール管理' },
  { key: 'bookings', label: '予約管理' },
  { key: 'chat', label: 'チャット' },
  { key: 'users', label: 'ユーザー一覧' },
  { key: 'sales', label: '売上' },
  { key: 'memo', label: 'メモ書き' },
];

// 専門分野タグ一覧
const SPECIALTY_TAGS = [
  'EMDR療法', 'PTSD', 'PTSD治療', 'うつ病', 'カップルカウンセリング', 'キャリアカウンセリング',
  'コミュニケーション', 'ストレス管理', 'トラウマケア', 'リハビリテーション', 'ワークライフバランス',
  '不安症', '不安障害', '人間関係', '依存症治療', '再発防止', '回復支援', '子育て支援',
  '学校生活相談', '安全な環境作り', '家族療法', '思春期カウンセリング', '発達障害支援',
  '職場メンタルヘルス', '認知行動療法', '転職相談'
];

export const CounselorDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isCounselor, setIsCounselor] = useState<boolean | null>(null);
  const [counselorId, setCounselorId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // プロフィール編集用state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    password: '',
    profileImage: '',
    bio: '',
    specialties: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);

  // 予約管理用
  const [counselorBookings, setCounselorBookings] = useState<any[]>([]);

  // チャット管理用
  const [chatRooms, setChatRooms] = useState<any[]>([]);

  // ユーザー一覧用
  const [userList, setUserList] = useState<any[]>([]);

  // 売上用
  const [sales, setSales] = useState({ total: 0, count: 0, monthly: {} });

  // メモ書き用
  const [memo, setMemo] = useState('');
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoMsg, setMemoMsg] = useState('');

  // カウンセラー判定: counselorsテーブルに自分のuser_idが存在するか
  useEffect(() => {
    if (user) {
      (async () => {
        const { data, error } = await supabase.from('counselors').select('id').eq('user_id', user.id).limit(1);
        // デバッグログを削除
        setIsCounselor(Array.isArray(data) && data.length > 0);
        // counselorIdを設定
        if (data && data.length > 0) {
          setCounselorId(data[0].id);
        }
        if (error) {
          console.error('counselors判定APIエラー', error);
        }
      })();
    } else {
      setIsCounselor(false);
    }
  }, [user]);

  // 予約管理用useEffect
  useEffect(() => {
    if (activeTab === 'bookings' && user && isCounselor === true) {
      (async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, user:users(*), counselor:counselors(*)')
          .eq('counselor_id', user.id)
          .order('scheduled_at', { ascending: false });
        if (!error) setCounselorBookings(data || []);
      })();
    }
  }, [activeTab, user, isCounselor]);

  // チャット管理用useEffect
  useEffect(() => {
    if (activeTab === 'chat' && user && isCounselor === true) {
      (async () => {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('id, booking:bookings(*, user:users(*)), chat_messages(message, created_at)')
          .order('created_at', { ascending: false });
        if (!error && data) {
          // カウンセラー自身の予約のみ抽出
          const filtered = data.filter((room: any) => room.booking?.counselor_id === user.id);
          setChatRooms(filtered);
        }
      })();
    }
  }, [activeTab, user, isCounselor]);

  // ユーザー一覧用useEffect
  useEffect(() => {
    if (activeTab === 'users' && user && isCounselor === true) {
      (async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select('user:users(id, name, email)')
          .eq('counselor_id', user.id);
        if (!error && data) {
          // ユーザーごとに予約回数を集計
          const userMap: Record<string, { id: string, name: string, email: string, count: number }> = {};
          data.forEach((b: any) => {
            if (b.user && b.user.id) {
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
  }, [activeTab, user, isCounselor]);

  // 売上用useEffect
  useEffect(() => {
    if (activeTab === 'sales' && user && isCounselor === true) {
      (async () => {
        const { data, error } = await supabase
          .from('payments')
          .select('amount, status, created_at, booking:bookings(counselor_id)')
          .eq('status', 'completed');
        if (!error && data) {
          // カウンセラー自身の売上のみ集計
          const filtered = data.filter((p: any) => p.booking?.counselor_id === user.id);
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
  }, [activeTab, user, isCounselor]);

  // メモ書き用useEffect
  useEffect(() => {
    if (activeTab === 'memo' && user && isCounselor === true) {
      (async () => {
        const { data, error } = await supabase.from('counselors').select('bio').eq('user_id', user.id).limit(1).maybeSingle();
        if (!error && data) setMemo(data.bio || '');
        if (error) {
          setMemo('');
          console.error('メモ取得APIエラー', error);
        }
      })();
    }
  }, [activeTab, user, isCounselor]);

  // 初期値取得
  useEffect(() => {
    if (user && isCounselor === true) {
      (async () => {
        const { data, error } = await supabase.from('counselors').select('profile_image, bio, specialties').eq('user_id', user.id).limit(1).maybeSingle();
        if (data) {
          console.log('初期値取得 data.specialties:', data.specialties);
          setProfile(p => ({
            ...p,
            name: user.user_metadata?.name || '',
            email: user.email || '',
            profileImage: data.profile_image || '',
            bio: data.bio || '',
            specialties: Array.isArray(data.specialties) && data.specialties.length > 0 
              ? data.specialties.filter(s => s && s.trim().length > 0).join(',') 
              : ''
          }));
          if (data.profile_image) {
            setImagePreview(data.profile_image);
          }
        }
        if (error) {
          console.error('プロフィール初期値取得APIエラー', error);
        }
      })();
    }
  }, [user, isCounselor]); // userまたはisCounselorが変更された時のみ実行

  // カウンセラー以外はアクセス不可
  if (!isAuthenticated || isCounselor === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="text-center p-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">アクセス権限がありません</h2>
          <p className="text-slate-600">このページはカウンセラーのみアクセス可能です。</p>
        </Card>
      </div>
    );
  }
  if (isCounselor === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">判定中...</div>
      </div>
    );
  }

  // メモ保存
  const handleMemoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemoLoading(true);
    setMemoMsg('');
    try {
      if (!user) throw new Error('ユーザー情報が取得できません');
      await supabase.from('counselors').update({ bio: memo }).eq('user_id', user.id);
      setMemoMsg('保存しました');
    } catch (err: any) {
      setMemoMsg('エラー: ' + err.message);
    } finally {
      setMemoLoading(false);
    }
  };

  // プロフィール保存
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      if (!user) throw new Error('ユーザー情報が取得できません');
      // Auth情報更新
      if (profile.email !== user.email || profile.name !== user.user_metadata?.name) {
        await supabase.auth.updateUser({
          email: profile.email,
          data: { name: profile.name }
        });
      }
      if (profile.password) {
        await supabase.auth.updateUser({ password: profile.password });
      }
      // counselorsテーブル更新
      console.log('保存前 profile.specialties:', profile.specialties);
      const { error: updateError } = await supabase.from('counselors').update({
        profile_image: profile.profileImage,
        bio: profile.bio,
        specialties: profile.specialties.trim() 
          ? profile.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : []
      }).eq('user_id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setProfileMsg('プロフィールを更新しました');
      setProfile(p => ({ ...p, password: '' }));
    } catch (err: any) {
      setProfileMsg('エラー: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // 画像アップロード処理
  const handleImageUpload = async (file: File) => {
    if (!user) return;
    
    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      setProfileMsg('画像ファイルを選択してください');
      return;
    }
    
    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg('ファイルサイズは5MB以下にしてください');
      return;
    }

    setImageUploading(true);
    setProfileMsg('');

    try {
      // ファイル名をユニークにする
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // プロフィールを更新
      setProfile(prev => ({ ...prev, profileImage: publicUrl }));
      setImagePreview(publicUrl);
      setProfileMsg('画像をアップロードしました');

    } catch (error: any) {
      console.error('画像アップロードエラー:', error);
      
      // バケットが存在しない場合のエラーハンドリング
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        setProfileMsg('画像アップロード機能の設定が完了していません。管理者にお問い合わせください。');
      } else {
        setProfileMsg('画像のアップロードに失敗しました: ' + error.message);
      }
    } finally {
      setImageUploading(false);
    }
  };

  // ファイル選択処理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // ドラッグ&ドロップ処理
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // 画像削除処理
  const handleRemoveImage = () => {
    setProfile(prev => ({ ...prev, profileImage: '' }));
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">カウンセラーダッシュボード</h1>
        
        {/* メニュータブ */}
        <div className="mb-8">
          {/* デスクトップ用タブ */}
          <div className="hidden md:flex flex-wrap gap-2">
            {MENU.map(menu => (
              <Button
                key={menu.key}
                variant={activeTab === menu.key ? 'primary' : 'outline'}
                onClick={() => setActiveTab(menu.key)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${activeTab === menu.key 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }
                `}
              >
                {menu.label}
              </Button>
            ))}
          </div>
          
          {/* モバイル用タブ */}
          <div className="md:hidden">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <div className="grid grid-cols-2 gap-1">
                {MENU.map(menu => (
                  <Button
                    key={menu.key}
                    variant={activeTab === menu.key ? 'primary' : 'outline'}
                    onClick={() => setActiveTab(menu.key)}
                    className={`
                      px-3 py-2 text-sm rounded-md font-medium transition-all duration-200
                      ${activeTab === menu.key 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-transparent text-gray-700 border-transparent hover:bg-gray-50'
                      }
                    `}
                  >
                    {menu.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">プロフィール編集</h2>
              <form className="space-y-4" onSubmit={handleProfileSave}>
                <Input label="名" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
                <Input label="メールアドレス" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} required />
                <Input label="パスワード（変更時のみ入力）" type="password" value={profile.password} onChange={e => setProfile(p => ({ ...p, password: e.target.value }))} />
                
                {/* プロフィール画像アップロード */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">プロフィール画像</label>
                  
                  {/* 画像プレビュー */}
                  {(imagePreview || profile.profileImage) && (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview || profile.profileImage} 
                        alt="プロフィール画像" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* アップロードエリア */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      imageUploading 
                        ? 'border-slate-300 bg-slate-50' 
                        : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={imageUploading}
                    />
                    
                    {imageUploading ? (
                      <div className="space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                        <p className="text-sm text-slate-600">アップロード中...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                        <div>
                          <p className="text-sm text-slate-600">
                            クリックして画像を選択、またはドラッグ&ドロップ
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            PNG, JPG, GIF (5MB以下)
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          画像を選択
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <Textarea label="自己紹介" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                <Input label="専門分野（カンマ区切り）" value={profile.specialties} onChange={e => setProfile(p => ({ ...p, specialties: e.target.value }))} />
                <div className="flex flex-wrap gap-2 mb-2">
                  {SPECIALTY_TAGS.map(tag => {
                    const selected = profile.specialties.split(',').map(s => s.trim()).includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-indigo-50'}`}
                        onClick={() => {
                          const current = profile.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
                          let next;
                          if (selected) {
                            next = current.filter(s => s !== tag);
                          } else {
                            next = [...current, tag];
                          }
                          setProfile(p => ({ ...p, specialties: next.join(',') }));
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
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
                  {activeTab === 'schedule' && (
          <CalendarSchedule counselorId={counselorId} />
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