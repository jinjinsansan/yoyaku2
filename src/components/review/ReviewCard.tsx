import React, { useState } from 'react';
import { Star, User, ThumbsUp, ThumbsDown, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Review } from '../../types';
import { formatDate } from '../../lib/utils';

interface ReviewCardProps {
  review: Review;
  showFullReview?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, showFullReview = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-slate-300'
        }`}
      />
    ));
  };

  const getRatingText = (rating: number) => {
    const texts = {
      5: '非常に満足',
      4: '満足',
      3: '普通',
      2: '不満',
      1: '非常に不満'
    };
    return texts[rating as keyof typeof texts] || '';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const shouldShowExpand = review.comment.length > 200;
  const displayComment = !isExpanded && shouldShowExpand 
    ? review.comment.substring(0, 200) + '...'
    : review.comment;

  return (
    <Card className="space-y-4 hover:shadow-md transition-shadow">
      {/* ユーザー情報と評価 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center">
            {review.user.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-indigo-600" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">
              {review.user.name}
            </h4>
            <p className="text-sm text-slate-500">
              {formatDate(review.createdAt)}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getRatingColor(review.rating)}>
                {getRatingText(review.rating)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-1 mb-1">
            {renderStars(review.rating)}
          </div>
          <span className="text-sm font-medium text-slate-600">
            {review.rating}.0
          </span>
        </div>
      </div>

      {/* レビューコメント */}
      <div className="prose prose-slate max-w-none">
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
          {displayComment}
        </p>
        
        {shouldShowExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 p-0 h-auto font-normal text-indigo-600 hover:text-indigo-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                折りたたむ
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                続きを読む
              </>
            )}
          </Button>
        )}
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-4">
          {/* 役に立ったボタン */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setHelpful(helpful === true ? null : true)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-colors ${
                helpful === true
                  ? 'bg-green-100 text-green-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>役に立った</span>
              <span className="text-xs">(12)</span>
            </button>
            <button
              onClick={() => setHelpful(helpful === false ? null : false)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-colors ${
                helpful === false
                  ? 'bg-red-100 text-red-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>役に立たなかった</span>
              <span className="text-xs">(2)</span>
            </button>
          </div>
        </div>

        {/* セッション情報 */}
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <MessageCircle className="w-4 h-4" />
          <span>カウンセリング利用</span>
        </div>
      </div>
    </Card>
  );
};