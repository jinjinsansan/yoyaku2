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
      const { data, error } = await supabase
        .from('counselors')
        .select(`
          *,
          user:users(*)
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;

      // デバッグログを削除

      const formattedCounselors: Counselor[] = data
        .filter(counselor => counselor.user && counselor.user.id) // userとidが必須
        .map(counselor => ({
          id: counselor.id,
          userId: counselor.user_id,
          user: {
            id: counselor.user?.id || '',
            email: counselor.user?.email || '',
            name: counselor.user?.name || '',
            phone: counselor.user?.phone || '',
            avatar: counselor.user?.avatar || '',
            createdAt: new Date(counselor.user?.created_at || Date.now()),
            updatedAt: new Date(counselor.user?.updated_at || Date.now())
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
      }));

      setCounselors(formattedCounselors);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { counselors, loading, error, refetch: fetchCounselors };
};