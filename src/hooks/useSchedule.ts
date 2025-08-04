import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TimeSlot {
  id: string;
  counselorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked?: boolean;
  bookingId?: string;
  recurringWeekly?: boolean;
}

export const useSchedule = (counselorId?: string) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // スケジュールデータを取得
  const fetchSchedule = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      setError(null);

      // デフォルトで今日から30日後までのスケジュールを取得
      const start = startDate || new Date();
      const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('counselor_schedules')
        .select(`
          id,
          counselor_id,
          date,
          start_time,
          end_time,
          is_available,
          recurring_weekly,
          created_at,
          updated_at
        `)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);

      if (counselorId) {
        query = query.eq('counselor_id', counselorId);
      }

      const { data: scheduleData, error: scheduleError } = await query
        .order('date')
        .order('start_time');

      if (scheduleError) throw scheduleError;

      // 予約データも取得して予約済み時間をマーク
      let bookingQuery = supabase
        .from('bookings')
        .select(`
          id,
          counselor_id,
          scheduled_at,
          status
        `)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .in('status', ['pending', 'confirmed']);

      if (counselorId) {
        bookingQuery = bookingQuery.eq('counselor_id', counselorId);
      }

      const { data: bookingData, error: bookingError } = await bookingQuery;

      if (bookingError) throw bookingError;

      // スケジュールデータをTimeSlot形式に変換
      const slots: TimeSlot[] = (scheduleData || []).map(schedule => {
        const scheduleDateTime = new Date(`${schedule.date}T${schedule.start_time}`);
        
        // この時間枠に予約があるかチェック
        const booking = (bookingData || []).find(booking => {
          const bookingDateTime = new Date(booking.scheduled_at);
          return booking.counselor_id === schedule.counselor_id &&
                 Math.abs(bookingDateTime.getTime() - scheduleDateTime.getTime()) < 60000; // 1分以内の差は同じとみなす
        });

        return {
          id: schedule.id,
          counselorId: schedule.counselor_id,
          date: schedule.date,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          isAvailable: schedule.is_available,
          isBooked: !!booking,
          bookingId: booking?.id,
          recurringWeekly: schedule.recurring_weekly
        };
      });

      setTimeSlots(slots);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'スケジュールの取得に失敗しました';
      setError(errorMessage);
      console.error('Schedule fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // スケジュールを追加
  const addTimeSlot = async (slot: Omit<TimeSlot, 'id' | 'isBooked' | 'bookingId'>) => {
    try {
      const { data, error } = await supabase
        .from('counselor_schedules')
        .insert({
          counselor_id: slot.counselorId,
          date: slot.date,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: slot.isAvailable,
          recurring_weekly: slot.recurringWeekly || false
        })
        .select()
        .single();

      if (error) throw error;

      // ローカル状態を更新
      const newSlot: TimeSlot = {
        id: data.id,
        counselorId: data.counselor_id,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        isAvailable: data.is_available,
        recurringWeekly: data.recurring_weekly,
        isBooked: false
      };

      setTimeSlots(prev => [...prev, newSlot].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
      }));

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'スケジュールの追加に失敗しました';
      setError(errorMessage);
      console.error('Add time slot error:', err);
      return false;
    }
  };

  // スケジュールを更新
  const updateTimeSlot = async (id: string, updates: Partial<Omit<TimeSlot, 'id' | 'counselorId'>>) => {
    try {
      const updateData: any = {};
      
      if (updates.date) updateData.date = updates.date;
      if (updates.startTime) updateData.start_time = updates.startTime;
      if (updates.endTime) updateData.end_time = updates.endTime;
      if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;
      if (updates.recurringWeekly !== undefined) updateData.recurring_weekly = updates.recurringWeekly;

      const { error } = await supabase
        .from('counselor_schedules')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // ローカル状態を更新
      setTimeSlots(prev => prev.map(slot => 
        slot.id === id ? { ...slot, ...updates } : slot
      ));

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'スケジュールの更新に失敗しました';
      setError(errorMessage);
      console.error('Update time slot error:', err);
      return false;
    }
  };

  // スケジュールを削除
  const deleteTimeSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('counselor_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // ローカル状態を更新
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'スケジュールの削除に失敗しました';
      setError(errorMessage);
      console.error('Delete time slot error:', err);
      return false;
    }
  };

  // 一括でスケジュールを生成（毎週繰り返し等）
  const generateRecurringSchedule = async (
    counselorId: string, 
    startDate: Date, 
    endDate: Date, 
    timeSlots: Array<{startTime: string, endTime: string}>,
    weekdays: number[] // 0=日曜日, 1=月曜日, ...
  ) => {
    try {
      const schedules = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        if (weekdays.includes(current.getDay())) {
          for (const slot of timeSlots) {
            schedules.push({
              counselor_id: counselorId,
              date: current.toISOString().split('T')[0],
              start_time: slot.startTime,
              end_time: slot.endTime,
              is_available: true,
              recurring_weekly: true
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }

      if (schedules.length > 0) {
        const { error } = await supabase
          .from('counselor_schedules')
          .insert(schedules);

        if (error) throw error;

        // データを再取得
        await fetchSchedule();
        return true;
      }

      return false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '繰り返しスケジュールの生成に失敗しました';
      setError(errorMessage);
      console.error('Generate recurring schedule error:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [counselorId]);

  return {
    timeSlots,
    loading,
    error,
    fetchSchedule,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    generateRecurringSchedule,
    refetch: fetchSchedule
  };
};