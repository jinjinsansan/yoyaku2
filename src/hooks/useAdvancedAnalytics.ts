import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface RealtimeKPI {
  metricDate: Date;
  metricHour: number;
  totalActiveBookings: number;
  totalRevenueToday: number;
  averageSessionRating: number;
  totalCompletedSessionsToday: number;
  totalCancelledSessionsToday: number;
  newUserRegistrations: number;
  activeUsersLastHour: number;
  activeCounselors: number;
  totalAvailableSlots: number;
  occupiedSlots: number;
  counselorUtilizationRate: number;
}

export interface UserBehaviorPattern {
  userId: string;
  name: string;
  email: string;
  totalSessions: number;
  avgSessionDuration: number;
  totalPageViews: number;
  totalSearches: number;
  totalProfileViews: number;
  totalBookingAttempts: number;
  totalSuccessfulBookings: number;
  bookingConversionRate: number;
  mostPreferredSpecialization: string;
  mostPreferredTimeSlot: string;
  primaryDeviceType: string;
  lastActivity: Date;
  activityLevel: 'active' | 'inactive' | 'dormant';
}

export interface RevenuePrediction {
  predictionDate: Date;
  predictionPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  predictedRevenue: number;
  predictedBookings: number;
  confidenceLevel: number;
  historicalTrendFactor: number;
  seasonalFactor: number;
  marketTrendFactor: number;
  counselorPerformanceFactor: number;
  actualRevenue?: number;
  actualBookings?: number;
  predictionAccuracy?: number;
}

export interface CounselorUtilization {
  counselorId: string;
  counselorName: string;
  availableSlotsToday: number;
  bookedSlotsToday: number;
  availableSlotsWeek: number;
  bookedSlotsWeek: number;
  availableSlotsMonth: number;
  bookedSlotsMonth: number;
  avgResponseTimeSeconds: number;
  lastBookingTime?: Date;
  lastAvailabilityUpdate?: Date;
  todayUtilizationRate: number;
  weekUtilizationRate: number;
  monthUtilizationRate: number;
}

