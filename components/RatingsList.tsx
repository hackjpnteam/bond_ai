'use client'

import { Rating } from '@/components/Rating'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, MessageCircle, TrendingUp, Briefcase, HelpCircle, User, Heart, Video, Play } from 'lucide-react'
import { useState, useRef } from 'react'

interface RatingData {
  _id: string
  rating: number
  comment?: string
  role: string
  createdAt: string
  videoUrl?: string
  user?: {
    name?: string
    image?: string
  }
}

interface RatingsListProps {
  ratings: RatingData[]
}

export function RatingsList({ ratings }: RatingsListProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const videoRefs = useRef<{[key: string]: HTMLVideoElement}>({})

  const toggleVideo = (ratingId: string) => {
    const video = videoRefs.current[ratingId]
    if (!video) return

    if (playingVideo === ratingId) {
      video.pause()
      setPlayingVideo(null)
    } else {
      // 他の動画を停止
      Object.values(videoRefs.current).forEach(v => {
        if (v !== video) v.pause()
      })
      
      video.play()
      setPlayingVideo(ratingId)
    }
  }

  const handleVideoEnd = (ratingId: string) => {
    setPlayingVideo(null)
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

  if (ratings.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">まだ評価がありません</p>
        <p className="text-sm text-gray-400">最初の評価者になりませんか？</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {ratings.map((rating) => {
        const roleInfo = getRoleInfo(rating.role)
        const RoleIcon = roleInfo.icon
        
        return (
          <div key={rating._id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={rating.user?.image} alt={rating.user?.name || 'User'} />
                <AvatarFallback>
                  {rating.user?.name ? rating.user.name.charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h4 className="font-semibold text-gray-900">
                    {rating.user?.name || '匿名ユーザー'}
                  </h4>
                  <Badge className={`text-xs ${roleInfo.color} border-0`}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleInfo.label}
                  </Badge>
                  <Rating value={rating.rating} readonly size="sm" />
                  <span className="text-sm text-gray-500">
                    {new Date(rating.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              
                {/* 動画レビュー */}
                {rating.videoUrl && (
                  <div className="mt-4 mb-4">
                    <div className="relative rounded-lg overflow-hidden bg-black max-w-md">
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current[rating._id] = el
                        }}
                        src={rating.videoUrl}
                        className="w-full h-48 object-cover"
                        onEnded={() => handleVideoEnd(rating._id)}
                        onClick={() => toggleVideo(rating._id)}
                      />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => toggleVideo(rating._id)}
                          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                        >
                          {playingVideo === rating._id ? (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <div className="w-1.5 h-4 bg-white mr-1"></div>
                              <div className="w-1.5 h-4 bg-white"></div>
                            </div>
                          ) : (
                            <Play className="w-6 h-6 ml-1" />
                          )}
                        </button>
                      </div>

                      <div className="absolute top-2 left-2">
                        <Badge className="bg-black/50 text-white border-0 text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          動画レビュー
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {rating.comment && (
                  <p className="text-gray-700 leading-relaxed">{rating.comment}</p>
                )}
                
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <span>評価:</span>
                    <span className="font-medium">
                      {rating.rating === 5 && "素晴らしい"}
                      {rating.rating === 4 && "とても良い"}
                      {rating.rating === 3 && "良い"}
                      {rating.rating === 2 && "まあまあ"}
                      {rating.rating === 1 && "改善が必要"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}