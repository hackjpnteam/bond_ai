'use client'

import React from 'react'
import { ExternalLink, Star, Users, MessageCircle, Shield, Sparkles, ArrowRight, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BondProfile {
  id: string
  name: string
  title: string
  company: string
  summary: string
  link?: string
  commonPoint: string
  source: 'Bond Network'
  trustScore: number
  review?: {
    by: string
    comment: string
    rating: number
  }
  connectionPath?: string[]
  relevanceScore?: number
}

interface PublicProfile {
  name: string
  title: string
  company: string
  summary: string
  link: string
  commonPoint: string
  source: 'Public Network'
  platform: 'LinkedIn' | 'Wantedly' | 'X' | 'GitHub' | 'Other'
  confidence: number
  relevanceScore?: number
}

type Profile = BondProfile | PublicProfile

interface ProfileCardProps {
  profile: Profile
  onConnect?: (profile: Profile) => void
  onRequestIntroduction?: (profile: Profile) => void
}

export function ProfileCard({ profile, onConnect, onRequestIntroduction }: ProfileCardProps) {
  const isBondNetwork = profile.source === 'Bond Network'
  
  const getSourceBadge = () => {
    if (isBondNetwork) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Bond Network
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI探索候補
        </Badge>
      )
    }
  }

  const getPlatformIcon = () => {
    if (!isBondNetwork) {
      const publicProfile = profile as PublicProfile
      switch (publicProfile.platform) {
        case 'LinkedIn':
          return '💼'
        case 'Wantedly':
          return '🚀'
        case 'X':
          return '🐦'
        case 'GitHub':
          return '💻'
        default:
          return '🌐'
      }
    }
    return '🤝'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`
      card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
      ${isBondNetwork ? 'border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-white' : 'border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-xl
            ${isBondNetwork ? 'bg-green-100' : 'bg-blue-100'}
          `}>
            {profile.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{profile.name}</h3>
            <p className="text-gray-600 text-sm">{profile.title}</p>
            <p className="text-gray-500 text-xs flex items-center gap-1">
              <span>{getPlatformIcon()}</span>
              {profile.company}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getSourceBadge()}
          {profile.relevanceScore && (
            <div className="text-xs text-gray-500">
              関連度: {Math.round(profile.relevanceScore * 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Bond Network specific info */}
      {isBondNetwork && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                信頼スコア: {(profile as BondProfile).trustScore}
              </span>
            </div>
            {(profile as BondProfile).connectionPath && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                {(profile as BondProfile).connectionPath!.join(' → ')}
              </div>
            )}
          </div>
          
          {(profile as BondProfile).review && (
            <div className="bg-green-50 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {(profile as BondProfile).review!.by}さんのレビュー
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < (profile as BondProfile).review!.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-green-700">
                "{(profile as BondProfile).review!.comment}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Public Network specific info */}
      {!isBondNetwork && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                AI信頼度: 
                <span className={`ml-1 font-bold ${getConfidenceColor((profile as PublicProfile).confidence)}`}>
                  {Math.round((profile as PublicProfile).confidence * 100)}%
                </span>
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {(profile as PublicProfile).platform}
            </Badge>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          {profile.summary}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">共通点</span>
          </div>
          <p className="text-sm text-purple-700">
            {profile.commonPoint}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isBondNetwork ? (
          <>
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onRequestIntroduction?.(profile)}
            >
              <Users className="w-4 h-4 mr-2" />
              紹介を依頼
            </Button>
            {profile.link && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(profile.link, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onConnect?.(profile)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              接触を試す
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.open(profile.link, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              詳細を見る
            </Button>
          </>
        )}
      </div>

      {/* Network priority indicator */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {isBondNetwork ? '🟢 信頼済みネットワーク' : '🔵 AI探索による候補'}
          </span>
          {isBondNetwork && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              検証済み
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileCard