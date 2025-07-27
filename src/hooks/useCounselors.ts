import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Counselor } from '../types';

export const useCounselors = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    try {
      setLoading(true);
      console.log('カウンセラー一覧取得開始');
      
      const { data, error } = await supabase
        .from('counselors')
        .select(`
          *,
          user:users(*)
        `)
        .order('rating', { ascending: false });

      console.log('Supabase レスポンス:', { data, error });
      console.log('取得されたデータ数:', data?.length || 0);

      if (error) {
        console.error('Supabase エラー:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('データベースにカウンセラーデータが存在しません');
        setCounselors([]);
        setLoading(false);
        return;
      }

      console.log('生データ:', data);

      const formattedCounselors: Counselor[] = data
        .map(counselor => {
          console.log(`カウンセラー ${counselor.id} をフォーマット中:`, counselor);
          
          // userデータが不完全な場合でも、カウンセラーデータを表示
          const userData = counselor.user || {};
          
          // カウンセラーの名前を取得（counselorsテーブルのnameカラムから）
          const counselorName = (counselor as any).name || 'カウンセラー';
          
          // デバッグログ
          console.log(`カウンセラー ${counselor.id} の名前:`, counselorName);
          
          return {
            id: counselor.id,
            userId: counselor.user_id,
            user: {
              id: userData.id || counselor.user_id || '',
              email: userData.email || 'unknown@example.com',
              name: counselorName,
              phone: userData.phone || '',
              avatar: userData.avatar || '',
              createdAt: new Date(userData.created_at || counselor.created_at || Date.now()),
              updatedAt: new Date(userData.updated_at || counselor.updated_at || Date.now())
            },
            profileImage: counselor.profile_image || undefined,
            bio: counselor.bio,
            specialties: Array.isArray(counselor.specialties) && counselor.specialties.length > 0 
              ? counselor.specialties.filter(s => s && s.trim().length > 0)
              : [],
            profileUrl: counselor.profile_url || undefined,
            hourlyRate: counselor.hourly_rate,
            isActive: counselor.is_active,
            rating: counselor.rating,
            reviewCount: counselor.review_count,
            createdAt: new Date(counselor.created_at),
            updatedAt: new Date(counselor.updated_at)
          };
        });

      console.log('フォーマット後のカウンセラー数:', formattedCounselors.length);
      console.log('最終的なカウンセラーリスト:', formattedCounselors);

      setCounselors(formattedCounselors);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'カウンセラー一覧の取得に失敗しました';
      console.error('カウンセラー取得エラー:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { counselors, loading, error, refetch: fetchCounselors };
};