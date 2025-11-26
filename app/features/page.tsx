'use client'

import { Users, TrendingUp, Building2, Zap, Network, Star, Trophy, Medal, Award, ArrowRight, MessageCircle, Target, Rocket, Heart, Shield, Eye, Sparkles, Crown, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="container-narrow mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            ホームに戻る
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Bond の機能
          </h1>
          <p className="text-gray-600">
            革新的な信頼ネットワークプラットフォームの全機能をご紹介
          </p>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-12">
        {/* Core Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">主要機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-ash-teal to-ash-mint rounded-xl flex items-center justify-center mb-4">
                <Network className="w-6 h-6 text-ash-text" />
              </div>
              <h3 className="text-lg font-bold mb-3">信頼ネットワーク</h3>
              <p className="text-gray-600">
                検証済みの関係性により構築される透明性の高い信頼スコアシステム
              </p>
            </div>

            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-ash-pink to-ash-peach rounded-xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-ash-text" />
              </div>
              <h3 className="text-lg font-bold mb-3">評価システム</h3>
              <p className="text-gray-600">
                透明性の高い評価システムで企業の信頼度を可視化
              </p>
            </div>

            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-ash-mint to-ash-teal rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-ash-text" />
              </div>
              <h3 className="text-lg font-bold mb-3">リアルタイム分析</h3>
              <p className="text-gray-600">
                市場動向とネットワーク状況をリアルタイムで分析・可視化
              </p>
            </div>

            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-ash-yellow to-ash-peach rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-ash-text" />
              </div>
              <h3 className="text-lg font-bold mb-3">企業成長支援</h3>
              <p className="text-gray-600">
                段階的な成長プランと専門家によるメンタリング
              </p>
            </div>

            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-ash-lilac to-ash-pink rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-ash-text" />
              </div>
              <h3 className="text-lg font-bold mb-3">コミュニティ</h3>
              <p className="text-gray-600">
                グローバルなスタートアップコミュニティへのアクセス
              </p>
            </div>

            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-ash-teal to-ash-lilac rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-ash-text" />
              </div>
              <h3 className="text-lg font-bold mb-3">成果追跡</h3>
              <p className="text-gray-600">
                詳細な分析とレポートによる投資効果の可視化
              </p>
            </div>
          </div>
        </section>

        {/* Badge System - Simple Design */}
        <section id="badges" className="mb-16 scroll-mt-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">バッジシステム</h2>
            <p className="text-gray-600">
              活動に応じてバッジを獲得できます
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Badge 1 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">評価王</h4>
                  <p className="text-sm text-gray-600">評価を10件以上投稿</p>
                </div>
              </div>
            </div>

            {/* Badge 2 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">ネットワーカー</h4>
                  <p className="text-sm text-gray-600">10人以上とつながる</p>
                </div>
              </div>
            </div>

            {/* Badge 3 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">早期発見者</h4>
                  <p className="text-sm text-gray-600">新規企業に最初の評価を投稿</p>
                </div>
              </div>
            </div>

            {/* Badge 4 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">信頼マスター</h4>
                  <p className="text-sm text-gray-600">信頼スコア80以上を達成</p>
                </div>
              </div>
            </div>

            {/* Badge 5 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">レビュアー</h4>
                  <p className="text-sm text-gray-600">初めての評価を投稿</p>
                </div>
              </div>
            </div>

            {/* Badge 6 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">精度エキスパート</h4>
                  <p className="text-sm text-gray-600">評価が5回以上参考になった</p>
                </div>
              </div>
            </div>

            {/* Badge 7 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">支援者</h4>
                  <p className="text-sm text-gray-600">スタートアップを3社以上支援</p>
                </div>
              </div>
            </div>

            {/* Badge 8 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-7 h-7 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">応援団長</h4>
                  <p className="text-sm text-gray-600">企業を10社以上お気に入り登録</p>
                </div>
              </div>
            </div>

            {/* Badge 9 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-7 h-7 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">ベテラン</h4>
                  <p className="text-sm text-gray-600">30日以上連続でログイン</p>
                </div>
              </div>
            </div>

            {/* Badge 10 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Eye className="w-7 h-7 text-cyan-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">ウォッチャー</h4>
                  <p className="text-sm text-gray-600">企業を初めてお気に入り登録</p>
                </div>
              </div>
            </div>

            {/* Badge 11 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">インフルエンサー</h4>
                  <p className="text-sm text-gray-600">プロフィールが100回以上閲覧された</p>
                </div>
              </div>
            </div>

            {/* Badge 12 */}
            <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Crown className="w-7 h-7 text-yellow-700" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">レジェンド</h4>
                  <p className="text-sm text-gray-600">全バッジを獲得</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="card p-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">準備はできましたか？</h2>
            <p className="text-gray-600 mb-8">
              Bond の全機能を今すぐ体験してください
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/login" className="btn-dark">
                ログイン
              </Link>
              <Link href="/signup" className="btn-ol">
                新規登録
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
