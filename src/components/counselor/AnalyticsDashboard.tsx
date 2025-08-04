import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Star,
  Activity,
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formatCurrency } from '../../lib/utils';

interface AnalyticsDashboardProps {
  counselorId: string;
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const TIME_PERIOD_COLORS = {
  morning: 'text-yellow-700 bg-yellow-100',
  afternoon: 'text-blue-700 bg-blue-100',
  evening: 'text-purple-700 bg-purple-100',
  night: 'text-indigo-700 bg-indigo-100'
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ counselorId }) => {
  const {
    monthlyRevenue,
    timeSlotAnalytics,
    satisfactionTrends,
    comprehensiveStats,
    loading,
    error,
    revenueGrowthRate,
    bookingGrowthRate,
    popularTimeSlots,
    timePeriodRevenue,
    satisfactionTrend,
    monthlyAverageBookings,
    cancellationRate
  } = useAnalytics(counselorId);

  const [activeTab, setActiveTab] = useState('overview');

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

  const renderRevenueChart = () => {
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

  const renderTimeSlotHeatmap = () => {
    if (timeSlotAnalytics.length === 0) return null;

    // 7日 × 24時間のヒートマップデータを準備
    const heatmapData: { [key: string]: number } = {};
    timeSlotAnalytics.forEach(slot => {
      heatmapData[`${slot.weekday}-${slot.hourOfDay}`] = slot.bookingCount;
    });

    const maxBookings = Math.max(...timeSlotAnalytics.map(slot => slot.bookingCount));

    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">人気時間帯ヒートマップ</h3>
        <div className="space-y-2">
          {/* 時間軸ラベル */}
          <div className="flex gap-1 text-xs text-slate-500">
            <div className="w-8"></div>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="w-4 text-center">
                {i % 4 === 0 ? i : ''}
              </div>
            ))}
          </div>
          
          {/* ヒートマップ */}
          {WEEKDAY_NAMES.map((day, weekday) => (
            <div key={weekday} className="flex gap-1">
              <div className="w-8 text-xs text-slate-600 py-1">{day}</div>
              {Array.from({ length: 24 }, (_, hour) => {
                const bookingCount = heatmapData[`${weekday}-${hour}`] || 0;
                const intensity = maxBookings > 0 ? bookingCount / maxBookings : 0;
                
                return (
                  <div
                    key={hour}
                    className="w-4 h-6 rounded cursor-pointer hover:ring-2 hover:ring-indigo-300"
                    style={{
                      backgroundColor: `rgba(99, 102, 241, ${intensity})`,
                    }}
                    title={`${day}曜日 ${hour}:00 - ${bookingCount}件の予約`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>予約数が少ない</span>
          <div className="flex items-center space-x-1">
            {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
              <div
                key={intensity}
                className="w-3 h-3 rounded"
                style={{ backgroundColor: `rgba(99, 102, 241, ${intensity})` }}
              />
            ))}
          </div>
          <span>予約数が多い</span>
        </div>
      </Card>
    );
  };

  const renderSatisfactionChart = () => {
    if (satisfactionTrends.length === 0) return null;

    const maxRating = 5;

    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">満足度推移</h3>
        <div className="space-y-3">
          {satisfactionTrends.slice(-6).map((trend, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm text-slate-600">
                {trend.monthDate.toLocaleDateString('ja-JP', { month: 'short' })}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-700">
                      {trend.avgRating.toFixed(1)}/5.0
                    </span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.round(trend.avgRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {trend.totalReviews}件のレビュー
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(trend.avgRating / maxRating) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
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

  const revenueIndicator = getGrowthIndicator(revenueGrowthRate);
  const bookingIndicator = getGrowthIndicator(bookingGrowthRate);
  const satisfactionIndicator = getSatisfactionIndicator();

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">収益・統計ダッシュボード</h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* KPI サマリー */}
        {comprehensiveStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">今月の収益</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(comprehensiveStats.currentMonthRevenue)}
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

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">今月の予約数</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {comprehensiveStats.currentMonthBookings}
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

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">平均評価</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {comprehensiveStats.avgRating.toFixed(1)}/5.0
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
                  ({comprehensiveStats.totalReviews}件)
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">総クライアント数</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {comprehensiveStats.uniqueClients}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-2 flex items-center space-x-1">
                <span className="text-sm text-slate-600">
                  総予約数: {comprehensiveStats.totalBookings}件
                </span>
              </div>
            </div>
          </div>
        )}

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
          <button
            onClick={() => setActiveTab('satisfaction')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'satisfaction'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            満足度分析
          </button>
        </div>
      </Card>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 主要指標 */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">主要指標</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-slate-700">月平均予約数</span>
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {monthlyAverageBookings.toFixed(1)}件
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-slate-700">完了率</span>
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {comprehensiveStats ? 
                    ((comprehensiveStats.completedBookings / comprehensiveStats.totalBookings) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-slate-700">キャンセル率</span>
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {cancellationRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-slate-700">セッション効果</span>
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {comprehensiveStats?.avgSessionEffectiveness.toFixed(1) || 0}/5.0
                </span>
              </div>
            </div>
          </Card>

          {/* 人気時間帯 */}
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
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderRevenueChart()}
          
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
          {renderTimeSlotHeatmap()}
        </div>
      )}

      {activeTab === 'satisfaction' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderSatisfactionChart()}
          
          {satisfactionTrends.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">最新の評価分布</h3>
              <div className="space-y-3">
                {Object.entries(satisfactionTrends[satisfactionTrends.length - 1]?.ratingDistribution || {})
                  .reverse()
                  .map(([rating, count]) => (
                    <div key={rating} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 w-16">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${satisfactionTrends[satisfactionTrends.length - 1]?.totalReviews > 0 
                                ? (count / satisfactionTrends[satisfactionTrends.length - 1].totalReviews) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-600 w-8">{count}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};