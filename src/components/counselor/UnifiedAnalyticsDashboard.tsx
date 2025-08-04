import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Activity,
  Clock,
  DollarSign,
  Calendar,
  Star,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics';
import { formatCurrency, formatDate } from '../../lib/utils';

interface UnifiedAnalyticsDashboardProps {
  counselorId: string;
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const TIME_PERIOD_COLORS = {
  morning: 'text-yellow-700 bg-yellow-100',
  afternoon: 'text-blue-700 bg-blue-100',
  evening: 'text-purple-700 bg-purple-100',
  night: 'text-indigo-700 bg-indigo-100'
};

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

export const UnifiedAnalyticsDashboard: React.FC<UnifiedAnalyticsDashboardProps> = ({
  counselorId
}) => {
  // 基本分析データ
  const {
    monthlyRevenue,
    timeSlotAnalytics,
    satisfactionTrends,
    comprehensiveStats,
    loading: basicLoading,
    error: basicError,
    revenueGrowthRate,
    bookingGrowthRate,
    popularTimeSlots,
    timePeriodRevenue,
    satisfactionTrend,
    monthlyAverageBookings,
    cancellationRate
  } = useAnalytics(counselorId);

  // 高度な分析データ
  const {
    realtimeKPI,
    userBehaviorPatterns,
    revenuePredictions,
    counselorUtilization,
    loading: advancedLoading,
    error: advancedError,
    analyticsSummary,
    updateRealtimeKPI
  } = useAdvancedAnalytics(counselorId);

  const [activeTab, setActiveTab] = useState('overview');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loading = basicLoading || advancedLoading;
  const error = basicError || advancedError;

  // 自動更新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      updateRealtimeKPI();
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [autoRefresh, updateRealtimeKPI]);

