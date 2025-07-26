import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Schedule } from '../types';

export const useSchedules = (counselorId?: string, selectedDate?: Date) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (counselorId) {
      fetchSchedules(counselorId, selectedDate);
    }
  }, [counselorId, selectedDate]);

  const fetchSchedules = async (id: string, date?: Date) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('schedules')
        .select(`
          *,
          counselor:counselors(
            *,
            user:users(*)
          )
        `)
        .eq('counselor_id', id)
        .eq('is_available', true);

      // 特定の日付が指定されている場合はその日のスケジュールのみ取得
      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        query = query.eq('date', dateStr);
      } else {
        // 日付が指定されていない場合は今日以降のスケジュールを取得
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('date', today);
      }

      const { data, error } = await query.order('date, start_time');

      if (error) throw error;

      const formattedSchedules: Schedule[] = data
        .filter(schedule => schedule.counselor && schedule.counselor.user) // nullチェック
        .map(schedule => ({
          id: schedule.id,
          counselorId: schedule.counselor_id,
          counselor: {
            id: schedule.counselor?.id || '',
            userId: schedule.counselor?.user_id || '',
            user: {
              id: schedule.counselor.user?.id || '',
              email: schedule.counselor.user?.email || '',
              name: schedule.counselor.user?.name || '',
              phone: schedule.counselor.user?.phone || '',
              avatar: schedule.counselor.user?.avatar || '',
              createdAt: new Date(schedule.counselor.user?.created_at || Date.now()),
              updatedAt: new Date(schedule.counselor.user?.updated_at || Date.now())
            },
          profileImage: schedule.counselor.profile_image,
          bio: schedule.counselor.bio,
          specialties: Array.isArray(schedule.counselor.specialties) && schedule.counselor.specialties.length > 0 
            ? schedule.counselor.specialties.filter(s => s && s.trim().length > 0)
            : [],
          profileUrl: schedule.counselor.profile_url,
          hourlyRate: schedule.counselor.hourly_rate,
          isActive: schedule.counselor.is_active,
          rating: schedule.counselor.rating,
          reviewCount: schedule.counselor.review_count,
          createdAt: new Date(schedule.counselor.created_at),
          updatedAt: new Date(schedule.counselor.updated_at)
        },
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        isAvailable: schedule.is_available
      }));

      setSchedules(formattedSchedules);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { schedules, loading, error, refetch: () => counselorId && fetchSchedules(counselorId, selectedDate) };
};