import React from 'react';
import { Star, Clock, Users, ExternalLink, Heart, MapPin, Video, Award } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Counselor } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useFavorites } from '../../hooks/useFavorites';

interface CounselorCardProps {
  counselor: Counselor;
  onSelect?: (counselor: Counselor) => void;
}

export const CounselorCard: React.FC<CounselorCardProps> = ({ counselor, onSelect }) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(counselor.id);
  };

  const getSessionTypeIcon = () => {
    switch (counselor.sessionType) {
      case 'online':
        return <Video className="w-3 h-3 text-blue-500" />;
      case 'in_person':
        return <MapPin className="w-3 h-3 text-green-500" />;
      case 'both':
        return (
          <div className="flex space-x-1">
            <Video className="w-3 h-3 text-blue-500" />
            <MapPin className="w-3 h-3 text-green-500" />
          </div>
        );
      default:
        return null;
    }
  };

  const getSessionTypeText = () => {
    switch (counselor.sessionType) {
      case 'online':
        return 'オンライン';
      case 'in_person':
        return '対面';
      case 'both':
        return 'オンライン・対面';
      default:
        return '';
    }
  };

  const getAvailabilityColor = () => {
    switch (counselor.availabilityStatus) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'unavailable':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card hover className="h-full relative">
      <div className="flex flex-col h-full">
        {/* お気に入りボタン */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart 
            className={`w-4 h-4 ${
              isFavorite(counselor.id) 
                ? 'text-red-500 fill-current' 
                : 'text-slate-400 hover:text-red-400'
            }`} 
          />
        </button>

        {/* プロフィール画像とヘッダー */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
            {counselor.profileImage ? (
              <img 
                src={counselor.profileImage} 
                alt={counselor.user?.name || 'カウンセラー'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <Users className="w-8 h-8 text-indigo-600" />
            )}
            {/* 空き状況インジケーター */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getAvailabilityColor()} rounded-full border-2 border-white`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 truncate">
              {counselor.user?.name || 'カウンセラー'}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-slate-600 ml-1">
                  {counselor.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-slate-500">
                ({counselor.reviewCount}件)
              </span>
            </div>
            <div className="flex items-center mt-1 text-sm text-slate-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatCurrency(counselor.hourlyRate)}/時間</span>
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="space-y-2 mb-4">
          {/* 地域とセッション形式 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-slate-600">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{counselor.region}</span>
            </div>
            <div className="flex items-center text-slate-600">
              {getSessionTypeIcon()}
              <span className="ml-1 text-xs">{getSessionTypeText()}</span>
            </div>
          </div>

          {/* 経験年数と資格 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-slate-600">
              <Award className="w-3 h-3 mr-1" />
              <span>{counselor.experienceYears}年の経験</span>
            </div>
            {counselor.introductionVideoUrl && (
              <div className="flex items-center text-blue-600">
                <Video className="w-3 h-3 mr-1" />
                <span className="text-xs">動画あり</span>
              </div>
            )}
          </div>
        </div>

        {/* 専門分野 */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {counselor.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="info" size="sm">
                {specialty}
              </Badge>
            ))}
            {counselor.specialties.length > 3 && (
              <Badge variant="default" size="sm">
                +{counselor.specialties.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* 資格表示 */}
        {counselor.credentials && counselor.credentials.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {counselor.credentials.slice(0, 2).map((credential, index) => (
                <Badge key={index} variant="success" size="sm">
                  {credential}
                </Badge>
              ))}
              {counselor.credentials.length > 2 && (
                <Badge variant="default" size="sm">
                  +{counselor.credentials.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 自己紹介 */}
        <div className="flex-1 mb-4">
          <p className="text-sm text-slate-600 line-clamp-3">
            {counselor.bio}
          </p>
        </div>

        {/* アクション */}
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={() => onSelect?.(counselor)}
            className="w-full"
          >
            詳細を見る
          </Button>
          {counselor.profileUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(counselor.profileUrl, '_blank');
              }}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              プロフィールサイト
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};