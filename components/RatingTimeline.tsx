'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Rating } from '@/components/Rating'
import { Users, TrendingUp, Briefcase, HelpCircle, User, Heart, Building2, Clock } from 'lucide-react'
import Link from 'next/link'

interface TimelineRating {
  _id: string
  rating: number
  comment?: string
  role: string
  createdAt: string
  user?: {
    name?: string
    image?: string
  }
  company: {
    _id: string
    name: string
    slug?: string
    logoUrl?: string
  }
}

interface RatingTimelineProps {
  limit?: number
  showHeader?: boolean
}

export function RatingTimeline({ limit = 20, showHeader = true }: RatingTimelineProps) {
  const [ratings, setRatings] = useState<TimelineRating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTimeline()
  }, [limit])

  const fetchTimeline = async () => {
    try {
      setLoading(true)
      
      // デモデータを表示
      const demoData: TimelineRating[] = [
        {
          _id: '1',
          rating: 5,
          comment: '革新的なプロダクトと素晴らしいチーム。将来性が非常に高いと感じます。',
          role: 'Investor',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2時間前
          user: {
            name: '田中 投資郎',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tanaka&backgroundColor=b6e3f4'
          },
          company: {
            _id: 'tech-innovate',
            name: 'ギグー',
            slug: 'tech-innovate',
            logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0idXJsKCNncmFkaWVudDBfbGluZWFyXzFfMSkiLz4KPHBhdGggZD0iTTEwLjEgMjNWOS40SDEzLjhWMTAuNEgxMS4xVjE1LjNIMTMuNFYxNi4zSDExLjFWMjJIMTRWMjNIMTAuMVpNMTguMyAyM1Y5LjRIMjEuMUMyMS44NjY3IDkuNCAyMi40NjY3IDkuNiAyMi45IDEwQzIzLjMzMzMgMTAuNCAyMy41IDEwLjkzMzMgMjMuNSAxMS42QzIzLjUgMTIuMjY2NyAyMy4zMzMzIDEyLjggMjIuOSAxMy4yQzIyLjQ2NjcgMTMuNiAyMS44NjY3IDEzLjggMjEuMSAxMy44SDE5LjNWMjNIMTguM1pNMTkuMyAxMi44SDIxLjFDMjEuNDMzMyAxMi44IDIxLjY2NjcgMTIuNjY2NyAyMS44IDEyLjRDMjEuOTMzMyAxMi4xMzMzIDIyIDExLjkgMjIgMTEuN0MyMiAxMS41IDIxLjkzMzMgMTEuMzMzMyAyMS44IDExLjJDMjEuNjY2NyAxMS4wNjY3IDIxLjQzMzMgMTEgMjEuMSAxMUgxOS4zVjEyLjhaIiBmaWxsPSJ3aGl0ZSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMzIiIHkyPSIzMiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMzM3NUZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzYzNjZGMSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo='
          }
        },
        {
          _id: '2',
          rating: 4,
          comment: '働きやすい環境で成長できました。技術的な挑戦も多く、やりがいがあります。',
          role: 'Employee',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5時間前
          user: {
            name: '佐藤 開発子',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sato&backgroundColor=c0aede'
          },
          company: {
            _id: 'digital-solutions',
            name: 'DigitalSolutions',
            slug: 'digital-solutions',
            logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0idXJsKCNncmFkaWVudDBfbGluZWFyXzJfMikiLz4KPHBhdGggZD0iTTEwLjEgMjNWOS40SDEzLjdDMTQuMzMzMyA5LjQgMTQuODMzMyA5LjU2NjY3IDE1LjIgOS45QzE1LjU2NjcgMTAuMjMzMyAxNS43NSAxMC42MzMzIDE1Ljc1IDExLjFDMTUuNzUgMTEuNTY2NyAxNS41NjY3IDExLjk2NjcgMTUuMiAxMi4zQzE0LjgzMzMgMTIuNjMzMyAxNC4zMzMzIDEyLjggMTMuNyAxMi44SDExLjFWMTQuNEgxNS43NVYxNS40SDExLjFWMjNIMTAuMVpNMTEuMSAxMS44SDEzLjdDMTMuOSAxMS44IDE0IDExLjczMzMgMTQuMSAxMS42QzE0LjIgMTEuNDY2NyAxNC4yNSAxMS4zIDE0LjI1IDExLjFDMTQuMjUgMTAuOSAxNC4yIDEwLjczMzMgMTQuMSAxMC42QzE0IDEwLjQ2NjcgMTMuOSAxMC40IDEzLjcgMTAuNEgxMS4xVjExLjhaIiBmaWxsPSJ3aGl0ZSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzJfMiIgeDE9IjAiIHkxPSIwIiB4Mj0iMzIiIHkyPSIzMiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMTBCOTgxIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzVCQzE4QSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo='
          }
        },
        {
          _id: '3',
          rating: 5,
          comment: '自分が創業した会社ですが、チーム一丸となって頑張っています！',
          role: 'Founder',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1日前
          user: {
            name: '山田 創業',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamada&backgroundColor=d1d4f9'
          },
          company: {
            _id: 'startup-hub',
            name: 'StartupHub',
            slug: 'startup-hub',
            logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0idXJsKCNncmFkaWVudDBfbGluZWFyXzJfMikiLz4KPHBhdGggZD0iTTEwLjEgMjNWOS40SDEzLjdDMTQuMzMzMyA5LjQgMTQuODMzMyA5LjU2NjY3IDE1LjIgOS45QzE1LjU2NjcgMTAuMjMzMyAxNS43NSAxMC42MzMzIDE1Ljc1IDExLjFDMTUuNzUgMTEuNTY2NyAxNS41NjY3IDExLjk2NjcgMTUuMiAxMi4zQzE0LjgzMzMgMTIuNjMzMyAxNC4zMzMzIDEyLjggMTMuNyAxMi44SDExLjFWMTQuNEgxNS43NVYxNS40SDExLjFWMjNIMTAuMVpNMTEuMSAxMS44SDEzLjdDMTMuOSAxMS44IDE0IDExLjczMzMgMTQuMSAxMS42QzE0LjIgMTEuNDY2NyAxNC4yNSAxMS4zIDEyNS4yNSAxMS4xQzE0LjI1IDEwLjkgMTQuMiAxMC43MzMzIDE0LjEgMTAuNkMxNCAxMC40NjY3IDEzLjkgMTAuNCAxMy43IDEwLjRIMTEuMVYxMS44WiIgZmlsbD0id2hpdGUiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQwX2xpbmVhcl8yXzIiIHgxPSIwIiB5MT0iMCIgeDI9IjMyIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1QkMxOEEiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K'
          }
        },
        {
          _id: '4',
          rating: 4,
          comment: 'プロダクトの品質が高く、サポートも充実しています。長く使い続けたいと思います。',
          role: 'Customer',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2日前
          user: {
            name: '鈴木 利用者',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suzuki&backgroundColor=ffd5dc'
          },
          company: {
            _id: 'ai-platform',
            name: 'AI Platform Inc',
            slug: 'ai-platform',
            logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0idXJsKCNncmFkaWVudDBfbGluZWFyXzJfMikiLz4KPHBhdGggZD0iTTEwLjEgMjNWOS40SDEzLjdDMTQuMzMzMyA5LjQgMTQuODMzMyA5LjU2NjY3IDE1LjIgOS45QzE1LjU2NjcgMTAuMjMzMyAxNS43NSAxMC42MzMzIDE1Ljc1IDExLjFDMTUuNzUgMTEuNTY2NyAxNS41NjY3IDExLjk2NjcgMTUuMiAxMi4zQzE0LjgzMzMgMTIuNjMzMyAxNC4zMzMzIDEyLjggMTMuNyAxMi44SDExLjFWMTQuNEgxNS43NVYxNS40SDExLjFWMjNIMTAuMVpNMTEuMSAxMS44SDEzLjdDMTMuOSAxMS44IDE0IDExLjczMzMgMTQuMSAxMS42QzE0LjIgMTEuNDY2NyAxNC4yNSAxMS4zIDEyNS4yNSAxMS4xQzE0LjI1IDEwLjkgMTQuMiAxMC43MzMzIDE0LjEgMTAuNkMxNCAxMC40NjY3IDEzLjkgMTAuNCAxMy43IDEwLjRIMTEuMVYxMS44WiIgZmlsbD0id2hpdGUiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQwX2xpbmVhcl8yXzIiIHgxPSIwIiB5MT0iMCIgeDI9IjMyIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1QkMxOEEiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K'
          }
        },
        {
          _id: '5',
          rating: 3,
          comment: '良いアドバイスを提供できたと思います。今後の成長に期待しています。',
          role: 'Advisor',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3日前
          user: {
            name: '高橋 助言',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=takahashi&backgroundColor=ffdfbf'
          },
          company: {
            _id: 'fintech-solutions',
            name: 'FinTech Solutions',
            slug: 'fintech-solutions',
            logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0idXJsKCNncmFkaWVudDBfbGluZWFyXzJfMikiLz4KPHBhdGggZD0iTTEwLjEgMjNWOS40SDEzLjdDMTQuMzMzMyA5LjQgMTQuODMzMyA5LjU2NjY3IDE1LjIgOS45QzE1LjU2NjcgMTAuMjMzMyAxNS43NSAxMC42MzMzIDE1Ljc1IDExLjFDMTUuNzUgMTEuNTY2NyAxNS41NjY3IDExLjk2NjcgMTUuMiAxMi4zQzE0LjgzMzMgMTIuNjMzMyAxNC4zMzMzIDEyLjggMTMuNyAxMi44SDExLjFWMTQuNEgxNS43NVYxNS40SDExLjFWMjNIMTAuMVpNMTEuMSAxMS44SDEzLjdDMTMuOSAxMS44IDE0IDExLjczMzMgMTQuMSAxMS42QzE0LjIgMTEuNDY2NyAxNC4yNSAxMS4zIDEyNS4yNSAxMS4xQzE0LjI1IDEwLjkgMTQuMiAxMC43MzMzIDE0LjEgMTAuNkMxNCAxMC40NjY3IDEzLjkgMTAuNCAxMy43IDEwLjRIMTEuMVYxMS44WiIgZmlsbD0id2hpdGUiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQwX2xpbmVhcl8yXzIiIHgxPSIwIiB5MT0iMCIgeDI9IjMyIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1QkMxOEEiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K'
          }
        },
        {
          _id: '6',
          rating: 5,
          comment: 'このスタートアップのファンです！応援しています。',
          role: 'Fan',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4日前
          user: {
            name: '伊藤 応援',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ito&backgroundColor=c3f0ca'
          },
          company: {
            _id: 'green-energy',
            name: 'GreenEnergy Co.',
            slug: 'green-energy',
            logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0idXJsKCNncmFkaWVudDBfbGluZWFyXzJfMikiLz4KPHBhdGggZD0iTTEwLjEgMjNWOS40SDEzLjdDMTQuMzMzMyA5LjQgMTQuODMzMyA5LjU2NjY3IDE1LjIgOS45QzE1LjU2NjcgMTAuMjMzMyAxNS43NSAxMC42MzMzIDE1Ljc1IDExLjFDMTUuNzUgMTEuNTY2NyAxNS41NjY3IDExLjk2NjcgMTUuMiAxMi4zQzE0LjgzMzMgMTIuNjMzMyAxNC4zMzMzIDEyLjggMTMuNyAxMi44SDExLjFWMTQuNEgxNS43NVYxNS40SDExLjFWMjNIMTAuMVpNMTEuMSAxMS44SDEzLjdDMTMuOSAxMS44IDE0IDExLjczMzMgMTQuMSAxMS42QzE0LjIgMTEuNDY2NyAxNC4yNSAxMS4zIDEyNS4yNSAxMS4xQzE0LjI1IDEwLjkgMTQuMiAxMC43MzMzIDE0LjEgMTAuNkMxNCAxMC40NjY3IDEzLjkgMTAuNCAxMy43IDEwLjRIMTEuMVYxMS44WiIgZmlsbD0id2hpdGUiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQwX2xpbmVhcl8yXzIiIHgxPSIwIiB5MT0iMCIgeDI9IjMyIiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1QkMxOEEiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K'
          }
        }
      ]
      
      setRatings(demoData.slice(0, limit))
      
      // 実際のAPIも試す（エラーが出ても続行）
      try {
        const res = await fetch(`/api/timeline?limit=${limit}`)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            setRatings(data)
          }
        }
      } catch (apiError) {
        // APIエラーは無視してデモデータを使用
        console.log('API error, using demo data:', apiError)
      }
      
    } catch (error) {
      setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getRoleInfo = (role: string) => {
    const roleMap: Record<string, { label: string; color: string; icon: any }> = {
      'Founder': { label: '創業者', color: 'bg-green-100 text-green-800', icon: TrendingUp },
      'Employee': { label: '従業員', color: 'bg-blue-100 text-blue-800', icon: Briefcase },
      'Investor': { label: '投資家', color: 'bg-purple-100 text-purple-800', icon: TrendingUp },
      'Advisor': { label: 'アドバイザー', color: 'bg-yellow-100 text-yellow-800', icon: HelpCircle },
      'Customer': { label: '顧客', color: 'bg-orange-100 text-orange-800', icon: User },
      'Fan': { label: 'ファン', color: 'bg-pink-100 text-pink-800', icon: Heart },
    }
    return roleMap[role] || { label: role, color: 'bg-gray-100 text-gray-800', icon: Users }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}分前`
    } else if (hours < 24) {
      return `${hours}時間前`
    } else if (days < 7) {
      return `${days}日前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (ratings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">まだ評価がありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">評価タイムライン</h2>
        </div>
      )}

      <div className="space-y-4">
        {ratings.map((rating) => {
          const roleInfo = getRoleInfo(rating.role)
          const RoleIcon = roleInfo.icon

          return (
            <Card key={rating._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={rating.user?.image} alt={rating.user?.name || 'User'} />
                    <AvatarFallback>
                      {rating.user?.name ? rating.user.name.charAt(0).toUpperCase() : <Users className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {rating.user?.name || '匿名ユーザー'}
                      </span>
                      <Badge className={`text-xs ${roleInfo.color} border-0`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                      <span className="text-gray-500">が</span>
                      <Link 
                        href={rating.company.slug ? `/company/${rating.company.slug}` : '#'}
                        className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {rating.company.logoUrl ? (
                          <img 
                            src={rating.company.logoUrl} 
                            alt={rating.company.name}
                            className="w-4 h-4 rounded object-cover"
                          />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                        {rating.company.name}
                      </Link>
                      <span className="text-gray-500">を評価</span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <Rating value={rating.rating} readonly size="sm" />
                      <span className="text-sm text-gray-500">
                        {formatTime(rating.createdAt)}
                      </span>
                    </div>

                    {rating.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed mt-2 bg-gray-50 p-3 rounded-lg">
                        "{rating.comment}"
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {ratings.length >= limit && (
        <div className="text-center pt-4">
          <Link 
            href="/timeline" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            すべての評価を見る →
          </Link>
        </div>
      )}
    </div>
  )
}