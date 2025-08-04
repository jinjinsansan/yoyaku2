import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TimeSlot } from './useSchedule';

export const useRealtimeSchedule = (counselorId?: string) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期データを取得
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const start = new Date();
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      let scheduleQuery = supabase
        .from('counselor_schedules')
        .select(`
          id,
          counselor_id,
          date,
          start_time,
          end_time,
          is_available,
          recurring_weekly
        `)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);

      if (counselorId) {
        scheduleQuery = scheduleQuery.eq('counselor_id', counselorId);
      }

      const { data: scheduleData, error: scheduleError } = await scheduleQuery
        .order('date')
        .order('start_time');

      if (scheduleError) throw scheduleError;

      // 予約データも取得
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

      // データを組み合わせてTimeSlot形式に変換
      const slots: TimeSlot[] = (scheduleData || []).map(schedule => {
        const scheduleDateTime = new Date(`${schedule.date}T${schedule.start_time}`);
        
        const booking = (bookingData || []).find(booking => {
          const bookingDateTime = new Date(booking.scheduled_at);
          return booking.counselor_id === schedule.counselor_id &&
                 Math.abs(bookingDateTime.getTime() - scheduleDateTime.getTime()) < 60000;
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
      console.error('Realtime schedule fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // リアルタイム更新の設定
    const setupRealtimeSubscriptions = () => {
      // スケジュール変更の監視
      const scheduleChannel = supabase
        .channel('schedule_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'counselor_schedules',
            ...(counselorId && { filter: `counselor_id=eq.${counselorId}` })
          },
          (payload) => {
            console.log('Schedule change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newSchedule = payload.new as any;
              const newSlot: TimeSlot = {
                id: newSchedule.id,
                counselorId: newSchedule.counselor_id,
                date: newSchedule.date,
                startTime: newSchedule.start_time,
                endTime: newSchedule.end_time,
                isAvailable: newSchedule.is_available,
                isBooked: false,
                recurringWeekly: newSchedule.recurring_weekly
              };
              
              setTimeSlots(prev => [...prev, newSlot].sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
              }));
            } else if (payload.eventType === 'UPDATE') {
              const updatedSchedule = payload.new as any;
              setTimeSlots(prev => prev.map(slot => 
                slot.id === updatedSchedule.id 
                  ? {
                      ...slot,
                      date: updatedSchedule.date,
                      startTime: updatedSchedule.start_time,
                      endTime: updatedSchedule.end_time,
                      isAvailable: updatedSchedule.is_available,
                      recurringWeekly: updatedSchedule.recurring_weekly
                    }
                  : slot
              ));
            } else if (payload.eventType === 'DELETE') {
              const deletedSchedule = payload.old as any;
              setTimeSlots(prev => prev.filter(slot => slot.id !== deletedSchedule.id));
            }
          }
        )
        .subscribe();

      // 予約変更の監視
      const bookingChannel = supabase
        .channel('booking_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            ...(counselorId && { filter: `counselor_id=eq.${counselorId}` })
          },
          (payload) => {
            console.log('Booking change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newBooking = payload.new as any;
              const bookingDateTime = new Date(newBooking.scheduled_at);

              setTimeSlots(prev => prev.map(slot => {
                const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
                if (
                  slot.counselorId === newBooking.counselor_id &&
                  Math.abs(bookingDateTime.getTime() - slotDateTime.getTime()) < 60000
                ) {
                  return {
                    ...slot,
                    isBooked: true,
                    bookingId: newBooking.id
                  };
                }
                return slot;
              }));
            } else if (payload.eventType === 'UPDATE') {
              const updatedBooking = payload.new as any;
              
              // キャンセルされた予約の場合
              if (updatedBooking.status === 'cancelled') {
                setTimeSlots(prev => prev.map(slot => 
                  slot.bookingId === updatedBooking.id
                    ? { ...slot, isBooked: false, bookingId: undefined }
                    : slot
                ));
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedBooking = payload.old as any;
              setTimeSlots(prev => prev.map(slot => 
                slot.bookingId === deletedBooking.id
                  ? { ...slot, isBooked: false, bookingId: undefined }
                  : slot
              ));
            }
          }
        )
        .subscribe();

      return () => {
        scheduleChannel.unsubscribe();
        bookingChannel.unsubscribe();
      };
    };

    const cleanup = setupRealtimeSubscriptions();

    return cleanup;
  }, [counselorId]);

  // 手動でデータを更新
  const refetch = () => {
    fetchInitialData();
  };

  // 特定の時間枠を楽観的に更新（即座にUIを更新）
  const optimisticUpdateSlot = (slotId: string, updates: Partial<TimeSlot>) => {
    setTimeSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, ...updates } : slot
    ));
  };

  // 新しい予約を楽観的に追加
  const optimisticAddBooking = (slotId: string, bookingId: string) => {
    optimisticUpdateSlot(slotId, { isBooked: true, bookingId });
  };

  // 予約をキャンセル（楽観的更新）
  const optimisticCancelBooking = (slotId: string) => {
    optimisticUpdateSlot(slotId, { isBooked: false, bookingId: undefined });
  };

  return {
    timeSlots,
    loading,
    error,
    refetch,
    optimisticUpdateSlot,
    optimisticAddBooking,
    optimisticCancelBooking
  };
};