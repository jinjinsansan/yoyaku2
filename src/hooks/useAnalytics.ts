import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MonthlyRevenueData {
  monthDate: Date;
  bookingsCount: number;
  revenue: number;
  avgBookingAmount: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface TimeSlotAnalytics {
  hourOfDay: number;
  weekday: number;
  weekdayName: string;
  bookingCount: number;
  completedCount: number;
  avgRevenue: number;
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface SatisfactionTrends {
  monthDate: Date;
  totalReviews: number;
  avgRating: number;
  positiveReviews: number;
  negativeReviews: number;
  ratingDistribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
  avgSessionEffectiveness: number;
  avgMoodImprovement: number;
}

export interface ComprehensiveStats {
  counselorId: string;
  counselorName: string;
  totalBookings: number;
  completedBookings: number;
  uniqueClients: number;
  totalRevenue: number;
  currentMonthBookings: number;
  currentMonthRevenue: number;
  lastMonthBookings: number;
  lastMonthRevenue: number;
  avgRating: number;
  totalReviews: number;
  avgSessionEffectiveness: number;
  avgMoodImprovement: number;
  mostPopularHour: number;
  mostPopularWeekday: number;
}

export const useAnalytics = (counselorId: string) => {
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [timeSlotAnalytics, setTimeSlotAnalytics] = useState<TimeSlotAnalytics[]>([]);
  const [satisfactionTrends, setSatisfactionTrends] = useState<SatisfactionTrends[]>([]);
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 月別収益データ取得
  const fetchMonthlyRevenue = async (monthsBack: number = 12) => {
    try {
      const { data, error } = await supabase.rpc('get_monthly_revenue_data', {
        p_counselor_id: counselorId,
        p_months_back: monthsBack
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        monthDate: new Date(item.month_date),
        bookingsCount: item.bookings_count,
        revenue: parseFloat(item.revenue || 0),
        avgBookingAmount: parseFloat(item.avg_booking_amount || 0),
        completedBookings: item.completed_bookings,
        cancelledBookings: item.cancelled_bookings
      }));
    } catch (err) {
      console.error('Monthly revenue fetch error:', err);
      return [];
    }
  };

  // 時間帯分析データ取得
  const fetchTimeSlotAnalytics = async (daysBack: number = 90) => {
    try {
      const { data, error } = await supabase.rpc('get_time_slot_analytics', {
        p_counselor_id: counselorId,
        p_days_back: daysBack
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        hourOfDay: item.hour_of_day,
        weekday: item.weekday,
        weekdayName: item.weekday_name,
        bookingCount: item.booking_count,
        completedCount: item.completed_count,
        avgRevenue: parseFloat(item.avg_revenue || 0),
        timePeriod: item.time_period
      }));
    } catch (err) {
      console.error('Time slot analytics fetch error:', err);
      return [];
    }
  };

  // 満足度トレンドデータ取得
  const fetchSatisfactionTrends = async (monthsBack: number = 12) => {
    try {
      const { data, error } = await supabase.rpc('get_satisfaction_trends', {
        p_counselor_id: counselorId,
        p_months_back: monthsBack
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        monthDate: new Date(item.month_date),
        totalReviews: item.total_reviews,
        avgRating: parseFloat(item.avg_rating || 0),
        positiveReviews: item.positive_reviews,
        negativeReviews: item.negative_reviews,
        ratingDistribution: item.rating_distribution || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        avgSessionEffectiveness: parseFloat(item.avg_session_effectiveness || 0),
        avgMoodImprovement: parseFloat(item.avg_mood_improvement || 0)
      }));
    } catch (err) {
      console.error('Satisfaction trends fetch error:', err);
      return [];
    }
  };

  // 総合統計取得
  const fetchComprehensiveStats = async () => {
    try {
      const { data, error } = await supabase
        .from('counselor_comprehensive_stats')
        .select('*')
        .eq('counselor_id', counselorId)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        counselorId: data.counselor_id,
        counselorName: data.counselor_name,
        totalBookings: data.total_bookings || 0,
        completedBookings: data.completed_bookings || 0,
        uniqueClients: data.unique_clients || 0,
        totalRevenue: parseFloat(data.total_revenue || 0),
        currentMonthBookings: data.current_month_bookings || 0,
        currentMonthRevenue: parseFloat(data.current_month_revenue || 0),
        lastMonthBookings: data.last_month_bookings || 0,
        lastMonthRevenue: parseFloat(data.last_month_revenue || 0),
        avgRating: parseFloat(data.avg_rating || 0),
        totalReviews: data.total_reviews || 0,
        avgSessionEffectiveness: parseFloat(data.avg_session_effectiveness || 0),
        avgMoodImprovement: parseFloat(data.avg_mood_improvement || 0),
        mostPopularHour: data.most_popular_hour || 14,
        mostPopularWeekday: data.most_popular_weekday || 1
      };
    } catch (err) {
      console.error('Comprehensive stats fetch error:', err);
      return null;
    }
  };

  // 全データ取得
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        revenueData,
        timeSlotData,
        satisfactionData,
        statsData
      ] = await Promise.all([
        fetchMonthlyRevenue(),
        fetchTimeSlotAnalytics(),
        fetchSatisfactionTrends(),
        fetchComprehensiveStats()
      ]);

      setMonthlyRevenue(revenueData);
      setTimeSlotAnalytics(timeSlotData);
      setSatisfactionTrends(satisfactionData);
      setComprehensiveStats(statsData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '統計データの取得に失敗しました';
      setError(errorMessage);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 収益成長率の計算
  const getRevenueGrowthRate = () => {
    if (!comprehensiveStats || !comprehensiveStats.lastMonthRevenue) return 0;
    
    const { currentMonthRevenue, lastMonthRevenue } = comprehensiveStats;
    if (lastMonthRevenue === 0) return currentMonthRevenue > 0 ? 100 : 0;
    
    return ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  };

  // 予約成長率の計算
  const getBookingGrowthRate = () => {
    if (!comprehensiveStats || !comprehensiveStats.lastMonthBookings) return 0;
    
    const { currentMonthBookings, lastMonthBookings } = comprehensiveStats;
    if (lastMonthBookings === 0) return currentMonthBookings > 0 ? 100 : 0;
    
    return ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100;
  };

  // 人気時間帯の分析
  const getPopularTimeSlots = () => {
    if (timeSlotAnalytics.length === 0) return [];

    return timeSlotAnalytics
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5)
      .map(slot => ({
        ...slot,
        timeLabel: `${slot.weekdayName} ${slot.hourOfDay}:00`
      }));
  };

  // 時間帯別収益分析
  const getTimePeriodRevenue = () => {
    const periods = {
      morning: { total: 0, count: 0, label: '午前' },
      afternoon: { total: 0, count: 0, label: '午後' },
      evening: { total: 0, count: 0, label: '夕方' },
      night: { total: 0, count: 0, label: '夜間' }
    };

    timeSlotAnalytics.forEach(slot => {
      periods[slot.timePeriod].total += slot.avgRevenue * slot.completedCount;
      periods[slot.timePeriod].count += slot.completedCount;
    });

    return Object.entries(periods).map(([key, data]) => ({
      period: key,
      label: data.label,
      avgRevenue: data.count > 0 ? data.total / data.count : 0,
      totalBookings: data.count
    }));
  };

  // 満足度トレンドの分析
  const getSatisfactionTrend = () => {
    if (satisfactionTrends.length < 2) return 'stable';

    const recent = satisfactionTrends.slice(-3);
    const avgRecent = recent.reduce((sum, item) => sum + item.avgRating, 0) / recent.length;
    
    const earlier = satisfactionTrends.slice(0, -3);
    if (earlier.length === 0) return 'stable';
    
    const avgEarlier = earlier.reduce((sum, item) => sum + item.avgRating, 0) / earlier.length;
    
    const difference = avgRecent - avgEarlier;
    
    if (difference > 0.2) return 'improving';
    if (difference < -0.2) return 'declining';
    return 'stable';
  };

  // 月別平均予約数
  const getMonthlyAverageBookings = () => {
    if (monthlyRevenue.length === 0) return 0;
    return monthlyRevenue.reduce((sum, month) => sum + month.bookingsCount, 0) / monthlyRevenue.length;
  };

  // キャンセル率の計算
  const getCancellationRate = () => {
    const totalBookings = monthlyRevenue.reduce((sum, month) => sum + month.bookingsCount, 0);
    const totalCancelled = monthlyRevenue.reduce((sum, month) => sum + month.cancelledBookings, 0);
    
    return totalBookings > 0 ? (totalCancelled / totalBookings) * 100 : 0;
  };

  useEffect(() => {
    if (counselorId) {
      fetchAllData();
    }
  }, [counselorId]);

  return {
    // データ
    monthlyRevenue,
    timeSlotAnalytics,
    satisfactionTrends,
    comprehensiveStats,
    
    // 状態
    loading,
    error,
    
    // 計算値
    revenueGrowthRate: getRevenueGrowthRate(),
    bookingGrowthRate: getBookingGrowthRate(),
    popularTimeSlots: getPopularTimeSlots(),
    timePeriodRevenue: getTimePeriodRevenue(),
    satisfactionTrend: getSatisfactionTrend(),
    monthlyAverageBookings: getMonthlyAverageBookings(),
    cancellationRate: getCancellationRate(),
    
    // 関数
    refetch: fetchAllData,
    fetchMonthlyRevenue,
    fetchTimeSlotAnalytics,
    fetchSatisfactionTrends
  };
};