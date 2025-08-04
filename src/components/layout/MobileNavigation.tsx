import React from 'react';
import { Home, Users, Calendar, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface MobileNavigationProps {
  currentPath?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentPath = '/' }) => {
  const { isAuthenticated } = useAuth();

  const navigationItems = [
    {
      path: '/',
      icon: Home,
      label: 'ホーム',
      isActive: currentPath === '/'
    },
    {
      path: '/counselors',
      icon: Users,
      label: 'カウンセラー',
      isActive: currentPath.startsWith('/counselors')
    },
    {
      path: isAuthenticated ? '/dashboard' : '/counselors',
      icon: isAuthenticated ? Calendar : MessageCircle,
      label: isAuthenticated ? 'マイページ' : '無料相談',
      isActive: currentPath === '/dashboard'
    },
    {
      path: '/counselors?mode=chat',
      icon: MessageCircle,
      label: 'チャット',
      isActive: currentPath.includes('chat')
    },
    {
      path: isAuthenticated ? '/profile' : '/counselors',
      icon: User,
      label: isAuthenticated ? 'プロフィール' : 'ログイン',
      isActive: currentPath === '/profile'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-40 lg:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => window.location.href = item.path}
              className={`
                flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all duration-200
                ${item.isActive 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${item.isActive ? 'text-indigo-600' : ''}`} />
              <span className={`text-xs font-medium ${item.isActive ? 'text-indigo-600' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};