import React, { useState, useEffect } from 'react';
import { X, User, Heart, CreditCard, HelpCircle, LayoutDashboard, MessageCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const [isCounselor, setIsCounselor] = useState<boolean | null>(null);

  // カウンセラー判定: counselorsテーブルに自分のuser_idが存在するか
  useEffect(() => {
    if (user) {
      (async () => {
        const { data, error } = await supabase.from('counselors').select('id').eq('user_id', user.id).limit(1);
        setIsCounselor(Array.isArray(data) && data.length > 0);
        if (error) {
          console.error('counselors判定APIエラー', error);
        }
      })();
    } else {
      setIsCounselor(false);
    }
  }, [user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">メニュー</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-4">
          <button
            onClick={() => {
              window.location.href = '/';
              onClose();
            }}
            className="flex items-center space-x-3 p-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Heart className="w-5 h-5" />
            <span>ホーム</span>
          </button>
          <button
            onClick={() => {
              window.location.href = '/counselors';
              onClose();
            }}
            className="flex items-center space-x-3 p-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <User className="w-5 h-5" />
            <span>カウンセラー</span>
          </button>
          {isAuthenticated && (
            <button
              onClick={() => {
                window.location.href = '/dashboard';
                onClose();
              }}
              className="flex items-center space-x-3 p-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>マイページ</span>
            </button>
          )}
          {/* カウンセラーのみ表示 */}
          {isAuthenticated && user && isCounselor === true && (
            <button
              onClick={() => {
                window.location.href = '/counselor-dashboard';
                onClose();
              }}
              className="flex items-center space-x-3 p-3 text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors border border-cyan-200"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-semibold">カウンセラーダッシュボード</span>
            </button>
          )}
          <button
            onClick={() => {
              /* 料金セクションにスクロール */
              onClose();
            }}
            className="flex items-center space-x-3 p-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <span>料金</span>
          </button>
          <button
            onClick={() => {
              /* お問い合わせモーダル表示 */
              onClose();
            }}
            className="flex items-center space-x-3 p-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span>お問い合わせ</span>
          </button>
        </nav>

        <div className="p-4 space-y-3 border-t border-slate-200">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              /* 認証モーダル表示 */
              onClose();
            }}
          >
            <User className="w-4 h-4 mr-2" />
            ログイン
          </Button>
          <Button 
            className="w-full"
            onClick={() => {
              window.location.href = '/counselors';
              onClose();
            }}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            カウンセラーを探す
          </Button>
        </div>
      </div>
    </div>
  );
};