import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Loader2, MessageCircle, CreditCard } from 'lucide-react';
import { useCounselors } from '../hooks/useCounselors';
import { useFavorites } from '../hooks/useFavorites';
import { CounselorCard } from '../components/counselor/CounselorCard';
import { CounselorFilter } from '../components/counselor/CounselorFilter';
import { Counselor, CounselorFilters } from '../types';

export const CounselorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'chat' または 'payment'
  const { counselors, loading, error } = useCounselors();
  const { favorites } = useFavorites();

  // フィルター状態
  const [filters, setFilters] = useState<CounselorFilters>({
    searchTerm: '',
    specialties: [],
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    regions: [],
    sessionTypes: [],
    availabilityStatus: [],
    languages: [],
    experienceYears: { min: 0, max: 30 },
    onlyFavorites: false,
    sortBy: 'rating'
  });

  // フィルタリングとソートされたカウンセラー
  const filteredAndSortedCounselors = useMemo(() => {
    let filtered = counselors.filter(counselor => {
      // 名前での検索
      const matchesSearch = !filters.searchTerm || 
        counselor.user?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      // 専門分野での絞り込み
      const matchesSpecialties = filters.specialties.length === 0 ||
        filters.specialties.some(specialty => 
          counselor.specialties && Array.isArray(counselor.specialties) && 
          counselor.specialties.includes(specialty)
        );

      // 料金帯での絞り込み
      const matchesPrice = counselor.hourlyRate >= filters.minPrice && 
        counselor.hourlyRate <= filters.maxPrice;

      // 評価での絞り込み
      const matchesRating = counselor.rating >= filters.minRating;

      // 地域での絞り込み
      const matchesRegion = filters.regions.length === 0 ||
        filters.regions.includes(counselor.region);

      // セッション形式での絞り込み
      const matchesSessionType = filters.sessionTypes.length === 0 ||
        filters.sessionTypes.includes(counselor.sessionType) ||
        (filters.sessionTypes.includes('both' as any) && counselor.sessionType === 'both');

      // 空き状況での絞り込み
      const matchesAvailability = filters.availabilityStatus.length === 0 ||
        filters.availabilityStatus.includes(counselor.availabilityStatus);

      // 言語での絞り込み
      const matchesLanguages = filters.languages.length === 0 ||
        filters.languages.some(lang => 
          counselor.languages && Array.isArray(counselor.languages) && 
          counselor.languages.includes(lang)
        );

      // 経験年数での絞り込み
      const matchesExperience = counselor.experienceYears >= filters.experienceYears.min &&
        counselor.experienceYears <= filters.experienceYears.max;

      // お気に入りのみの絞り込み
      const matchesFavorites = !filters.onlyFavorites ||
        favorites.some(fav => fav.counselor_id === counselor.id);

      return matchesSearch && matchesSpecialties && matchesPrice && matchesRating &&
        matchesRegion && matchesSessionType && matchesAvailability && matchesLanguages &&
        matchesExperience && matchesFavorites;
    });

    // ソート
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.hourlyRate - b.hourlyRate;
        case 'price_desc':
          return b.hourlyRate - a.hourlyRate;
        case 'experience':
          return b.experienceYears - a.experienceYears;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'rating':
        default:
          return b.rating - a.rating;
      }
    });

    return filtered;
  }, [counselors, filters, favorites]);

  const handleCounselorSelect = (counselor: Counselor) => {
    // モードに応じて遷移先を変更
    if (mode === 'payment') {
      navigate(`/counselors/${counselor.id}?mode=payment`);
    } else {
      // デフォルトまたはchatモードの場合
      navigate(`/counselors/${counselor.id}?mode=chat`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">カウンセラー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {mode === 'payment' ? (
              <CreditCard className="w-8 h-8 text-indigo-600 mr-3" />
            ) : (
              <MessageCircle className="w-8 h-8 text-indigo-600 mr-3" />
            )}
            <h1 className="text-3xl font-bold text-slate-800">
              {mode === 'payment' ? '決済・予約の完了' : 'カウンセラーとチャット'}
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            {mode === 'payment' 
              ? 'カウンセラーを選択して決済を完了してください' 
              : 'チャットで相談したいカウンセラーを選択してください'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* フィルター */}
          <div className="lg:col-span-1">
            <CounselorFilter
              filters={filters}
              onFiltersChange={setFilters}
              counselors={counselors}
            />
          </div>

          {/* カウンセラー一覧 */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-slate-600">
                {filteredAndSortedCounselors.length}名のカウンセラーが見つかりました
              </p>
              {filters.onlyFavorites && (
                <p className="text-sm text-red-600">
                  💖 お気に入りのみ表示中
                </p>
              )}
            </div>

            {filteredAndSortedCounselors.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  {filters.onlyFavorites 
                    ? 'お気に入りのカウンセラーがいません'
                    : '条件に合うカウンセラーが見つかりません'
                  }
                </h3>
                <p className="text-slate-500">
                  {filters.onlyFavorites
                    ? 'カウンセラーをお気に入りに追加してください'
                    : '検索条件を変更してお試しください'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedCounselors.map((counselor) => (
                  <CounselorCard
                    key={counselor.id}
                    counselor={counselor}
                    onSelect={handleCounselorSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};