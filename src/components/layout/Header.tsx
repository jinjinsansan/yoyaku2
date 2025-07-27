import React, { useState, useEffect } from 'react';
import { Heart, Menu, User, LogOut, MessageCircle, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface HeaderProps {
  onAuthClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick }) => {
  const { user, signOut, isAuthenticated } = useAuth();
  const [isCounselor, setIsCounselor] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80); // デフォルト80px (h-20)

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

  // スクロール検知
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      setShowLogoutConfirm(true);
    } else {
      onAuthClick?.();
    }
  };

  const handleLogoutConfirm = async () => {
    await signOut();
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // ヘッダーの高さを動的に計算
  useEffect(() => {
    const headerElement = document.querySelector('header');
    if (headerElement) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeaderHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(headerElement);
      return () => resizeObserver.disconnect();
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <header className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-2xl border-b border-gray-200/50' 
          : 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-100'
        }
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 美しいロゴ */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  <div>一般社団法人</div>
                  <div>NAMIDAサポート協会</div>
                </h1>
              </div>
            </div>

            {/* 美しいデスクトップナビゲーション */}
            <nav className="hidden lg:flex items-center space-x-1">
              <button 
                onClick={() => window.location.href = '/'}
                className="px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300 transform hover:scale-105"
              >
                ホーム
              </button>
              <button 
                onClick={() => window.location.href = '/counselors'}
                className="px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300 transform hover:scale-105"
              >
                カウンセラー
              </button>
              {isAuthenticated && (
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300 transform hover:scale-105"
                >
                  マイページ
                </button>
              )}
              <button 
                onClick={() => {/* 料金セクションにスクロール */}}
                className="px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300 transform hover:scale-105"
              >
                料金
              </button>
              <button 
                onClick={() => window.open('https://c14fioph.autosns.app/line', '_blank')}
                className="px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300 transform hover:scale-105"
              >
                お問い合わせ
              </button>
            </nav>

            {/* 美しいユーザーアクション */}
            <div className="flex items-center space-x-2">
              {/* カウンセラーダッシュボードボタン */}
              {isAuthenticated && user && isCounselor === true && (
                <button
                  onClick={() => window.location.href = '/counselor-dashboard'}
                  className="hidden md:flex items-center px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  カウンセラー
                </button>
              )}
              
              {/* マスター管理画面ボタン */}
              {isAuthenticated && user && user.email === 'goldbenchan@gmail.com' && (
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="hidden md:flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  管理画面
                </button>
              )}

              {/* ログイン/ログアウトボタン */}
              <button 
                onClick={handleAuthAction}
                className="hidden md:flex items-center px-3 py-2 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300 transform hover:scale-105"
              >
                {isAuthenticated ? (
                  <>
                    <LogOut className="w-4 h-4 mr-1" />
                    ログアウト
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-1" />
                    ログイン
                  </>
                )}
              </button>

              {/* 美しいCTAボタン */}
              <button 
                className="hidden md:flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:from-purple-700 hover:to-indigo-700"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                無料相談
              </button>
              
              {/* 美しいモバイルメニューボタン */}
              <button
                onClick={handleMobileMenuToggle}
                className="lg:hidden p-3 text-gray-700 hover:text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
          
          {/* 美しいユーザー情報表示 */}
          {isAuthenticated && user && (
            <div className="border-t border-gray-200/50 px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50">
              <p className="text-sm text-gray-700 font-medium">
                ようこそ、<span className="text-purple-600 font-bold">{user.user_metadata?.name || user.email}</span>さん
              </p>
            </div>
          )}
        </div>
      </header>

      {/* 美しいモバイルメニュー */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeMobileMenu}>
          <div className="fixed top-20 left-0 right-0 bg-white shadow-2xl border-b border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-6 space-y-4">
              {/* モバイルナビゲーションリンク */}
              <button 
                onClick={() => { window.location.href = '/'; closeMobileMenu(); }}
                className="w-full text-left px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300"
              >
                ホーム
              </button>
              <button 
                onClick={() => { window.location.href = '/counselors'; closeMobileMenu(); }}
                className="w-full text-left px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300"
              >
                カウンセラー
              </button>
              {isAuthenticated && (
                <button 
                  onClick={() => { window.location.href = '/dashboard'; closeMobileMenu(); }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300"
                >
                  マイページ
                </button>
              )}
              {isAuthenticated && user && isCounselor === true && (
                <button
                  onClick={() => { window.location.href = '/counselor-dashboard'; closeMobileMenu(); }}
                  className="w-full text-left px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg"
                >
                  カウンセラーダッシュボード
                </button>
              )}
              {isAuthenticated && user && user.email === 'goldbenchan@gmail.com' && (
                <button
                  onClick={() => { window.location.href = '/admin'; closeMobileMenu(); }}
                  className="w-full text-left px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg"
                >
                  マスター管理画面
                </button>
              )}
              <button 
                onClick={() => { /* 料金セクションにスクロール */ closeMobileMenu(); }}
                className="w-full text-left px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300"
              >
                料金
              </button>
              <button 
                onClick={() => { window.open('https://c14fioph.autosns.app/line', '_blank'); closeMobileMenu(); }}
                className="w-full text-left px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300"
              >
                お問い合わせ
              </button>

              {/* モバイルアクションボタン */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button 
                  onClick={() => { handleAuthAction(); closeMobileMenu(); }}
                  className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300"
                >
                  {isAuthenticated ? (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      ログアウト
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      ログイン
                    </>
                  )}
                </button>
                <button 
                  className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  無料相談を始める
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダーの高さ分のスペーサー */}
      <div style={{ height: `${headerHeight}px` }}></div>

      {/* ログアウト確認ダイアログ */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="ログアウトの確認"
        message="本当にログアウトしますか？"
        confirmText="ログアウト"
        cancelText="キャンセル"
        type="confirm"
      />
    </>
  );
};