import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Target,
  Zap,
  Clock,
  DollarSign,
  Activity,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

interface AdvancedAnalyticsDashboardProps {
  counselorId?: string;
}

const DEVICE_ICONS = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Monitor,
  unknown: Activity
};

const ACTIVITY_COLORS = {
  active: 'text-green-600 bg-green-100',
  inactive: 'text-yellow-600 bg-yellow-100',
  dormant: 'text-red-600 bg-red-100'
};

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  counselorId
}) => {
  const {
    realtimeKPI,
    userBehaviorPatterns,
    revenuePredictions,
    counselorUtilization,
    loading,
    error,
    analyticsSummary,
    refetch,
    updateRealtimeKPI
  } = useAdvancedAnalytics(counselorId);

  const [activeTab, setActiveTab] = useState('realtime');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 自動更新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      updateRealtimeKPI();
    }, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [autoRefresh, updateRealtimeKPI]);

  const renderRealtimeKPICard = () => {
    if (!realtimeKPI) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-slate-600">今日の収益</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(realtimeKPI.totalRevenueToday)}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-slate-600">アクティブ予約</p>
              <p className="text-2xl font-bold text-blue-600">
                {realtimeKPI.totalActiveBookings}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-slate-600">平均評価</p>
              <p className="text-2xl font-bold text-yellow-600">
                {realtimeKPI.averageSessionRating.toFixed(1)}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-slate-600">稼働率</p>
              <p className="text-2xl font-bold text-purple-600">
                {realtimeKPI.counselorUtilizationRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderUserBehaviorChart = () => {
    const topUsers = userBehaviorPatterns
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, 10);

    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">ユーザー行動分析</h3>
          <Badge className="text-blue-700 bg-blue-100">
            {userBehaviorPatterns.length}人のユーザー
          </Badge>
        </div>

        <div className="space-y-4">
          {topUsers.map((user, index) => {
            const DeviceIcon = DEVICE_ICONS[user.primaryDeviceType as keyof typeof DEVICE_ICONS] || Activity;
            
            return (
              <div key={user.userId} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">{user.name}</div>
                    <div className="text-sm text-slate-500 flex items-center space-x-2">
                      <DeviceIcon className="w-3 h-3" />
                      <span>{user.primaryDeviceType}</span>
                      <Badge className={ACTIVITY_COLORS[user.activityLevel]}>
                        {user.activityLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">
                    {user.totalSessions}セッション
                  </div>
                  <div className="text-xs text-slate-500">
                    変換率: {user.bookingConversionRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analyticsSummary.activeUsers}
            </div>
            <div className="text-sm text-green-700">アクティブユーザー</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analyticsSummary.userEngagementRate.toFixed(1)}%
            </div>
            <div className="text-sm text-blue-700">エンゲージメント率</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analyticsSummary.avgConversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-purple-700">平均変換率</div>
          </div>
        </div>
      </Card>
    );
  };

  const renderRevenuePredictions = () => {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">収益予測</h3>
        
        {revenuePredictions.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">予測データがありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {revenuePredictions.map((prediction, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">
                      {formatDate(prediction.predictionDate)}
                    </div>
                    <div className="text-sm text-slate-500">
                      {prediction.predictionPeriod} 予測
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-slate-800">
                    {formatCurrency(prediction.predictedRevenue)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {prediction.predictedBookings}件予想
                  </div>
                  <div className="text-xs text-slate-500">
                    信頼度: {(prediction.confidenceLevel * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-700">総予測収益</div>
                  <div className="text-sm text-slate-600">
                    平均信頼度: {(analyticsSummary.avgPredictionConfidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(analyticsSummary.totalPredictedRevenue)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderCounselorUtilization = () => {
    const sortedCounselors = counselorUtilization
      .sort((a, b) => b.monthUtilizationRate - a.monthUtilizationRate);

    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">カウンセラー稼働率分析</h3>
        
        <div className="space-y-4">
          {sortedCounselors.map((counselor, index) => (
            <div key={counselor.counselorId} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-700">{counselor.counselorName}</div>
                    <div className="text-sm text-slate-500">
                      最終予約: {counselor.lastBookingTime ? formatDate(counselor.lastBookingTime) : 'なし'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800">
                    {counselor.monthUtilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600">月間稼働率</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-green-600">
                    {counselor.todayUtilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-slate-500">今日</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">
                    {counselor.weekUtilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-slate-500">今週</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-600">
                    {counselor.monthUtilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-slate-500">今月</div>
                </div>
              </div>
              
              <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(counselor.monthUtilizationRate, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">
              {analyticsSummary.avgUtilizationRate.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600">平均稼働率</div>
          </div>
        </div>
      </Card>
    );
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
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">高度な分析ダッシュボード</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <span className="text-sm text-slate-600">
                自動更新: {autoRefresh ? 'ON' : 'OFF'}
              </span>
            </div>
            
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              更新
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* リアルタイムKPI */}
        {renderRealtimeKPICard()}

        {/* タブナビゲーション */}
        <div className="flex space-x-1 mt-6">
          <button
            onClick={() => setActiveTab('realtime')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'realtime'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            リアルタイム
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'behavior'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            ユーザー行動
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'predictions'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            収益予測
          </button>
          <button
            onClick={() => setActiveTab('utilization')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'utilization'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            稼働率分析
          </button>
        </div>
      </Card>

      {/* タブコンテンツ */}
      {activeTab === 'realtime' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">リアルタイム指標</h3>
            {realtimeKPI && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">完了セッション</span>
                  <span className="font-bold text-green-600">
                    {realtimeKPI.totalCompletedSessionsToday}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">キャンセル</span>
                  <span className="font-bold text-red-600">
                    {realtimeKPI.totalCancelledSessionsToday}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">新規登録</span>
                  <span className="font-bold text-blue-600">
                    {realtimeKPI.newUserRegistrations}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">アクティブユーザー(1時間)</span>
                  <span className="font-bold text-purple-600">
                    {realtimeKPI.activeUsersLastHour}
                  </span>
                </div>
              </div>
            )}
          </Card>
          
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">システム概要</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {analyticsSummary.totalUsers}
                </div>
                <div className="text-sm text-slate-600">総ユーザー数</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {analyticsSummary.totalCounselors}
                </div>
                <div className="text-sm text-slate-600">総カウンセラー数</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'behavior' && renderUserBehaviorChart()}
      {activeTab === 'predictions' && renderRevenuePredictions()}
      {activeTab === 'utilization' && renderCounselorUtilization()}
    </div>
  );
};