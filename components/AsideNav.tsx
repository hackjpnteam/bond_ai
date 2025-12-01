'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  BookmarkPlus,
  Network,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Brain,
  Bell,
  Clock,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getNavItems = (username?: string): NavItem[] => [
  { label: 'マイページ', href: '/dashboard', icon: User },
  { label: '検索', href: '/search', icon: Search },
  { label: 'マイリスト', href: '/lists', icon: BookmarkPlus },
  { label: 'メッセージ', href: '/messages', icon: Mail },
  { label: 'タイムライン', href: '/timeline', icon: Clock },
  { label: 'トラストマップ', href: '/trust-map', icon: Network },
  { label: 'AI最適ルート', href: '/referral-routes', icon: Network },
  // { label: 'AI人物探索', href: '/ai-people-search', icon: Brain },
  // { label: '紹介', href: '/introductions', icon: Users },
  // { label: '接続管理', href: '/connections', icon: Users },
  { label: 'ユーザー探索', href: '/users', icon: Users },
  { label: '設定', href: '/settings', icon: Settings },
];

interface AsideNavProps {
  user?: {
    name?: string;
    email?: string;
    username?: string;
    image?: string;
  };
}

export default function AsideNav({ user }: AsideNavProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const pathname = usePathname();
  const { logout } = useAuth();
  const navItems = getNavItems(user?.username);

  const fetchNotificationCount = useCallback(async () => {
    if (!user) {
      setNotificationCount(0);
      return;
    }
    try {
      const response = await fetch('/api/notifications/count', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [user]);

  const fetchUnreadMessageCount = useCallback(async () => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }
    try {
      const response = await fetch('/api/messages/unread-count', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadMessageCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      setUnreadMessageCount(0);
      return;
    }
    
    fetchNotificationCount();
    fetchUnreadMessageCount();
    
    const handleNotificationUpdate = () => fetchNotificationCount();
    const handleMessageUpdate = () => fetchUnreadMessageCount();
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);
    window.addEventListener('messagesUpdated', handleMessageUpdate);
    
    // 30秒ごとに未読数を更新
    const interval = setInterval(() => {
      fetchNotificationCount();
      fetchUnreadMessageCount();
    }, 30000);
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
      window.removeEventListener('messagesUpdated', handleMessageUpdate);
      clearInterval(interval);
    };
  }, [user, fetchNotificationCount, fetchUnreadMessageCount]);

  const NavContent = () => (
    <>
      {/* Spacer for logo */}
      <div className="h-16 flex-shrink-0"></div>

      {/* Scrollable Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* User Profile */}
        {user && (
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-bond-pink to-bond-pinkDark rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={user.image || '/default-avatar.png'}
                  alt={user.name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    // フォールバック: デフォルトアバター画像
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email || 'user@example.com'}
                </p>
              </div>
              <Link href="/notifications" className="relative">
                <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Items - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-bond-cream text-bond-pink'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/messages' && unreadMessageCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="p-4 border-t flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900"
            onClick={() => {
              logout();
              setIsMobileOpen(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>ログアウト</span>
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-white fixed left-0 top-0 h-screen z-40">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center gap-3">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-white shadow-sm"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>ナビゲーション</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full">
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Logo */}
        <div className="flex-1 flex justify-center">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <img 
              src="/bond-logo.png" 
              alt="Bond Logo" 
              width="24" 
              height="24" 
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </>
  );
}
