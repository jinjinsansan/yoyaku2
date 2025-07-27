import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Booking, BookingStatus, ServiceType } from '../types';
import { useAuth } from './useAuth';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          user:users(*),
          counselor:counselors(
            *,
            user:users(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBookings: Booking[] = data
        .filter(booking => booking.user && booking.counselor && booking.counselor.user) // nullチェック
        .map(booking => ({
          id: booking.id,
          userId: booking.user_id,
          counselorId: booking.counselor_id,
          user: {
            id: booking.user?.id || '',
            email: booking.user?.email || '',
            name: booking.user?.name || '',
            phone: booking.user?.phone || '',
            avatar: booking.user?.avatar || '',
            createdAt: new Date(booking.user?.created_at || Date.now()),
            updatedAt: new Date(booking.user?.updated_at || Date.now())
          },
          counselor: {
            id: booking.counselor?.id || '',
            userId: booking.counselor?.user_id || '',
            user: {
              id: booking.counselor.user?.id || '',
              email: booking.counselor.user?.email || '',
              name: booking.counselor.user?.name || '',
              phone: booking.counselor.user?.phone || '',
              avatar: booking.counselor.user?.avatar || '',
              createdAt: new Date(booking.counselor.user?.created_at || Date.now()),
              updatedAt: new Date(booking.counselor.user?.updated_at || Date.now())
            },
          profileImage: booking.counselor.profile_image,
          bio: booking.counselor.bio,
          specialties: Array.isArray(booking.counselor.specialties) && booking.counselor.specialties.length > 0 
            ? booking.counselor.specialties.filter(s => s && s.trim().length > 0)
            : [],
          profileUrl: booking.counselor.profile_url,
          hourlyRate: booking.counselor.hourly_rate,
          isActive: booking.counselor.is_active,
          rating: booking.counselor.rating,
          reviewCount: booking.counselor.review_count,
          createdAt: new Date(booking.counselor.created_at),
          updatedAt: new Date(booking.counselor.updated_at)
        },
        serviceType: booking.service_type as ServiceType,
        scheduledAt: new Date(booking.scheduled_at),
        status: booking.status as BookingStatus,
        amount: booking.amount,
        notes: booking.notes,
        createdAt: new Date(booking.created_at),
        updatedAt: new Date(booking.updated_at)
      }));

      setBookings(formattedBookings);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予約一覧の取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const createBooking = async (bookingData: {
    counselorId: string;
    serviceType: ServiceType;
    scheduledAt: Date;
    amount: number;
    notes?: string;
  }) => {
    if (!user) throw new Error('ログインが必要です');

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          counselor_id: bookingData.counselorId,
          service_type: bookingData.serviceType,
          scheduled_at: bookingData.scheduledAt.toISOString(),
          amount: bookingData.amount,
          notes: bookingData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // チャットルームを自動作成
      try {
        await supabase
          .from('chat_rooms')
          .insert({
            booking_id: data.id,
            is_active: true
          });

      } catch (chatError) {
        console.error('チャットルーム作成エラー:', chatError);
        // チャットルーム作成に失敗しても予約は成功とする
      }

      await fetchBookings(); // 一覧を再取得
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予約の作成に失敗しました';
      throw new Error(errorMessage);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings(); // 一覧を再取得
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予約ステータスの更新に失敗しました';
      throw new Error(errorMessage);
    }
  };

  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBookingStatus,
    refetch: fetchBookings
  };
};