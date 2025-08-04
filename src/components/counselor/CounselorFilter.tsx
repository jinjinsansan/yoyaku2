import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Heart, MapPin, Clock, Star, DollarSign } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CounselorFilters, Counselor } from '../../types';

interface CounselorFilterProps {
  filters: CounselorFilters;
  onFiltersChange: (filters: CounselorFilters) => void;
  counselors: Counselor[];
}

export const CounselorFilter: React.FC<CounselorFilterProps> = ({
  filters,
  onFiltersChange,
  counselors
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['search', 'specialties']);

  // 利用可能なオプションを計算
  const availableOptions = useMemo(() => {
    const specialties = new Set<string>();
    const regions = new Set<string>();
    const languages = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    counselors.forEach(counselor => {
      // 専門分野
      if (counselor.specialties && Array.isArray(counselor.specialties)) {
        counselor.specialties.forEach(specialty => {
          if (specialty && specialty.trim().length > 0) {
            specialties.add(specialty);
          }
        });
      }

      // 地域
      if (counselor.region) {
        regions.add(counselor.region);
      }

      // 言語
      if (counselor.languages && Array.isArray(counselor.languages)) {
        counselor.languages.forEach(lang => {
          if (lang && lang.trim().length > 0) {
            languages.add(lang);
          }
        });
      }

      // 価格範囲
      if (counselor.hourlyRate) {
        minPrice = Math.min(minPrice, counselor.hourlyRate);
        maxPrice = Math.max(maxPrice, counselor.hourlyRate);
      }
    });

    return {
      specialties: Array.from(specialties).sort(),
      regions: Array.from(regions).sort(),
      languages: Array.from(languages).sort(),
      priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice }
    };
  }, [counselors]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateFilters = (updates: Partial<CounselorFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
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
  };

  const hasActiveFilters = filters.searchTerm || 
    filters.specialties.length > 0 || 
    filters.regions.length > 0 ||
    filters.sessionTypes.length > 0 ||
    filters.languages.length > 0 ||
    filters.minRating > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 100000 ||
    filters.onlyFavorites;

  const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon: any }) => (
    <button
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full text-left"
    >
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">{title}</span>
      </div>
      {expandedSections.includes(id) ? (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">絞り込み</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-red-600 hover:text-red-700"
          >
            クリア
          </Button>
        )}
      </div>

      {/* 検索 */}
      <div className="space-y-2">
        <SectionHeader id="search" title="検索" icon={Search} />
        {expandedSections.includes('search') && (
          <Input
            placeholder="カウンセラー名で検索..."
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            icon={<Search className="w-5 h-5" />}
          />
        )}
      </div>

      {/* お気に入りのみ表示 */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyFavorites}
            onChange={(e) => updateFilters({ onlyFavorites: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-sm text-slate-700">お気に入りのみ表示</span>
        </label>
      </div>

      {/* 専門分野 */}
      <div className="space-y-2">
        <SectionHeader id="specialties" title="専門分野" icon={Filter} />
        {expandedSections.includes('specialties') && (
          <div className="flex flex-wrap gap-2">
            {availableOptions.specialties.map((specialty) => (
              <button
                key={specialty}
                onClick={() => {
                  const newSpecialties = filters.specialties.includes(specialty)
                    ? filters.specialties.filter(s => s !== specialty)
                    : [...filters.specialties, specialty];
                  updateFilters({ specialties: newSpecialties });
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.specialties.includes(specialty)
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {specialty}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 地域 */}
      <div className="space-y-2">
        <SectionHeader id="regions" title="地域" icon={MapPin} />
        {expandedSections.includes('regions') && (
          <div className="space-y-2">
            {availableOptions.regions.map((region) => (
              <label key={region} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.regions.includes(region)}
                  onChange={(e) => {
                    const newRegions = e.target.checked
                      ? [...filters.regions, region]
                      : filters.regions.filter(r => r !== region);
                    updateFilters({ regions: newRegions });
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">{region}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* セッション形式 */}
      <div className="space-y-2">
        <SectionHeader id="sessionTypes" title="セッション形式" icon={Clock} />
        {expandedSections.includes('sessionTypes') && (
          <div className="space-y-2">
            {[
              { value: 'online', label: 'オンライン' },
              { value: 'in_person', label: '対面' },
              { value: 'both', label: '両方対応' }
            ].map((type) => (
              <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.sessionTypes.includes(type.value as any)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...filters.sessionTypes, type.value as any]
                      : filters.sessionTypes.filter(t => t !== type.value);
                    updateFilters({ sessionTypes: newTypes });
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">{type.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 料金帯 */}
      <div className="space-y-2">
        <SectionHeader id="price" title="料金帯" icon={DollarSign} />
        {expandedSections.includes('price') && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="最低料金"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilters({ minPrice: Number(e.target.value) || 0 })}
                className="text-sm"
              />
              <Input
                type="number"
                placeholder="最高料金"
                value={filters.maxPrice === 100000 ? '' : filters.maxPrice}
                onChange={(e) => updateFilters({ maxPrice: Number(e.target.value) || 100000 })}
                className="text-sm"
              />
            </div>
            <div className="text-xs text-slate-500">
              範囲: ¥{availableOptions.priceRange.min.toLocaleString()} - ¥{availableOptions.priceRange.max.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* 評価 */}
      <div className="space-y-2">
        <SectionHeader id="rating" title="評価" icon={Star} />
        {expandedSections.includes('rating') && (
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === rating}
                  onChange={() => updateFilters({ minRating: rating })}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} 
                    />
                  ))}
                  <span className="text-sm text-slate-700">以上</span>
                </div>
              </label>
            ))}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === 0}
                onChange={() => updateFilters({ minRating: 0 })}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">指定なし</span>
            </label>
          </div>
        )}
      </div>

      {/* 並び順 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">並び順</h4>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
          className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="rating">評価の高い順</option>
          <option value="price_asc">料金の安い順</option>
          <option value="price_desc">料金の高い順</option>
          <option value="experience">経験年数順</option>
          <option value="newest">新着順</option>
        </select>
      </div>
    </div>
  );
};