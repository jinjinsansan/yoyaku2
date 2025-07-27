import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Counselor } from '../types';

export const useCounselor = (id: string) => {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCounselor(id);
    }
  }, [id]);

  const fetchCounselor = async (counselorId: string) => {
    try {
      setLoading(true);
      console.log('カウンセラー詳細取得開始:', counselorId);
      
      const { data, error } = await supabase
        .from('counselors')
        .select(`
          *,
          user:users(*),
          schedules(*)
        `)
        .eq('id', counselorId)
        .single();

      console.log('カウンセラー詳細レスポンス:', { data, error });

      if (error) throw error;
      
      if (!data) {
        throw new Error('カウンセラーが見つかりません');
      }

      // userデータが不完全でもカウンセラーを表示
      const userData = data.user || {};
      
      const formattedCounselor: Counselor = {
        id: data.id,
        userId: data.user_id,
        user: {
          id: userData.id || data.user_id || '',
          email: userData.email || 'unknown@example.com',
          name: userData.name || 'カウンセラー',
          phone: userData.phone || '',
          avatar: userData.avatar || '',
          createdAt: new Date(userData.created_at || data.created_at || Date.now()),
          updatedAt: new Date(userData.updated_at || data.updated_at || Date.now())
        },
        profileImage: data.profile_image,
        bio: data.bio,
        specialties: Array.isArray(data.specialties) && data.specialties.length > 0 
          ? data.specialties.filter(s => s && s.trim().length > 0)
          : [],
        profileUrl: data.profile_url,
        hourlyRate: data.hourly_rate,
        isActive: data.is_active,
        rating: data.rating,
        reviewCount: data.review_count,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      console.log('フォーマット後のカウンセラー:', formattedCounselor);
      setCounselor(formattedCounselor);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'カウンセラー情報の取得に失敗しました';
      console.error('カウンセラー詳細取得エラー:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { counselor, loading, error, refetch: () => fetchCounselor(id) };
};