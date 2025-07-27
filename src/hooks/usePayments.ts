import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Payment, PaymentMethod, PaymentStatus } from '../types';
import { useAuth } from './useAuth';

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, fetchPayments]);

  const fetchPayments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            *,
            user:users(*),
            counselor:counselors(
              *,
              user:users(*)
            )
          )
        `)
        .eq('booking.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPayments: Payment[] = data
        .filter(payment => payment.booking?.user && payment.booking?.counselor?.user) // nullチェック
        .map(payment => ({
          id: payment.id,
          bookingId: payment.booking_id,
          booking: {
            id: payment.booking.id,
            userId: payment.booking.user_id,
            counselorId: payment.booking.counselor_id,
            user: {
              id: payment.booking.user?.id || '',
              email: payment.booking.user?.email || '',
              name: payment.booking.user?.name || '',
              phone: payment.booking.user?.phone || '',
              avatar: payment.booking.user?.avatar || '',
              createdAt: new Date(payment.booking.user?.created_at || Date.now()),
              updatedAt: new Date(payment.booking.user?.updated_at || Date.now())
            },
            counselor: {
              id: payment.booking.counselor?.id || '',
              userId: payment.booking.counselor?.user_id || '',
              user: {
                id: payment.booking.counselor.user?.id || '',
                email: payment.booking.counselor.user?.email || '',
                name: payment.booking.counselor.user?.name || '',
                phone: payment.booking.counselor.user?.phone || '',
                avatar: payment.booking.counselor.user?.avatar || '',
                createdAt: new Date(payment.booking.counselor.user?.created_at || Date.now()),
                updatedAt: new Date(payment.booking.counselor.user?.updated_at || Date.now())
              },
            profileImage: payment.booking.counselor.profile_image,
            bio: payment.booking.counselor.bio,
            specialties: Array.isArray(payment.booking.counselor.specialties) && payment.booking.counselor.specialties.length > 0 
              ? payment.booking.counselor.specialties.filter(s => s && s.trim().length > 0)
              : [],
            profileUrl: payment.booking.counselor.profile_url,
            hourlyRate: payment.booking.counselor.hourly_rate,
            isActive: payment.booking.counselor.is_active,
            rating: payment.booking.counselor.rating,
            reviewCount: payment.booking.counselor.review_count,
            createdAt: new Date(payment.booking.counselor.created_at),
            updatedAt: new Date(payment.booking.counselor.updated_at)
          },
          serviceType: payment.booking.service_type,
          scheduledAt: new Date(payment.booking.scheduled_at),
          status: payment.booking.status,
          amount: payment.booking.amount,
          notes: payment.booking.notes,
          createdAt: new Date(payment.booking.created_at),
          updatedAt: new Date(payment.booking.updated_at)
        },
        amount: payment.amount,
        method: payment.method as PaymentMethod,
        status: payment.status as PaymentStatus,
        transactionId: payment.transaction_id,
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at)
      }));

      setPayments(formattedPayments);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '決済一覧の取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPayment = async (paymentData: {
    bookingId: string;
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          booking_id: paymentData.bookingId,
          amount: paymentData.amount,
          method: paymentData.method,
          transaction_id: paymentData.transactionId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      await fetchPayments();
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '決済の作成に失敗しました';
      throw new Error(errorMessage);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: PaymentStatus, transactionId?: string) => {
    try {
      const updateData: { status: PaymentStatus; transaction_id?: string } = { status };
      if (transactionId) {
        updateData.transaction_id = transactionId;
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      await fetchPayments();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '決済ステータスの更新に失敗しました';
      throw new Error(errorMessage);
    }
  };

  return {
    payments,
    loading,
    error,
    createPayment,
    updatePaymentStatus,
    refetch: fetchPayments
  };
};