  // 成長率の表示用アイコンと色を取得
  const getGrowthIndicator = (rate: number) => {
    if (rate > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        prefix: '+',
        bgColor: 'bg-green-50'
      };
    } else if (rate < 0) {
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        prefix: '',
        bgColor: 'bg-red-50'
      };
    } else {
      return {
        icon: Activity,
        color: 'text-slate-600',
        prefix: '',
        bgColor: 'bg-slate-50'
      };
    }
  };

  // 満足度トレンドのインジケーター
  const getSatisfactionIndicator = () => {
    switch (satisfactionTrend) {
      case 'improving':
        return { icon: TrendingUp, color: 'text-green-600', label: '向上中' };
      case 'declining':
        return { icon: TrendingDown, color: 'text-red-600', label: '下降中' };
      default:
        return { icon: Activity, color: 'text-slate-600', label: '安定' };
    }
  };

  const renderKPICards = () => {
    const revenueIndicator = getGrowthIndicator(revenueGrowthRate);
    const bookingIndicator = getGrowthIndicator(bookingGrowthRate);
    const satisfactionIndicator = getSatisfactionIndicator();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 今月の収益 */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">今月の収益</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(comprehensiveStats?.currentMonthRevenue || 0)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${revenueIndicator.bgColor}`}>
              <revenueIndicator.icon className={`w-6 h-6 ${revenueIndicator.color}`} />
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-1">
            <span className={`text-sm font-medium ${revenueIndicator.color}`}>
              {revenueIndicator.prefix}{Math.abs(revenueGrowthRate).toFixed(1)}%
            </span>
            <span className="text-sm text-slate-600">先月比</span>
          </div>
        </div>

        {/* 今月の予約数 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">今月の予約数</p>
              <p className="text-2xl font-bold text-blue-700">
                {comprehensiveStats?.currentMonthBookings || 0}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${bookingIndicator.bgColor}`}>
              <bookingIndicator.icon className={`w-6 h-6 ${bookingIndicator.color}`} />
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-1">
            <span className={`text-sm font-medium ${bookingIndicator.color}`}>
              {bookingIndicator.prefix}{Math.abs(bookingGrowthRate).toFixed(1)}%
            </span>
            <span className="text-sm text-slate-600">先月比</span>
          </div>
        </div>

        {/* 平均評価 */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">平均評価</p>
              <p className="text-2xl font-bold text-purple-700">
                {comprehensiveStats?.avgRating.toFixed(1) || 0}/5.0
              </p>
            </div>
            <div className={`p-2 rounded-lg ${
              satisfactionTrend === 'improving' ? 'bg-green-50' :
              satisfactionTrend === 'declining' ? 'bg-red-50' : 'bg-slate-50'
            }`}>
              <satisfactionIndicator.icon className={`w-6 h-6 ${satisfactionIndicator.color}`} />
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-1">
            <span className={`text-sm font-medium ${satisfactionIndicator.color}`}>
              {satisfactionIndicator.label}
            </span>
            <span className="text-sm text-slate-600">
              ({comprehensiveStats?.totalReviews || 0}件)
            </span>
          </div>
        </div>

        {/* 総クライアント数 */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">総クライアント数</p>
              <p className="text-2xl font-bold text-orange-700">
                {comprehensiveStats?.uniqueClients || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-2 flex items-center space-x-1">
            <span className="text-sm text-slate-600">
              総予約数: {comprehensiveStats?.totalBookings || 0}件
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderRealtimeKPI = () => {
    if (!showAdvanced || !realtimeKPI) return null;

    return (
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">リアルタイム指標</h3>
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(realtimeKPI.totalRevenueToday)}
            </div>
            <div className="text-sm text-green-700">今日の収益</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {realtimeKPI.totalActiveBookings}
            </div>
            <div className="text-sm text-blue-700">アクティブ予約</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {realtimeKPI.totalCompletedSessionsToday}
            </div>
            <div className="text-sm text-purple-700">完了セッション</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">
              {realtimeKPI.averageSessionRating.toFixed(1)}
            </div>
            <div className="text-sm text-orange-700">今日の平均評価</div>
          </div>
        </div>
      </Card>
    );
  };

  const renderRevenueTrends = () => {
    if (monthlyRevenue.length === 0) return null;

    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));

    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">月別収益推移</h3>
        <div className="space-y-3">
          {monthlyRevenue.slice(-6).map((month, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm text-slate-600">
                {month.monthDate.toLocaleDateString('ja-JP', { month: 'short' })}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {formatCurrency(month.revenue)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {month.completedBookings}回完了
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderTimeSlotAnalysis = () => {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">人気時間帯 TOP5</h3>
        <div className="space-y-3">
          {popularTimeSlots.map((slot, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                </div>
                <div>
                  <div className="font-medium text-slate-700">{slot.timeLabel}</div>
                  <div className="text-sm text-slate-500">
                    完了率: {((slot.completedCount / slot.bookingCount) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{slot.bookingCount}件</div>
                <div className="text-sm text-slate-600">
                  {formatCurrency(slot.avgRevenue)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderUserBehaviorAnalysis = () => {
    if (!showAdvanced || userBehaviorPatterns.length === 0) return null;

    const topUsers = userBehaviorPatterns
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, 5);

    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">ユーザー行動分析</h3>
        <div className="space-y-3">
          {topUsers.map((user, index) => {
            const DeviceIcon = DEVICE_ICONS[user.primaryDeviceType as keyof typeof DEVICE_ICONS] || Activity;
            
            return (
              <div key={user.userId} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-700">{user.name}</div>
                  <div className="text-sm text-slate-500 flex items-center space-x-2">
                    <DeviceIcon className="w-3 h-3" />
                    <span>{user.totalSessions}セッション</span>
                    <Badge className={ACTIVITY_COLORS[user.activityLevel]}>
                      {user.activityLevel}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">
                    {user.bookingConversionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500">変換率</div>
                </div>
              </div>
            );
          })}
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
            <h2 className="text-xl font-semibold text-slate-800">分析ダッシュボード</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              size="sm"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  基本表示
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  詳細表示
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* KPI カード */}
        {renderKPICards()}

        {/* リアルタイム指標 */}
        {renderRealtimeKPI()}

        {/* タブナビゲーション */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            概要
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'revenue'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            収益分析
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            時間帯分析
          </button>
          {showAdvanced && (
            <button
              onClick={() => setActiveTab('behavior')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'behavior'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              行動分析
            </button>
          )}
        </div>
      </Card>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderRevenueTrends()}
          {renderTimeSlotAnalysis()}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderRevenueTrends()}
          
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">時間帯別収益</h3>
            <div className="space-y-3">
              {timePeriodRevenue.map((period) => (
                <div key={period.period} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={TIME_PERIOD_COLORS[period.period as keyof typeof TIME_PERIOD_COLORS]}>
                      {period.label}
                    </Badge>
                    <span className="text-sm text-slate-600">
                      {period.totalBookings}件の予約
                    </span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(period.avgRevenue)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {renderTimeSlotAnalysis()}
        </div>
      )}

      {activeTab === 'behavior' && showAdvanced && (
        <div className="space-y-6">
          {renderUserBehaviorAnalysis()}
        </div>
      )}
    </div>
  );
};