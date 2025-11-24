'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Trophy, BarChart3, Building2, Star, Info, Mail, User, LogIn, LogOut, Search } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const isLoggedIn = !!user

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const menuItems = [
    { href: '/letter', label: '手紙', icon: Mail },
    { href: '/search', label: '検索', icon: Search },
    { href: '/ranking', label: 'ランキング', icon: Trophy },
    { href: '/timeline', label: 'タイムライン', icon: BarChart3 },
    { href: '/users', label: 'ユーザー', icon: User },
    { href: '/register-company', label: '会社登録', icon: Building2 },
    { href: '/features', label: '機能', icon: Star },
  ]

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={toggleMenu}
        className="p-2 rounded-md text-ash-text hover:bg-ash-surface2/50 transition-colors"
        aria-label="メニューを開く"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* モバイルメニュー */}
      <div
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white/90 backdrop-blur-2xl border-l border-ash-line/30 z-50 transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-ash-text hover:bg-ash-surface2/50 rounded-lg transition-colors"
                onClick={closeMenu}
              >
                <Icon className="w-5 h-5 text-ash-muted" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
          
          {/* 認証ボタン */}
          <div className="pt-4 border-t border-ash-line/30 space-y-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 text-ash-text hover:bg-ash-surface2/50 rounded-lg transition-colors"
                  onClick={closeMenu}
                >
                  <User className="w-5 h-5 text-ash-muted" />
                  <span className="font-medium">マイページ</span>
                </Link>
                <button
                  onClick={() => {
                    logout()
                    closeMenu()
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-ash-text text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                onClick={closeMenu}
              >
                <LogIn className="w-5 h-5" />
                ログイン
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}