import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FavoriteCounselor } from '../types';
import { useAuth } from './useAuth';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteCounselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // お気に入り一覧取得
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('favorite_counselors')
        .select(`
          id,
          user_id,
          counselor_id,
          created_at,
          counselor:counselors!favorite_counselors_counselor_id_fkey (
            id,
            user_id,
            bio,
            specialties,
            profile_image,
            profile_url,
            hourly_rate,
            is_active,
            rating,
            review_count,
            region,
            session_type,
            experience_years,
            credentials,
            languages,
            introduction_video_url,
            availability_status,
            created_at,
            updated_at,
            user:users!counselors_user_id_fkey (
              id,
              name,
              email,
              avatar,
              phone
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setFavorites(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'お気に入りの取得に失敗しました';
      setError(errorMessage);
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  // お気に入りに追加
  const addToFavorites = async (counselorId: string): Promise<boolean> => {
    if (!user) {
      setError('ログインが必要です');
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('favorite_counselors')
        .insert({
          user_id: user.id,
          counselor_id: counselorId
        });

      if (insertError) throw insertError;

      // リストを更新
      await fetchFavorites();
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'お気に入りの追加に失敗しました';
      setError(errorMessage);
      console.error('Error adding to favorites:', err);
      return false;
    }
  };

  // お気に入りから削除
  const removeFromFavorites = async (counselorId: string): Promise<boolean> => {
    if (!user) {
      setError('ログインが必要です');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('favorite_counselors')
        .delete()
        .eq('user_id', user.id)
        .eq('counselor_id', counselorId);

      if (deleteError) throw deleteError;

      // リストを更新
      await fetchFavorites();
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'お気に入りの削除に失敗しました';
      setError(errorMessage);
      console.error('Error removing from favorites:', err);
      return false;
    }
  };

  // お気に入りかどうかをチェック
  const isFavorite = (counselorId: string): boolean => {
    return favorites.some(fav => fav.counselor_id === counselorId);
  };

  // お気に入りのトグル
  const toggleFavorite = async (counselorId: string): Promise<boolean> => {
    if (isFavorite(counselorId)) {
      return await removeFromFavorites(counselorId);
    } else {
      return await addToFavorites(counselorId);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
};