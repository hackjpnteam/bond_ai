'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { MobileNav } from '@/components/MobileNav'
import { LogOut, Bell } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import Logo from '@/components/Logo'

export function Navigation() {
  const { user, logout } = useAuth()
  const isLoggedIn = !!user
  const [notificationCount, setNotificationCount] = useState(0)

  const fetchNotificationCount = useCallback(async () => {
    if (!isLoggedIn) {
      setNotificationCount(0)
      return
    }
    try {
      const response = await fetch('/api/notifications/count', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setNotificationCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching notification count:', error)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      setNotificationCount(0)
      return
    }

    fetchNotificationCount()
    const handleNotificationUpdate = () => fetchNotificationCount()
    window.addEventListener('notificationsUpdated', handleNotificationUpdate)

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate)
    }
  }, [fetchNotificationCount, isLoggedIn])

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-2xl border-b border-ash-line/30">
      <div className="container-narrow mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo 
            className="text-ash-text hover:opacity-80 transition-opacity" 
            linkClassName="hover:opacity-80 transition-opacity"
          />
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/ranking" className="text-ash-muted hover:text-ash-text transition-colors font-medium px-2 py-2 rounded-md hover:bg-ash-surface2/50 whitespace-nowrap">
              ランキング
            </Link>
            <Link href="/timeline" className="text-ash-muted hover:text-ash-text transition-colors font-medium px-2 py-2 rounded-md hover:bg-ash-surface2/50 whitespace-nowrap">
              タイムライン
            </Link>
            <Link href="/users" className="text-ash-muted hover:text-ash-text transition-colors font-medium px-2 py-2 rounded-md hover:bg-ash-surface2/50 whitespace-nowrap">
              ユーザー
            </Link>
            <Link href="/register-company" className="text-ash-muted hover:text-ash-text transition-colors font-medium px-2 py-2 rounded-md hover:bg-ash-surface2/50 whitespace-nowrap">
              会社登録
            </Link>
            <Link href="/features" className="text-ash-muted hover:text-ash-text transition-colors font-medium px-2 py-2 rounded-md hover:bg-ash-surface2/50 whitespace-nowrap">
              機能
            </Link>
            {isLoggedIn && (
              <Link href="/dashboard" className="text-ash-muted hover:text-ash-text transition-colors font-medium px-2 py-2 rounded-md hover:bg-ash-surface2/50 whitespace-nowrap">
                マイページ
              </Link>
            )}
            <Link href="/notifications" className="relative">
              <div className="relative p-2 text-ash-muted hover:text-ash-text transition-colors rounded-md hover:bg-ash-surface2/50">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {isLoggedIn ? (notificationCount > 9 ? '9+' : notificationCount || '0') : '!'}
                </span>
              </div>
            </Link>
            {isLoggedIn ? (
              <button 
                onClick={logout}
                className="btn-dark px-4 py-2 flex items-center gap-2 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                サインアウト
              </button>
            ) : (
              <Link href="/login" className="btn-dark px-4 py-2 whitespace-nowrap">
                ログイン
              </Link>
            )}
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </nav>
  )
}
