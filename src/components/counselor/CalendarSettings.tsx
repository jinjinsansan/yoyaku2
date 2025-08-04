import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Calendar,
  Sync,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Clock,
  Shield,
  Info
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CalendarSettings as CalendarSettingsType, useAdvancedSchedule } from '../../hooks/useAdvancedSchedule';

interface CalendarSettingsProps {
  counselorId: string;
}

export const CalendarSettings: React.FC<CalendarSettingsProps> = ({ counselorId }) => {
  const {
    calendarSettings,
    loading,
    error,
    updateCalendarSettings
  } = useAdvancedSchedule(counselorId);

  const [formData, setFormData] = useState({
    googleCalendarId: '',
    syncEnabled: false,
    autoSyncBookings: true,
    syncBufferMinutes: 15
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showAuthInstructions, setShowAuthInstructions] = useState(false);

  useEffect(() => {
    if (calendarSettings) {
      setFormData({
        googleCalendarId: calendarSettings.googleCalendarId || '',
        syncEnabled: calendarSettings.syncEnabled,
        autoSyncBookings: calendarSettings.autoSyncBookings,
        syncBufferMinutes: calendarSettings.syncBufferMinutes
      });
    }
  }, [calendarSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const success = await updateCalendarSettings(formData);
      if (success) {
        alert('カレンダー設定を更新しました');
      }
    } catch (error) {
      console.error('Settings update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleAuth = () => {
    // 実際の実装では、Google OAuth フローを開始
    alert('Google認証機能は開発中です。現在はカレンダーIDの手動入力のみ対応しています。');
  };

  const handleDisconnect = async () => {
    if (window.confirm('Googleカレンダーとの連携を解除しますか？')) {
      await updateCalendarSettings({
        googleCalendarId: undefined,
        syncEnabled: false
      });
      setFormData(prev => ({
        ...prev,
        googleCalendarId: '',
        syncEnabled: false
      }));
    }
  };

  const getSyncStatusBadge = () => {
    if (!calendarSettings) {
      return <Badge className="text-slate-600 bg-slate-100">未設定</Badge>;
    }

    if (!calendarSettings.syncEnabled) {
      return <Badge className="text-slate-600 bg-slate-100">無効</Badge>;
    }

    if (!calendarSettings.googleCalendarId) {
      return <Badge className="text-yellow-700 bg-yellow-100">設定不完全</Badge>;
    }

    return <Badge className="text-green-700 bg-green-100">
      <Sync className="w-3 h-3 mr-1" />
      同期中
    </Badge>;
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">カレンダー連携設定</h2>
          </div>
          {getSyncStatusBadge()}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* 概要情報 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Googleカレンダー連携について</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 予約が入ると自動的にGoogleカレンダーにイベントが作成されます</li>
                <li>• キャンセル時にはカレンダーからも自動削除されます</li>
                <li>• バッファ時間を設定して前後の時間もブロックできます</li>
                <li>• プライベートカレンダーとは分離して管理されます</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Google認証セクション */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Google認証</span>
            </h3>

            {!formData.googleCalendarId ? (
              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-slate-800">Googleアカウント連携</h4>
                    <p className="text-sm text-slate-600">
                      カレンダー同期を開始するには、Googleアカウントとの連携が必要です
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google認証
                  </Button>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h5 className="font-medium text-slate-700 mb-2">手動設定（上級者向け）</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        GoogleカレンダーID
                      </label>
                      <input
                        type="text"
                        value={formData.googleCalendarId}
                        onChange={(e) => setFormData(prev => ({ ...prev, googleCalendarId: e.target.value }))}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="例: primary または カレンダーID@group.calendar.google.com"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuthInstructions(!showAuthInstructions)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      カレンダーIDの取得方法を見る
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Google連携済み</h4>
                      <p className="text-sm text-green-700">
                        カレンダーID: {formData.googleCalendarId}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDisconnect}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    連携解除
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 同期設定 */}
          {formData.googleCalendarId && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-800 flex items-center space-x-2">
                <Sync className="w-5 h-5 text-indigo-600" />
                <span>同期設定</span>
              </h3>

              <div className="space-y-4">
                {/* 同期有効化 */}
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="syncEnabled"
                    checked={formData.syncEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, syncEnabled: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="syncEnabled" className="block font-medium text-slate-800">
                      カレンダー同期を有効にする
                    </label>
                    <p className="text-sm text-slate-600">
                      予約の作成・更新・削除時にGoogleカレンダーと自動同期します
                    </p>
                  </div>
                </div>

                {/* 自動同期 */}
                {formData.syncEnabled && (
                  <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="autoSyncBookings"
                      checked={formData.autoSyncBookings}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoSyncBookings: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="autoSyncBookings" className="block font-medium text-slate-800">
                        予約の自動同期
                      </label>
                      <p className="text-sm text-slate-600">
                        新しい予約が入った際に自動的にカレンダーイベントを作成します
                      </p>
                    </div>
                  </div>
                )}

                {/* バッファ時間 */}
                {formData.syncEnabled && (
                  <div className="space-y-2">
                    <label className="block font-medium text-slate-800">
                      <Clock className="w-4 h-4 inline mr-2" />
                      バッファ時間設定
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          前後のバッファ時間（分）
                        </label>
                        <select
                          value={formData.syncBufferMinutes}
                          onChange={(e) => setFormData(prev => ({ ...prev, syncBufferMinutes: parseInt(e.target.value) }))}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={0}>なし</option>
                          <option value={5}>5分</option>
                          <option value={10}>10分</option>
                          <option value={15}>15分</option>
                          <option value={30}>30分</option>
                          <option value={60}>60分</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <p className="text-sm text-slate-600">
                          セッション前後の準備・移動時間として設定されます
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* セキュリティ注意事項 */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-2">セキュリティについて</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• カレンダーアクセス権限は読み書き権限のみに制限されています</li>
                  <li>• 個人情報は暗号化されて安全に保存されます</li>
                  <li>• いつでも連携を解除することができます</li>
                  <li>• 第三者とのデータ共有は一切行いません</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              設定を保存
            </Button>
          </div>
        </form>
      </Card>

      {/* カレンダーID取得方法 */}
      {showAuthInstructions && (
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">GoogleカレンダーIDの取得方法</h3>
            <div className="prose prose-slate max-w-none text-sm">
              <ol className="space-y-2">
                <li>Google Calendarを開く（calendar.google.com）</li>
                <li>左側のサイドバーで対象のカレンダーを探す</li>
                <li>カレンダー名の右側の「⋮」（縦3点）をクリック</li>
                <li>「設定と共有」を選択</li>
                <li>「カレンダーの統合」セクションにある「カレンダーID」をコピー</li>
                <li>メインカレンダーの場合は通常「primary」と入力</li>
              </ol>
              <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                <p className="font-medium mb-1">カレンダーIDの例:</p>
                <ul>
                  <li>• メインカレンダー: <code>primary</code></li>
                  <li>• サブカレンダー: <code>abc123@group.calendar.google.com</code></li>
                  <li>• 個人カレンダー: <code>your.email@gmail.com</code></li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};