export const useAdvancedAnalytics = (counselorId?: string) => {
  const [realtimeKPI, setRealtimeKPI] = useState<RealtimeKPI | null>(null);
  const [userBehaviorPatterns, setUserBehaviorPatterns] = useState<UserBehaviorPattern[]>([]);
  const [revenuePredictions, setRevenuePredictions] = useState<RevenuePrediction[]>([]);
  const [counselorUtilization, setCounselorUtilization] = useState<CounselorUtilization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // リアルタイムKPI取得
  const fetchRealtimeKPI = async () => {
    try {
      const { data, error } = await supabase
        .from('realtime_kpi_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .order('metric_hour', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setRealtimeKPI({
          metricDate: new Date(data.metric_date),
          metricHour: data.metric_hour,
          totalActiveBookings: data.total_active_bookings || 0,
          totalRevenueToday: parseFloat(data.total_revenue_today || 0),
          averageSessionRating: parseFloat(data.average_session_rating || 0),
          totalCompletedSessionsToday: data.total_completed_sessions_today || 0,
          totalCancelledSessionsToday: data.total_cancelled_sessions_today || 0,
          newUserRegistrations: data.new_user_registrations || 0,
          activeUsersLastHour: data.active_users_last_hour || 0,
          activeCounselors: data.active_counselors || 0,
          totalAvailableSlots: data.total_available_slots || 0,
          occupiedSlots: data.occupied_slots || 0,
          counselorUtilizationRate: parseFloat(data.counselor_utilization_rate || 0)
        });
      }
    } catch (err) {
      console.error('Realtime KPI fetch error:', err);
      return null;
    }
  };

  // ユーザー行動パターン取得
  const fetchUserBehaviorPatterns = async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('user_behavior_patterns')
        .select('*')
        .order('last_activity', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        userId: item.user_id,
        name: item.name,
        email: item.email,
        totalSessions: item.total_sessions || 0,
        avgSessionDuration: parseFloat(item.avg_session_duration || 0),
        totalPageViews: item.total_page_views || 0,
        totalSearches: item.total_searches || 0,
        totalProfileViews: item.total_profile_views || 0,
        totalBookingAttempts: item.total_booking_attempts || 0,
        totalSuccessfulBookings: item.total_successful_bookings || 0,
        bookingConversionRate: parseFloat(item.booking_conversion_rate || 0),
        mostPreferredSpecialization: item.most_preferred_specialization || '',
        mostPreferredTimeSlot: item.most_preferred_time_slot || '',
        primaryDeviceType: item.primary_device_type || 'unknown',
        lastActivity: new Date(item.last_activity),
        activityLevel: item.activity_level as 'active' | 'inactive' | 'dormant'
      }));
    } catch (err) {
      console.error('User behavior fetch error:', err);
      return [];
    }
  };

  // 収益予測取得
  const fetchRevenuePredictions = async (period: string = 'monthly', periodsAhead: number = 3) => {
    try {
      if (!counselorId) return [];

      const { data, error } = await supabase.rpc('calculate_revenue_prediction', {
        p_counselor_id: counselorId,
        p_prediction_period: period,
        p_periods_ahead: periodsAhead
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        predictionDate: new Date(item.prediction_date),
        predictionPeriod: period as 'daily' | 'weekly' | 'monthly' | 'quarterly',
        predictedRevenue: parseFloat(item.predicted_revenue || 0),
        predictedBookings: item.predicted_bookings || 0,
        confidenceLevel: parseFloat(item.confidence_level || 0),
        historicalTrendFactor: 1.0,
        seasonalFactor: 1.0,
        marketTrendFactor: 1.0,
        counselorPerformanceFactor: 1.0
      }));
    } catch (err) {
      console.error('Revenue prediction fetch error:', err);
      return [];
    }
  };

  // カウンセラー稼働率取得
  const fetchCounselorUtilization = async () => {
    try {
      const { data, error } = await supabase
        .from('counselor_utilization_analysis')
        .select('*')
        .order('counselor_name');

      if (error) throw error;

      return (data || []).map((item: any) => ({
        counselorId: item.counselor_id,
        counselorName: item.counselor_name,
        availableSlotsToday: item.available_slots_today || 0,
        bookedSlotsToday: item.booked_slots_today || 0,
        availableSlotsWeek: item.available_slots_week || 0,
        bookedSlotsWeek: item.booked_slots_week || 0,
        availableSlotsMonth: item.available_slots_month || 0,
        bookedSlotsMonth: item.booked_slots_month || 0,
        avgResponseTimeSeconds: parseFloat(item.avg_response_time_seconds || 0),
        lastBookingTime: item.last_booking_time ? new Date(item.last_booking_time) : undefined,
        lastAvailabilityUpdate: item.last_availability_update ? new Date(item.last_availability_update) : undefined,
        todayUtilizationRate: item.available_slots_today > 0 ? 
          (item.booked_slots_today / item.available_slots_today) * 100 : 0,
        weekUtilizationRate: item.available_slots_week > 0 ? 
          (item.booked_slots_week / item.available_slots_week) * 100 : 0,
        monthUtilizationRate: item.available_slots_month > 0 ? 
          (item.booked_slots_month / item.available_slots_month) * 100 : 0
      }));
    } catch (err) {
      console.error('Counselor utilization fetch error:', err);
      return [];
    }
  };

  // ユーザー行動トラッキング
  const trackUserBehavior = async (
    userId: string,
    sessionId: string,
    action: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      await supabase.rpc('track_user_behavior', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_action: action,
        p_metadata: metadata
      });
    } catch (err) {
      console.error('User behavior tracking error:', err);
    }
  };

  // リアルタイムKPI更新
  const updateRealtimeKPI = async () => {
    try {
      await supabase.rpc('update_realtime_kpi');
      await fetchRealtimeKPI();
    } catch (err) {
      console.error('KPI update error:', err);
    }
  };

  // 全データ取得
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        kpiData,
        behaviorData,
        predictionData,
        utilizationData
      ] = await Promise.all([
        fetchRealtimeKPI(),
        fetchUserBehaviorPatterns(),
        counselorId ? fetchRevenuePredictions() : Promise.resolve([]),
        fetchCounselorUtilization()
      ]);

      setUserBehaviorPatterns(behaviorData);
      setRevenuePredictions(predictionData);
      setCounselorUtilization(utilizationData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '高度な分析データの取得に失敗しました';
      setError(errorMessage);
      console.error('Advanced analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // リアルタイム更新の設定
  const setupRealtimeSubscription = useCallback(() => {
    const subscription = supabase
      .channel('advanced_analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'realtime_kpi_metrics'
      }, () => {
        fetchRealtimeKPI();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        updateRealtimeKPI();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // 分析サマリーの計算
  const getAnalyticsSummary = () => {
    const totalUsers = userBehaviorPatterns.length;
    const activeUsers = userBehaviorPatterns.filter(u => u.activityLevel === 'active').length;
    const avgConversionRate = totalUsers > 0 ? 
      userBehaviorPatterns.reduce((sum, u) => sum + u.bookingConversionRate, 0) / totalUsers : 0;
    
    const totalCounselors = counselorUtilization.length;
    const avgUtilizationRate = totalCounselors > 0 ?
      counselorUtilization.reduce((sum, c) => sum + c.monthUtilizationRate, 0) / totalCounselors : 0;

    return {
      totalUsers,
      activeUsers,
      userEngagementRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      avgConversionRate,
      totalCounselors,
      avgUtilizationRate,
      totalPredictedRevenue: revenuePredictions.reduce((sum, p) => sum + p.predictedRevenue, 0),
      avgPredictionConfidence: revenuePredictions.length > 0 ?
        revenuePredictions.reduce((sum, p) => sum + p.confidenceLevel, 0) / revenuePredictions.length : 0
    };
  };

  useEffect(() => {
    fetchAllData();
    const cleanup = setupRealtimeSubscription();
    
    // 5分ごとにKPIを更新
    const interval = setInterval(updateRealtimeKPI, 5 * 60 * 1000);
    
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [counselorId, setupRealtimeSubscription]);

  return {
    // データ
    realtimeKPI,
    userBehaviorPatterns,
    revenuePredictions,
    counselorUtilization,
    
    // 状態
    loading,
    error,
    
    // 計算値
    analyticsSummary: getAnalyticsSummary(),
    
    // 関数
    refetch: fetchAllData,
    trackUserBehavior,
    updateRealtimeKPI,
    fetchRevenuePredictions,
    fetchUserBehaviorPatterns,
    fetchCounselorUtilization
  };
};