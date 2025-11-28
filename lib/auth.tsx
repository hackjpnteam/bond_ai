'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
  company?: string;
  image?: string;
  createdAt?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();

  // Check for existing session on mount and when NextAuth session changes
  useEffect(() => {
    console.log('🔍 [AuthProvider] NextAuth status:', nextAuthStatus);
    console.log('🔍 [AuthProvider] NextAuth session:', nextAuthSession);
    checkAuth();
  }, [nextAuthSession, nextAuthStatus]);

  const checkAuth = async () => {
    try {
      console.log('🔍 [AuthProvider] Checking auth...');

      // 【優先1】NextAuthセッションをチェック
      if (nextAuthStatus === 'authenticated' && nextAuthSession?.user) {
        console.log('✅ [AuthProvider] NextAuth session found:', nextAuthSession.user.email);

        // NextAuthセッションから直接ユーザー情報を取得
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            console.log('✅ [AuthProvider] User data from /api/auth/me:', data.user);
            setUser(data.user);
            setIsLoading(false);
            return;
          }
        }

        // /api/auth/me が失敗した場合は、NextAuthセッションから直接ユーザー情報を使用
        console.log('⚠️ [AuthProvider] Using NextAuth session data directly');
        setUser({
          id: nextAuthSession.user.id || '',
          email: nextAuthSession.user.email || '',
          name: nextAuthSession.user.name || '',
          image: nextAuthSession.user.image || undefined,
          username: nextAuthSession.user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
          role: 'other'
        });
        setIsLoading(false);
        return;
      }

      // 【優先2】カスタムセッションをチェック
      console.log('🔍 [AuthProvider] Checking custom session via /api/auth/me...');
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('✅ [AuthProvider] Custom session found:', data.user.email);
          setUser(data.user);
        } else {
          console.log('ℹ️ [AuthProvider] No user session found');
          setUser(null);
        }
      } else {
        console.log('ℹ️ [AuthProvider] No custom session found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [AuthProvider] Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ログインに失敗しました');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        throw new Error('ログインレスポンスが無効です');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔍 [AuthProvider] Starting logout...');

      // NextAuthのsignOutを呼ぶ（NextAuthセッションをクリア）
      const { signOut } = await import('next-auth/react');
      await signOut({ redirect: false });
      console.log('✅ [AuthProvider] NextAuth session cleared');

      // カスタムセッションもクリア
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('✅ [AuthProvider] Custom session cleared');

    } catch (error) {
      console.error('❌ [AuthProvider] Logout error:', error);
    } finally {
      setUser(null);
      console.log('✅ [AuthProvider] User state cleared, redirecting to home...');
      // Redirect to home page after logout
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}