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
  { 
    key: 'dashboard', 
    label: 'ダッシュボード',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
      </svg>
    )
  },
  { 
    key: 'schedule', 
    label: 'スケジュール管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    key: 'bookings', 
    label: '予約管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    key: 'chat', 
    label: 'チャット管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  { 
    key: 'reviews', 
    label: 'レビュー管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  },
  { 
    key: 'profile', 
    label: 'プロフィール設定',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
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
  const [activeTab, setActiveTab] = useState('dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 美しいヘッダー */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              カウンセラーダッシュボード
            </h1>
            <p className="text-blue-100 text-lg">ようこそ、{user?.email}さん</p>
          </div>
        </div>

        {/* 美しいメニュータブ */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-2">
              <div className="flex flex-wrap gap-2">
                {MENU.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`
                      relative px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105
                      ${activeTab === item.key
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl ring-4 ring-purple-200 scale-105'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-purple-100 hover:to-blue-100 hover:text-purple-700 shadow-lg hover:shadow-xl'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`
                        p-2 rounded-lg transition-all duration-300
                        ${activeTab === item.key
                          ? 'bg-white/20 backdrop-blur-sm'
                          : 'bg-white/50'
                        }
                      `}>
                        {item.icon}
                      </div>
                      <span className="hidden sm:inline">{item.label}</span>
                    </div>
                    {activeTab === item.key && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-white rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 美しいコンテンツエリア */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ダッシュボード
                  </h2>
                  <p className="text-gray-600 text-lg">カウンセラーの管理画面です</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">総予約数</p>
                        <p className="text-3xl font-bold">0</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">今月の予約</p>
                        <p className="text-3xl font-bold">0</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">総収益</p>
                        <p className="text-3xl font-bold">¥0</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">評価</p>
                        <p className="text-3xl font-bold">5.0</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <CalendarSchedule counselorId={counselorId} />
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    予約管理
                  </h2>
                  <p className="text-gray-600 text-lg">予約の確認と管理を行います</p>
                </div>
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium">予約データがありません</p>
                  <p className="text-gray-400 text-sm mt-2">予約が入るとここに表示されます</p>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    チャット管理
                  </h2>
                  <p className="text-gray-600 text-lg">カウンセラーとお客様のチャットを管理します</p>
                </div>
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium">チャットデータがありません</p>
                  <p className="text-gray-400 text-sm mt-2">チャットが開始されるとここに表示されます</p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    レビュー管理
                  </h2>
                  <p className="text-gray-600 text-lg">お客様からのレビューを確認します</p>
                </div>
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium">レビューデータがありません</p>
                  <p className="text-gray-400 text-sm mt-2">レビューが投稿されるとここに表示されます</p>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    プロフィール設定
                  </h2>
                  <p className="text-gray-600 text-lg">プロフィール情報を管理します</p>
                </div>
                
                <form onSubmit={handleProfileSave} className="max-w-2xl mx-auto space-y-6">
                  {/* プロフィール画像 */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">プロフィール画像</label>
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        {imagePreview ? (
                          <div className="relative">
                            <img 
                              src={imagePreview} 
                              alt="プロフィール画像" 
                              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-4 border-white shadow-lg">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {imageUploading ? 'アップロード中...' : 'クリックまたはドラッグ&ドロップで画像を選択'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (5MB以下)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 基本情報 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
                      <Input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                        placeholder="カウンセラー名"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                        placeholder="example@email.com"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">パスワード（変更する場合のみ入力）</label>
                    <Input
                      type="password"
                      value={profile.password}
                      onChange={(e) => setProfile(p => ({ ...p, password: e.target.value }))}
                      placeholder="新しいパスワード"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">専門分野（カンマ区切り）</label>
                    <Input
                      type="text"
                      value={profile.specialties}
                      onChange={(e) => setProfile(p => ({ ...p, specialties: e.target.value }))}
                      placeholder="例: PTSD治療, うつ病, カップルカウンセリング"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      利用可能な専門分野: {SPECIALTY_TAGS.join(', ')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介</label>
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder="カウンセラーとしての自己紹介を入力してください"
                      rows={6}
                      className="w-full"
                    />
                  </div>

                  {/* 保存ボタン */}
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      disabled={profileLoading}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {profileLoading ? '保存中...' : 'プロフィールを保存'}
                    </Button>
                  </div>

                  {/* メッセージ表示 */}
                  {profileMsg && (
                    <div className={`text-center p-4 rounded-lg ${
                      profileMsg.includes('エラー') 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {profileMsg}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 