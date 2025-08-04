import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

import { useCounselorChat } from '../hooks/useCounselorChat';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { supabase } from '../lib/supabase';

import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { UnifiedScheduleManager } from '../components/counselor/UnifiedScheduleManager';
import { UnifiedClientManager } from '../components/counselor/UnifiedClientManager';
import { UnifiedAnalyticsDashboard } from '../components/counselor/UnifiedAnalyticsDashboard';
import { 
  getCounselorOnlineStatus, 
  setCounselorOnlineStatus, 
  clearManualOverride,
  getTodayActiveSessions,
  subscribeToOnlineStatus,
  subscribeToSessions,
  type CounselorOnlineStatus,
  type ChatSession
} from '../lib/onlineStatusService';

const MENU = [
  { 
    key: 'dashboard', 
    label: 'ダッシュボード',
    description: '概要と分析',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    key: 'schedule', 
    label: 'スケジュール',
    description: 'スケジュール・予約管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    key: 'clients', 
    label: 'クライアント',
    description: 'クライアント・セッション管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    key: 'communication', 
    label: 'コミュニケーション',
    description: 'チャット・レビュー管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  { 
    key: 'settings', 
    label: '設定',
    description: 'プロフィール・システム設定',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
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

  // チャット管理用
  const { chatRooms, loading: chatLoading, error: chatError, refetch: refetchChat } = useCounselorChat();

  // オンライン状態管理用
  const [onlineStatus, setOnlineStatus] = useState<CounselorOnlineStatus | null>(null);
  const [todaySessions, setTodaySessions] = useState<ChatSession[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineMsg, setOnlineMsg] = useState('');



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

  // チャット管理用useEffect（新しいフックで管理されるため削除）
  // useEffect(() => {
  //   if (activeTab === 'chat' && user && isCounselor === true) {
  //     // useCounselorChatフックで管理されるため、ここでは何もしない
  //   }
  // }, [activeTab, user, isCounselor]);

  // 初期値取得
  useEffect(() => {
    if (user && isCounselor === true) {
      (async () => {
        const { data, error } = await supabase.from('counselors').select('profile_image, bio, specialties').eq('user_id', user.id).limit(1).maybeSingle();
        if (data) {
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

  // オンライン状態とセッション情報の取得
  useEffect(() => {
    if (counselorId && isCounselor === true) {
      loadOnlineStatus();
      loadTodaySessions();
      
      // リアルタイム監視を開始
      const statusSubscription = subscribeToOnlineStatus(counselorId, (status) => {
        setOnlineStatus(status);
      });
      
      const sessionsSubscription = subscribeToSessions(counselorId, (sessions) => {
        setTodaySessions(sessions.filter(session => {
          const today = new Date();
          const sessionDate = new Date(session.scheduled_start);
          return sessionDate.toDateString() === today.toDateString();
        }));
      });

      // クリーンアップ
      return () => {
        statusSubscription.unsubscribe();
        sessionsSubscription.unsubscribe();
      };
    }
  }, [counselorId, isCounselor]);

  const loadOnlineStatus = async () => {
    if (!counselorId) return;
    
    try {
      const status = await getCounselorOnlineStatus(counselorId);
      setOnlineStatus(status);
    } catch (error) {
      console.error('Error loading online status:', error);
    }
  };

  const loadTodaySessions = async () => {
    if (!counselorId) return;
    
    try {
      const sessions = await getTodayActiveSessions(counselorId);
      setTodaySessions(sessions);
    } catch (error) {
      console.error('Error loading today sessions:', error);
    }
  };

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'プロフィールの更新に失敗しました';
      setProfileMsg('エラー: ' + errorMessage);
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

    } catch (error: unknown) {
      console.error('画像アップロードエラー:', error);
      
      // バケットが存在しない場合のエラーハンドリング
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      if (errorMessage.includes('bucket') || errorMessage.includes('not found')) {
        setProfileMsg('画像アップロード機能の設定が完了していません。管理者にお問い合わせください。');
      } else {
        setProfileMsg('画像のアップロードに失敗しました: ' + errorMessage);
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

  // オンライン状態制御
  const handleToggleOnline = async () => {
    if (!counselorId || onlineLoading) return;
    
    setOnlineLoading(true);
    setOnlineMsg('');
    
    try {
      const newOnlineStatus = !onlineStatus?.is_online;
      const success = await setCounselorOnlineStatus(counselorId, newOnlineStatus, true);
      
      if (success) {
        setOnlineMsg(`${newOnlineStatus ? 'オンライン' : 'オフライン'}に変更しました`);
        await loadOnlineStatus();
      } else {
        setOnlineMsg('オンライン状態の変更に失敗しました');
      }
    } catch (error) {
      setOnlineMsg('エラー: オンライン状態の変更に失敗しました');
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleClearManualOverride = async () => {
    if (!counselorId || onlineLoading) return;
    
    setOnlineLoading(true);
    setOnlineMsg('');
    
    try {
      const success = await clearManualOverride(counselorId);
      
      if (success) {
        setOnlineMsg('自動制御モードに戻しました');
        await loadOnlineStatus();
      } else {
        setOnlineMsg('自動制御モードへの変更に失敗しました');
      }
    } catch (error) {
      setOnlineMsg('エラー: 自動制御モードへの変更に失敗しました');
    } finally {
      setOnlineLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* ヘッダーの高さ分のスペーサー */}
      <div className="h-20"></div>
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
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-1">
                {MENU.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`
                      relative px-6 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02]
                      ${activeTab === item.key
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 shadow-sm hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`
                        p-2 rounded-lg transition-all duration-300
                        ${activeTab === item.key
                          ? 'bg-white/20 backdrop-blur-sm'
                          : 'bg-white/70'
                        }
                      `}>
                        {item.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-sm">{item.label}</div>
                        <div className={`text-xs opacity-75 ${
                          activeTab === item.key ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {activeTab === item.key && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-white rounded-full"></div>
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

                {/* オンライン状態制御 */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${onlineStatus?.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    オンライン状態
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600">現在の状態:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          onlineStatus?.is_online 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {onlineStatus?.is_online ? '🟢 オンライン' : '⚪ オフライン'}
                        </span>
                      </div>
                      
                      {onlineStatus?.manual_override && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ 手動制御中です。自動制御に戻すには下のボタンをクリックしてください。
                          </p>
                        </div>
                      )}

                      {onlineStatus?.auto_online_start && onlineStatus?.auto_online_end && !onlineStatus?.manual_override && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            🤖 自動制御中: {new Date(onlineStatus.auto_online_start).toLocaleTimeString('ja-JP')} - {new Date(onlineStatus.auto_online_end).toLocaleTimeString('ja-JP')}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Button
                          onClick={handleToggleOnline}
                          loading={onlineLoading}
                          className={`w-full ${onlineStatus?.is_online 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {onlineStatus?.is_online ? 'オフラインにする' : 'オンラインにする'}
                        </Button>
                        
                        {onlineStatus?.manual_override && (
                          <Button
                            onClick={handleClearManualOverride}
                            loading={onlineLoading}
                            variant="outline"
                            className="w-full"
                          >
                            自動制御に戻す
                          </Button>
                        )}
                      </div>

                      {onlineMsg && (
                        <div className={`mt-3 p-2 rounded text-sm ${
                          onlineMsg.includes('エラー') 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {onlineMsg}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">今日のセッション</h4>
                      {todaySessions.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {todaySessions.map((session: any) => (
                            <div key={session.id} className="p-3 bg-gray-50 rounded-lg border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{session.booking?.user?.name}さん</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(session.scheduled_start).toLocaleTimeString('ja-JP', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })} - {new Date(session.scheduled_end).toLocaleTimeString('ja-JP', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  session.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : session.status === 'scheduled'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.status === 'active' ? 'アクティブ' : 
                                   session.status === 'scheduled' ? '予定' : '完了'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">今日のセッションはありません</p>
                      )}
                    </div>
                  </div>
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
                <UnifiedScheduleManager counselorId={counselorId} />
              </div>
            )}

            {activeTab === 'clients' && (
              <div>
                <UnifiedClientManager counselorId={counselorId} />
              </div>
            )}


            {activeTab === 'communication' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    コミュニケーション管理
                  </h2>
                  <p className="text-gray-600 text-lg">チャットとレビューを管理します</p>
                </div>
                
                {/* デバッグ情報 */}
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">デバッグ情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>ユーザーID:</strong> {user?.id || '未取得'}</p>
                      <p><strong>カウンセラーID:</strong> {counselorId || '未取得'}</p>
                      <p><strong>認証状態:</strong> {isAuthenticated ? '認証済み' : '未認証'}</p>
                      <p><strong>カウンセラー判定:</strong> {isCounselor === true ? 'カウンセラー' : isCounselor === false ? '一般ユーザー' : '判定中'}</p>
                    </div>
                    <div>
                      <p><strong>チャットルーム数:</strong> {chatRooms.length}件</p>
                      <p><strong>ローディング状態:</strong> {chatLoading ? '読み込み中' : '完了'}</p>
                      <p><strong>エラー状態:</strong> {chatError ? 'エラーあり' : '正常'}</p>
                      <p><strong>アクティブタブ:</strong> {activeTab}</p>
                    </div>
                  </div>
                  {chatError && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                      <p className="text-red-700 font-semibold">エラー詳細:</p>
                      <p className="text-red-600 text-sm">{chatError}</p>
                    </div>
                  )}
                </div>
                
                {chatLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">チャットルームを読み込み中...</p>
                  </div>
                ) : chatError ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-500 text-lg font-medium">エラーが発生しました</p>
                    <p className="text-red-400 text-sm mt-2">{chatError}</p>
                    <Button onClick={refetchChat} className="mt-4">
                      再試行
                    </Button>
                  </div>
                ) : chatRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">チャットデータがありません</p>
                    <p className="text-gray-400 text-sm mt-2">予約が確定するとチャットルームが自動的に作成されます</p>
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={() => window.location.href = '/counselors'}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        カウンセラー一覧を見る
                      </Button>
                      <div className="text-xs text-gray-400">
                        デバッグ情報: チャットルーム数 {chatRooms.length}件
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {chatRooms.map((room) => (
                      <div key={room.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="text-xs text-gray-400 mb-2">
                          デバッグ: ルームID: {room.id} | 予約ID: {room.booking?.id}
                          {room.id.startsWith('demo-') && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              デモデータ
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {room.booking?.user?.name || '不明なユーザー'}さんとのチャット
                              </h3>
                              <p className="text-sm text-gray-500">
                                予約日: {room.booking?.scheduled_at ? new Date(room.booking.scheduled_at).toLocaleDateString('ja-JP') : '未設定'}
                              </p>
                              <p className="text-xs text-gray-400">
                                サービス: {room.booking?.service_type === 'monthly' ? '月額コース' : 
                                           room.booking?.service_type === 'single' ? '単発セッション' : 
                                           room.booking?.service_type === 'chat' ? 'チャットサービス' : 'その他'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              room.booking?.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : room.booking?.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {room.booking?.status === 'confirmed' ? '確定済み' : 
                               room.booking?.status === 'completed' ? '完了' : '予約中'}
                            </span>
                            <Button
                              onClick={() => {
                                if (room.id.startsWith('demo-')) {
                                  alert('これはデモデータです。実際のチャット機能をテストするには、予約データを作成してください。');
                                } else {
                                  window.open(`/chat/${room.booking?.id}`, '_blank');
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              チャットを開く
                            </Button>
                          </div>
                        </div>
                        
                        {room.chat_messages && room.chat_messages.length > 0 ? (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">最新メッセージ:</p>
                            <p className="text-gray-800">
                              {room.chat_messages[room.chat_messages.length - 1]?.message || 'メッセージなし'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(room.chat_messages[room.chat_messages.length - 1]?.created_at).toLocaleString('ja-JP')}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              メッセージ数: {room.chat_messages.length}件
                            </p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">まだメッセージがありません</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div>
                <UnifiedAnalyticsDashboard counselorId={counselorId} />
              </div>
            )}

            {activeTab === 'settings' && (
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