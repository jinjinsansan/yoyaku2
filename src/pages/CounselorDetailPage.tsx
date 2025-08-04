import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  Users, 
  ExternalLink, 
  Calendar,
  ArrowLeft,
  Loader2,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import { useCounselor } from '../hooks/useCounselor';
import { useSchedules } from '../hooks/useSchedules';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ReviewList } from '../components/review/ReviewList';
import { CounselorSchedule } from '../components/counselor/CounselorSchedule';
import { CounselorProfile } from '../components/counselor/CounselorProfile';
import { formatCurrency } from '../lib/utils';

export const CounselorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'chat' または 'payment'
  const { user, isAuthenticated } = useAuth();
  const { counselor, loading: counselorLoading, error } = useCounselor(id!);
  const { schedules, loading: schedulesLoading } = useSchedules(id);
  const { reviews, loading: reviewsLoading, error: reviewsError } = useReviews(id);

  // 無限ループ防止のため一度だけidを出力
  const didLog = useRef(false);
  useEffect(() => {
    if (!didLog.current) {
        // デバッグログを削除
      didLog.current = true;
    }
  }, [id, schedules]);

  const loading = counselorLoading || schedulesLoading;

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

  if (error || !counselor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            カウンセラーが見つかりません
          </h2>
          <p className="text-slate-600 mb-4">
            {error || '指定されたカウンセラーは存在しないか、現在利用できません。'}
          </p>
          <Button onClick={() => navigate('/counselors')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 戻るボタン */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/counselors')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          カウンセラー一覧に戻る
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メイン情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* プロフィール */}
            <CounselorProfile counselor={counselor} showFullProfile={true} />

            {/* スケジュール - ログイン時のみ表示 */}
            {isAuthenticated && (
              <CounselorSchedule 
                counselorId={counselor.id}
              />
            )}

            {/* レビュー・評価 */}
            <Card>
              <div className="flex items-center space-x-2 mb-6">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  レビュー・評価
                </h2>
              </div>
              <ReviewList
                reviews={reviews}
                loading={reviewsLoading}
                error={reviewsError}
              />
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 予約アクション */}
            <Card>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {mode === 'payment' ? '決済・予約を完了' : 'チャット・予約'}
              </h3>
              <div className="space-y-3">
                {isAuthenticated ? (
                  <>
                    {mode === 'payment' ? (
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        onClick={() => navigate(`/booking/${counselor.id}`)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        決済・予約を完了する
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => navigate(`/booking/${counselor.id}`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        チャット予約をする
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/counselors?mode=${mode || 'chat'}`)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      他のカウンセラーも見る
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-600 mb-3">
                      {mode === 'payment' ? '決済するにはログインが必要です' : 'チャットするにはログインが必要です'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/counselors?mode=${mode || 'chat'}`)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      他のカウンセラーも見る
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* 基本情報 */}
            <Card>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">基本情報</h3>
              <div className="space-y-3 text-sm">
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
                  <span className="text-slate-600">専門分野数</span>
                  <span className="font-medium">{counselor.specialties.length}分野</span>
                </div>
              </div>
            </Card>

            {/* 注意事項 */}
            <Card className="bg-blue-50 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                ご利用前にお読みください
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• 初回相談は無料でご利用いただけます</li>
                <li>• キャンセルは24時間前まで可能です</li>
                <li>• 緊急時は専用ホットラインをご利用ください</li>
                <li>• 全ての相談内容は厳重に管理されます</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};