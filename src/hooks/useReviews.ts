import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Review } from '../types';
import { useAuth } from './useAuth';

export const useReviews = (counselorId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (counselorId) {
      fetchReviews(counselorId);
    }
  }, [counselorId]);

  const fetchReviews = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(*),
          counselor:counselors(
            *,
            user:users(*)
          )
        `)
        .eq('counselor_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReviews: Review[] = data
        .filter(review => review.user && review.counselor && review.counselor.user) // nullチェック
        .map(review => ({
          id: review.id,
          userId: review.user_id,
          counselorId: review.counselor_id,
          bookingId: review.booking_id,
          user: {
            id: review.user?.id || '',
            email: review.user?.email || '',
            name: review.user?.name || '',
            phone: review.user?.phone || '',
            avatar: review.user?.avatar || '',
            createdAt: new Date(review.user?.created_at || Date.now()),
            updatedAt: new Date(review.user?.updated_at || Date.now())
          },
          counselor: {
            id: review.counselor?.id || '',
            userId: review.counselor?.user_id || '',
            user: {
              id: review.counselor.user?.id || '',
              email: review.counselor.user?.email || '',
              name: review.counselor.user?.name || '',
              phone: review.counselor.user?.phone || '',
              avatar: review.counselor.user?.avatar || '',
              createdAt: new Date(review.counselor.user?.created_at || Date.now()),
              updatedAt: new Date(review.counselor.user?.updated_at || Date.now())
            },
          profileImage: review.counselor.profile_image,
          bio: review.counselor.bio,
          specialties: Array.isArray(review.counselor.specialties) && review.counselor.specialties.length > 0 
            ? review.counselor.specialties.filter(s => s && s.trim().length > 0)
            : [],
          profileUrl: review.counselor.profile_url,
          hourlyRate: review.counselor.hourly_rate,
          isActive: review.counselor.is_active,
          rating: review.counselor.rating,
          reviewCount: review.counselor.review_count,
          createdAt: new Date(review.counselor.created_at),
          updatedAt: new Date(review.counselor.updated_at)
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date(review.created_at)
      }));

      setReviews(formattedReviews);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'レビュー一覧の取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData: {
    counselorId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }) => {
    if (!user) throw new Error('ログインが必要です');

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          counselor_id: reviewData.counselorId,
          booking_id: reviewData.bookingId,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
        .select()
        .single();

      if (error) throw error;

      if (counselorId) {
        await fetchReviews(counselorId);
      }
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'レビューの作成に失敗しました';
      throw new Error(errorMessage);
    }
  };

  return {
    reviews,
    loading,
    error,
    createReview,
    refetch: () => counselorId && fetchReviews(counselorId)
  };
};