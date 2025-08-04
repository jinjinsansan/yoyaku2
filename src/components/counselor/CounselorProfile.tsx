import React, { useState } from 'react';
import { Star, Clock, Users, ExternalLink, Award, Globe, Video, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Counselor } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useFavorites } from '../../hooks/useFavorites';

interface CounselorProfileProps {
  counselor: Counselor;
  showFullProfile?: boolean;
}

export const CounselorProfile: React.FC<CounselorProfileProps> = ({
  counselor,
  showFullProfile = false
}) => {
  const [showVideo, setShowVideo] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleFavoriteClick = async () => {
    await toggleFavorite(counselor.id);
  };

  const getSessionTypeText = () => {
    switch (counselor.sessionType) {
      case 'online':
        return 'オンライン専門';
      case 'in_person':
        return '対面専門';
      case 'both':
        return 'オンライン・対面両対応';
      default:
        return '';
    }
  };

  const getAvailabilityText = () => {
    switch (counselor.availabilityStatus) {
      case 'available':
        return '予約受付中';
      case 'busy':
        return '多忙';
      case 'unavailable':
        return '予約停止中';
      default:
        return '';
    }
  };

  const getAvailabilityColor = () => {
    switch (counselor.availabilityStatus) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'busy':
        return 'text-yellow-600 bg-yellow-50';
      case 'unavailable':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* メインプロフィール */}
      <Card className="relative">
        {/* お気に入りボタン */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart 
            className={`w-5 h-5 ${
              isFavorite(counselor.id) 
                ? 'text-red-500 fill-current' 
                : 'text-slate-400 hover:text-red-400'
            }`} 
          />
        </button>

        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
            {counselor.profileImage ? (
              <img 
                src={counselor.profileImage} 
                alt={counselor.user?.name || 'カウンセラー'}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <Users className="w-12 h-12 text-indigo-600" />
            )}
            {/* 空き状況インジケーター */}
            <div className={`absolute -bottom-1 -right-1 px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor()}`}>
              {getAvailabilityText()}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {counselor.user?.name || 'カウンセラー'}
            </h1>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-lg font-semibold text-slate-700 ml-1">
                  {counselor.rating.toFixed(1)}
                </span>
                <span className="text-slate-500 ml-1">
                  ({counselor.reviewCount}件のレビュー)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center text-slate-600">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-lg font-medium">
                  {formatCurrency(counselor.hourlyRate)}/時間
                </span>
              </div>
              
              <div className="flex items-center text-slate-600">
                <Award className="w-4 h-4 mr-1" />
                <span>{counselor.experienceYears}年の経験</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="info">{counselor.region}</Badge>
              <Badge variant="success">{getSessionTypeText()}</Badge>
              {counselor.introductionVideoUrl && (
                <Badge variant="primary" className="cursor-pointer" onClick={() => setShowVideo(true)}>
                  <Video className="w-3 h-3 mr-1" />
                  動画あり
                </Badge>
              )}
            </div>

            {counselor.profileUrl && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(counselor.profileUrl, '_blank')}
                className="mb-4"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                プロフィールサイト
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 自己紹介動画 */}
      {showVideo && counselor.introductionVideoUrl && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <Video className="w-5 h-5 mr-2" />
              自己紹介動画
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVideo(false)}
            >
              閉じる
            </Button>
          </div>
          <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
            <video
              src={counselor.introductionVideoUrl}
              controls
              className="w-full h-full object-cover"
              poster={counselor.profileImage}
            >
              お使いのブラウザは動画の再生に対応していません。
            </video>
          </div>
        </Card>
      )}

      {/* 専門分野 */}
      <Card>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">専門分野</h2>
        <div className="flex flex-wrap gap-2">
          {counselor.specialties.map((specialty, index) => (
            <Badge key={index} variant="info">
              {specialty}
            </Badge>
          ))}
        </div>
      </Card>

      {/* 資格・経歴 */}
      {counselor.credentials && counselor.credentials.length > 0 && (
        <Card>
          <button
            onClick={() => toggleSection('credentials')}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              資格・経歴
            </h2>
            {expandedSection === 'credentials' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {expandedSection === 'credentials' && (
            <div className="mt-4 space-y-3">
              {counselor.credentials.map((credential, index) => (
                <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Award className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-green-800 font-medium">{credential}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 対応言語 */}
      {counselor.languages && counselor.languages.length > 1 && (
        <Card>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            対応言語
          </h2>
          <div className="flex flex-wrap gap-2">
            {counselor.languages.map((language, index) => (
              <Badge key={index} variant="secondary">
                {language}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* 自己紹介 */}
      <Card>
        <button
          onClick={() => toggleSection('bio')}
          className="flex items-center justify-between w-full text-left mb-4"
        >
          <h2 className="text-xl font-semibold text-slate-800">自己紹介</h2>
          {showFullProfile && (
            expandedSection === 'bio' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )
          )}
        </button>

        <div className={`prose prose-slate max-w-none ${
          showFullProfile && expandedSection !== 'bio' ? 'line-clamp-3' : ''
        }`}>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">
            {counselor.bio}
          </p>
        </div>

        {showFullProfile && expandedSection !== 'bio' && counselor.bio.length > 200 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('bio')}
            className="mt-2"
          >
            続きを読む
          </Button>
        )}
      </Card>

      {/* 基本情報サマリー */}
      <Card className="bg-slate-50 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">基本情報</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">料金</span>
            <span className="font-medium">{formatCurrency(counselor.hourlyRate)}/時間</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">評価</span>
            <span className="font-medium">{counselor.rating.toFixed(1)}/5.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">レビュー数</span>
            <span className="font-medium">{counselor.reviewCount}件</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">経験年数</span>
            <span className="font-medium">{counselor.experienceYears}年</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">専門分野数</span>
            <span className="font-medium">{counselor.specialties.length}分野</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">セッション形式</span>
            <span className="font-medium">{getSessionTypeText()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};