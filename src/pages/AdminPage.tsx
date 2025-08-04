import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { processReminderJobs, ReminderJob } from '../lib/reminderService';
import { processAutoOnlineStatus, getAllCounselorsOnlineStatus, type CounselorOnlineStatus } from '../lib/onlineStatusService';
import { AdvancedAnalyticsDashboard } from '../components/admin/AdvancedAnalyticsDashboard';


const MENU = [
  { key: 'analytics', label: '高度な分析', disabled: false },
  { key: 'stats', label: '売上統計', disabled: true },
  { key: 'users', label: 'ユーザー管理', disabled: true },
  { key: 'counselors', label: 'カウンセラー一覧', disabled: false },
  { key: 'register', label: '新規カウンセラー登録', disabled: false },
  { key: 'reminders', label: 'リマインダー管理', disabled: false },
  { key: 'online', label: 'オンライン状態管理', disabled: false },
  { key: 'payments', label: '決済履歴', disabled: true },
  { key: 'settings', label: 'システム設定', disabled: true },
];

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  // デバッグログを削除
  const [activeTab, setActiveTab] = useState('analytics');
  
  // 新規登録フォーム用state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
    specialties: '',
    profileImage: '',
    profileUrl: '',
    hourlyRate: 8000,
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMsg, setRegisterMsg] = useState('');

  // リマインダー管理用state
  const [reminderJobs, setReminderJobs] = useState<ReminderJob[]>([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');
  const [processingReminders, setProcessingReminders] = useState(false);

  // オンライン状態管理用state
  const [onlineStatuses, setOnlineStatuses] = useState<any[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineMsg, setOnlineMsg] = useState('');
  const [processingOnline, setProcessingOnline] = useState(false);

  // カウンセラー一覧
  const [counselors, setCounselors] = useState<Array<{
    id: string;
    user_id: string;
    bio: string;
    specialties: string[];
    profile_image: string | null;
    profile_url: string | null;
    hourly_rate: number;
    is_active: boolean;
    rating: number;
    review_count: number;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      phone: string | null;
    } | null;
    created_at: string;
    updated_at: string;
  }>>([]);
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

  // リマインダージョブ一覧取得
  useEffect(() => {
    if (activeTab === 'reminders') {
      loadReminderJobs();
    }
  }, [activeTab]);

  // オンライン状態一覧取得
  useEffect(() => {
    if (activeTab === 'online') {
      loadOnlineStatuses();
    }
  }, [activeTab]);

  const loadReminderJobs = async () => {
    setReminderLoading(true);
    try {
      const { data, error } = await supabase
        .from('reminder_jobs')
        .select(`
          *,
          booking:bookings!reminder_jobs_booking_id_fkey (
            id,
            service_type,
            scheduled_at,
            user:users!bookings_user_id_fkey (name, email),
            counselor:counselors!bookings_counselor_id_fkey (
              user:users!counselors_user_id_fkey (name)
            )
          )
        `)
        .order('scheduled_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReminderJobs(data || []);
    } catch (error) {
      console.error('Error loading reminder jobs:', error);
      setReminderMsg('リマインダージョブの読み込みに失敗しました');
    } finally {
      setReminderLoading(false);
    }
  };

  const loadOnlineStatuses = async () => {
    setOnlineLoading(true);
    try {
      const statuses = await getAllCounselorsOnlineStatus();
      setOnlineStatuses(statuses);
    } catch (error) {
      console.error('Error loading online statuses:', error);
      setOnlineMsg('オンライン状態の読み込みに失敗しました');
    } finally {
      setOnlineLoading(false);
    }
  };

  // 編集用state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState<{
    name: string;
    email: string;
    phone: string;
    avatar: string;
    profileImage: string;
    bio: string;
    specialties: string;
    profileUrl: string;
    hourlyRate: number;
    isActive: boolean;
    reviewCount: number;
    rating: number;
  }>({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    profileImage: '',
    bio: '',
    specialties: '',
    profileUrl: '',
    hourlyRate: 0,
    isActive: true,
    reviewCount: 0,
    rating: 0,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  // 編集開始
  const handleEdit = (c: typeof counselors[0]) => {
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '保存に失敗しました';
      setEditMsg('エラー: ' + errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // 新規カウンセラー登録
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterMsg('');
    
    try {
      // 1. ユーザーアカウント作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          data: {
            name: registerForm.name,
          }
        }
      });

      if (authError) {
        throw new Error(`ユーザー作成エラー: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('ユーザー作成に失敗しました');
      }

      // 2. usersテーブルに追加情報を保存
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        avatar: null,
        role: 'counselor'
      });

      if (userError) {
        throw new Error(`ユーザー情報保存エラー: ${userError.message}`);
      }

      // 3. counselorsテーブルに登録
      const { error: counselorError } = await supabase.from('counselors').insert({
        user_id: authData.user.id,
        bio: registerForm.bio,
        specialties: registerForm.specialties.trim() 
          ? registerForm.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : [],
        profile_image: registerForm.profileImage || null,
        profile_url: registerForm.profileUrl || null,
        hourly_rate: Number(registerForm.hourlyRate),
        is_active: true,
        rating: 5.0,
        review_count: 0
      });

      if (counselorError) {
        throw new Error(`カウンセラー情報保存エラー: ${counselorError.message}`);
      }

      setRegisterMsg('カウンセラーを正常に登録しました');
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        bio: '',
        specialties: '',
        profileImage: '',
        profileUrl: '',
        hourlyRate: 8000,
      });
      setRefresh(r => !r);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '登録に失敗しました';
      setRegisterMsg('エラー: ' + errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  };

  // リマインダーシステム手動実行
  const handleProcessReminders = async () => {
    setProcessingReminders(true);
    setReminderMsg('');
    
    try {
      const result = await processReminderJobs();
      
      let message = `処理完了: ${result.processed}件処理, ${result.successful}件成功, ${result.failed}件失敗`;
      if (result.errors.length > 0) {
        message += `\nエラー: ${result.errors.join(', ')}`;
      }
      
      setReminderMsg(message);
      await loadReminderJobs(); // リストを更新
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'リマインダー処理に失敗しました';
      setReminderMsg('エラー: ' + errorMessage);
    } finally {
      setProcessingReminders(false);
    }
  };

  // オンライン状態自動制御システム手動実行
  const handleProcessOnlineStatus = async () => {
    setProcessingOnline(true);
    setOnlineMsg('');
    
    try {
      const result = await processAutoOnlineStatus();
      
      let message = `処理完了: オンライン状態変更${result.onlineChanged}件, セッション開始${result.sessionsStarted}件, セッション完了${result.sessionsCompleted}件`;
      if (result.errors.length > 0) {
        message += `\nエラー: ${result.errors.join(', ')}`;
      }
      
      setOnlineMsg(message);
      await loadOnlineStatuses(); // リストを更新
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'オンライン状態制御処理に失敗しました';
      setOnlineMsg('エラー: ' + errorMessage);
    } finally {
      setProcessingOnline(false);
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
          {activeTab === 'analytics' && (
            <AdvancedAnalyticsDashboard />
          )}

          {activeTab === 'register' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">新規カウンセラー登録</h2>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="名前"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="カウンセラーの名前"
                  />
                  <Input
                    label="メールアドレス"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="example@email.com"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="パスワード"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    placeholder="8文字以上のパスワード"
                    minLength={8}
                  />
                  <Input
                    label="電話番号"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="090-1234-5678"
                  />
                </div>

                <Input
                  label="プロフィール画像URL"
                  value={registerForm.profileImage}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, profileImage: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />

                <Input
                  label="自己紹介"
                  value={registerForm.bio}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="カウンセラーとしての自己紹介"
                />

                <Input
                  label="専門分野（カンマ区切り）"
                  value={registerForm.specialties}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, specialties: e.target.value }))}
                  placeholder="例: PTSD治療, うつ病, カップルカウンセリング"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="プロフィールURL"
                    value={registerForm.profileUrl}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, profileUrl: e.target.value }))}
                    placeholder="https://example.com/profile"
                  />
                  <Input
                    label="時給（円）"
                    type="number"
                    value={registerForm.hourlyRate}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                    min={1000}
                    max={50000}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" loading={registerLoading} className="flex-1">
                    カウンセラーを登録
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setRegisterForm({
                        name: '',
                        email: '',
                        password: '',
                        phone: '',
                        bio: '',
                        specialties: '',
                        profileImage: '',
                        profileUrl: '',
                        hourlyRate: 8000,
                      });
                      setRegisterMsg('');
                    }}
                  >
                    リセット
                  </Button>
                </div>

                {registerMsg && (
                  <div className={`p-3 rounded-lg text-sm ${
                    registerMsg.includes('エラー') 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {registerMsg}
                  </div>
                )}
              </form>
            </Card>
          )}

          {activeTab === 'reminders' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">リマインダー管理</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={loadReminderJobs}
                    variant="outline"
                    disabled={reminderLoading}
                  >
                    更新
                  </Button>
                  <Button 
                    onClick={handleProcessReminders}
                    loading={processingReminders}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    リマインダー送信実行
                  </Button>
                </div>
              </div>

              {reminderMsg && (
                <div className={`p-3 rounded-lg text-sm mb-4 whitespace-pre-line ${
                  reminderMsg.includes('エラー') 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {reminderMsg}
                </div>
              )}

              {reminderLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">読み込み中...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2">予約ID</th>
                        <th className="text-left py-3 px-2">ユーザー</th>
                        <th className="text-left py-3 px-2">カウンセラー</th>
                        <th className="text-left py-3 px-2">予約日時</th>
                        <th className="text-left py-3 px-2">リマインダー種別</th>
                        <th className="text-left py-3 px-2">送信予定</th>
                        <th className="text-left py-3 px-2">ステータス</th>
                        <th className="text-left py-3 px-2">送信日時</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reminderJobs.map((job: any) => (
                        <tr key={job.id} className="border-b border-slate-100">
                          <td className="py-3 px-2 text-xs font-mono">
                            {job.booking_id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-medium">{job.booking?.user?.name || '-'}</div>
                              <div className="text-xs text-slate-500">{job.booking?.user?.email || '-'}</div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            {job.booking?.counselor?.user?.name || '-'}
                          </td>
                          <td className="py-3 px-2">
                            {job.booking?.scheduled_at ? 
                              new Date(job.booking.scheduled_at).toLocaleString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'
                            }
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              job.reminder_type === '24h' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {job.reminder_type === '24h' ? '1日前' : '1時間前'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-xs">
                            {new Date(job.scheduled_at).toLocaleString('ja-JP')}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              job.status === 'sent' 
                                ? 'bg-green-100 text-green-800' 
                                : job.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {job.status === 'sent' ? '送信済み' : 
                               job.status === 'failed' ? '失敗' : '待機中'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-xs">
                            {job.sent_at ? 
                              new Date(job.sent_at).toLocaleString('ja-JP') : '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {reminderJobs.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-500">リマインダージョブがありません</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'online' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">オンライン状態管理</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={loadOnlineStatuses}
                    variant="outline"
                    disabled={onlineLoading}
                  >
                    更新
                  </Button>
                  <Button 
                    onClick={handleProcessOnlineStatus}
                    loading={processingOnline}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    自動制御実行
                  </Button>
                </div>
              </div>

              {onlineMsg && (
                <div className={`p-3 rounded-lg text-sm mb-4 whitespace-pre-line ${
                  onlineMsg.includes('エラー') 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {onlineMsg}
                </div>
              )}

              {onlineLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">読み込み中...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onlineStatuses.map((status: any) => (
                    <Card key={status.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            status.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                          }`}></div>
                          <span className="font-medium">{status.counselor?.user?.name || 'Unknown'}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          status.is_online 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {status.is_online ? 'オンライン' : 'オフライン'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>最終活動:</span>
                          <span>
                            {new Date(status.last_activity).toLocaleString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {status.manual_override && (
                          <div className="flex items-center">
                            <span className="text-yellow-600">⚠️ 手動制御中</span>
                          </div>
                        )}
                        
                        {status.auto_online_start && status.auto_online_end && !status.manual_override && (
                          <div className="text-blue-600 text-xs">
                            🤖 自動制御: {new Date(status.auto_online_start).toLocaleTimeString('ja-JP')} - {new Date(status.auto_online_end).toLocaleTimeString('ja-JP')}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {onlineStatuses.length === 0 && !onlineLoading && (
                <div className="text-center py-8">
                  <p className="text-slate-500">オンライン状態データがありません</p>
                </div>
              )}
            </Card>
          )}

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
                            <Input label="名前" value={editProfile.name} onChange={e => setEditProfile((p) => ({ ...p, name: e.target.value }))} required />
                            <Input label="メールアドレス" type="email" value={editProfile.email} onChange={e => setEditProfile((p) => ({ ...p, email: e.target.value }))} required />
                            <Input label="電話番号" value={editProfile.phone || ''} onChange={e => setEditProfile((p) => ({ ...p, phone: e.target.value }))} />
                            <Input label="アバターURL" value={editProfile.avatar || ''} onChange={e => setEditProfile((p) => ({ ...p, avatar: e.target.value }))} />
                          </div>
                        </div>
                        <Input label="プロフィール画像URL" value={editProfile.profileImage} onChange={e => setEditProfile((p) => ({ ...p, profileImage: e.target.value }))} />
                        <Input label="自己紹介" value={editProfile.bio} onChange={e => setEditProfile((p) => ({ ...p, bio: e.target.value }))} />
                        <Input label="専門分野（カンマ区切り）" value={editProfile.specialties} onChange={e => setEditProfile((p) => ({ ...p, specialties: e.target.value }))} />
                        <Input label="プロフィールURL" value={editProfile.profileUrl} onChange={e => setEditProfile((p) => ({ ...p, profileUrl: e.target.value }))} />
                        <Input label="時給" type="number" value={editProfile.hourlyRate} onChange={e => setEditProfile((p) => ({ ...p, hourlyRate: Number(e.target.value) }))} />
                        <Input label="レビュー数" type="number" value={editProfile.reviewCount || 0} onChange={e => setEditProfile((p) => ({ ...p, reviewCount: Number(e.target.value) }))} />
                        <Input label="評価" type="number" value={editProfile.rating || 0} onChange={e => setEditProfile((p) => ({ ...p, rating: Number(e.target.value) }))} />
                                                  <label className="flex items-center gap-2">
                            <input type="checkbox" checked={editProfile.isActive} onChange={e => setEditProfile((p) => ({ ...p, isActive: e.target.checked }))} />
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
          {activeTab !== 'counselors' && activeTab !== 'register' && activeTab !== 'reminders' && activeTab !== 'online' && activeTab !== 'analytics' && (
            <Card className="p-6 text-slate-400 text-center">
              <p>この機能は現在ご利用いただけません。</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 