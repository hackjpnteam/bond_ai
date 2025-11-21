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

        {/* Badge System Details */}
        <section className="mb-16">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 border border-purple-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">🏆 獲得バッジシステム</h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                活動に応じて様々なバッジを獲得し、あなたの実績を可視化しましょう
              </p>
              
              {/* バッジシステムの詳細説明 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 text-left">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-sm mb-2 text-purple-700">🎯 獲得条件</h4>
                  <p className="text-xs text-gray-600">
                    各バッジには明確な獲得条件が設定されており、透明性を保ちながら公正な評価を行います。
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-sm mb-2 text-blue-700">⭐ レア度システム</h4>
                  <p className="text-xs text-gray-600">
                    ★1つ（簡単）から★5つ（極めて困難）まで、5段階のレア度でバッジの価値を表します。
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-sm mb-2 text-green-700">📈 進捗追跡</h4>
                  <p className="text-xs text-gray-600">
                    各バッジの獲得進捗をリアルタイムで確認でき、次の目標を明確に設定できます。
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Badge 1 */}
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <h4 className="font-bold text-sm text-center mb-1">評価王</h4>
                <p className="text-xs text-gray-600 text-center mb-2">
                  10社以上の企業を評価
                </p>
                <div className="text-center mb-2">
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                    ★★★
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  <strong>獲得条件:</strong> 異なる企業10社に対して評価を投稿する<br/>
                  <strong>報酬:</strong> 信頼スコア +0.2、専用アイコン
                </div>
              </div>

              {/* Badge 2 */}
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-sm text-center mb-1">ネットワーカー</h4>
                <p className="text-xs text-gray-600 text-center mb-2">
                  50人以上と繋がる
                </p>
                <div className="text-center mb-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                    ★★★★
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  <strong>獲得条件:</strong> 50人以上のユーザーと相互接続を確立<br/>
                  <strong>報酬:</strong> ネットワーク表示順位向上、限定機能解放
                </div>
              </div>

              {/* Badge 3 */}
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-sm text-center mb-1">早期発見者</h4>
                <p className="text-xs text-gray-600 text-center mb-2">
                  成長企業を早期評価
                </p>
                <div className="text-center mb-2">
                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                    ★★★★★
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  <strong>獲得条件:</strong> 登録後1年以内の企業を3社以上評価し、その後評価が20%以上向上<br/>
                  <strong>報酬:</strong> 早期発見者ランキング参加権、特別表彰
                </div>
              </div>

              {/* Badge 4 */}
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-sm text-center mb-1">信頼マスター</h4>
                <p className="text-xs text-gray-600 text-center mb-2">
                  信頼スコア4.5以上
                </p>
                <div className="text-center mb-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                    ★★★★★
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  <strong>獲得条件:</strong> 3ヶ月間継続して信頼スコア4.5以上を維持<br/>
                  <strong>報酬:</strong> プレミアム機能アクセス、信頼マスター称号
                </div>
              </div>

              {/* Badge 5 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow space-y-4">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-7 h-7 text-orange-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-amber-500 uppercase tracking-wide font-semibold">
                    評価コミュニティ
                  </p>
                  <h4 className="font-bold text-lg text-gray-900">レビュアー</h4>
                  <p className="text-sm text-gray-600">
                    詳細レビューを継続して投稿するアクティブユーザー
                  </p>
                </div>
                <div className="text-center">
                  <Badge className="bg-orange-50 text-orange-700 border-none text-sm px-4 py-2 rounded-full">
                    ★★ 評価スペシャリスト
                  </Badge>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-900 space-y-3 text-left">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎯</span>獲得条件
                    </p>
                    <p>100文字以上の詳細レビューを25件投稿</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎁</span>報酬
                    </p>
                    <p>レビュー優先表示とコミュニティ内での発言力向上</p>
                  </div>
                </div>
              </div>

              {/* Badge 6 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow space-y-4">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-7 h-7 text-red-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-red-500 uppercase tracking-wide font-semibold">
                    データの正確性
                  </p>
                  <h4 className="font-bold text-lg text-gray-900">精度エキスパート</h4>
                  <p className="text-sm text-gray-600">
                    過去の評価が実際の企業成長と一致しているメンバー
                  </p>
                </div>
                <div className="text-center">
                  <Badge className="bg-red-50 text-red-700 border-none text-sm px-4 py-2 rounded-full">
                    ★★★★ 分析プロフェッショナル
                  </Badge>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-sm text-red-900 space-y-3 text-left">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎯</span>獲得条件
                    </p>
                    <p>評価精度90%以上（50社以上評価済み）</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎁</span>報酬
                    </p>
                    <p>評価専門家認定 / 投資家向け特別レポートアクセス</p>
                  </div>
                </div>
              </div>

              {/* Badge 7 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow space-y-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                  <Rocket className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-indigo-500 uppercase tracking-wide font-semibold">
                    スタートアップ支援
                  </p>
                  <h4 className="font-bold text-lg text-gray-900">スタートアップ支援者</h4>
                  <p className="text-sm text-gray-600">
                    新規企業の評価に積極的に参加し、応援を可視化
                  </p>
                </div>
                <div className="text-center">
                  <Badge className="bg-indigo-50 text-indigo-700 border-none text-sm px-4 py-2 rounded-full">
                    ★★★ 支援コミュニティ
                  </Badge>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-900 space-y-3 text-left">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎯</span>獲得条件
                    </p>
                    <p>設立1年未満の企業5社に初回評価を投稿</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎁</span>報酬
                    </p>
                    <p>新規紹介の優先通知 / 支援者コミュニティへの招待</p>
                  </div>
                </div>
              </div>

              {/* Badge 8 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow space-y-4">
                <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-7 h-7 text-pink-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-pink-500 uppercase tracking-wide font-semibold">
                    コミュニティ貢献
                  </p>
                  <h4 className="font-bold text-lg text-gray-900">応援団長</h4>
                  <p className="text-sm text-gray-600">
                    レビューがコミュニティに支持される人気メンバー
                  </p>
                </div>
                <div className="text-center">
                  <Badge className="bg-pink-50 text-pink-700 border-none text-sm px-4 py-2 rounded-full">
                    ★★ コミュニティリーダー
                  </Badge>
                </div>
                <div className="bg-pink-50 rounded-xl p-4 text-sm text-pink-900 space-y-3 text-left">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎯</span>獲得条件
                    </p>
                    <p>投稿したレビューが累計100いいねを獲得</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎁</span>報酬
                    </p>
                    <p>コミュニティ内での影響力向上 / 応援団バッジ表示</p>
                  </div>
                </div>
              </div>

              {/* Badge 9 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow space-y-4">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-7 h-7 text-teal-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-teal-500 uppercase tracking-wide font-semibold">
                    継続的な貢献
                  </p>
                  <h4 className="font-bold text-lg text-gray-900">ベテラン</h4>
                  <p className="text-sm text-gray-600">
                    長期利用と定期活動を続けている安定メンバー
                  </p>
                </div>
                <div className="text-center">
                  <Badge className="bg-teal-50 text-teal-700 border-none text-sm px-4 py-2 rounded-full">
                    ★★★ コミュニティ支柱
                  </Badge>
                </div>
                <div className="bg-teal-50 rounded-xl p-4 text-sm text-teal-900 space-y-3 text-left">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎯</span>獲得条件
                    </p>
                    <p>利用歴1年以上＋月1回以上の活動を継続</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎁</span>報酬
                    </p>
                    <p>ベテラン限定機能 / 新機能ベータテスト参加権</p>
                  </div>
                </div>
              </div>

              {/* Badge 10 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow space-y-4">
                <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto">
                  <Eye className="w-7 h-7 text-cyan-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-cyan-500 uppercase tracking-wide font-semibold">
                    最新動向ウォッチ
                  </p>
                  <h4 className="font-bold text-lg text-gray-900">トレンドウォッチャー</h4>
                  <p className="text-sm text-gray-600">
                    日常的に Bond をチェックし、トレンドをいち早くキャッチするユーザー
                  </p>
                </div>
                <div className="text-center">
                  <Badge className="bg-cyan-50 text-cyan-700 border-none text-sm px-4 py-2 rounded-full">
                    ★ トレンドフォロワー
                  </Badge>
                </div>
                <div className="bg-cyan-50 rounded-xl p-4 text-sm text-cyan-900 space-y-3 text-left">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎯</span>獲得条件
                    </p>
                    <p>7日間連続でプラットフォームにアクセスし、5分以上滞在</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="text-lg">🎁</span>報酬
                    </p>
                    <p>日常活動ボーナス / トレンドアラートの優先配信</p>
                  </div>
                </div>
              </div>

              {/* Badge 11 */}
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="font-bold text-sm text-center mb-1">インフルエンサー</h4>
                <p className="text-xs text-gray-600 text-center mb-2">
                  フォロワー500人以上
                </p>
                <div className="text-center mb-2">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                    ★★★★
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  <strong>獲得条件:</strong> 500人以上のユーザーからフォローされる<br/>
                  <strong>報酬:</strong> インフルエンサー限定イベント招待、特別収益化オプション
                </div>
              </div>

              {/* Badge 12 */}
              <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-yellow-700" />
                </div>
                <h4 className="font-bold text-sm text-center mb-1">レジェンド</h4>
                <p className="text-xs text-gray-600 text-center mb-2">
                  全実績の80%達成
                </p>
                <div className="text-center mb-2">
                  <Badge className="bg-gradient-to-r from-yellow-200 to-yellow-400 text-yellow-900 border-0 text-xs">
                    ★★★★★
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  <strong>獲得条件:</strong> 利用可能な全バッジの80%以上を獲得<br/>
                  <strong>報酬:</strong> レジェンド称号、年次表彰式招待、プラットフォーム運営への意見提供権
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                <h3 className="font-bold text-lg mb-3">バッジ獲得のメリット</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">信頼性の向上</h4>
                    <p className="text-gray-600">バッジは他のユーザーからの信頼を得る重要な指標となります</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">限定機能の解放</h4>
                    <p className="text-gray-600">特定のバッジ獲得により、プレミアム機能にアクセスできます</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 mb-2">コミュニティでの地位</h4>
                    <p className="text-gray-600">バッジはコミュニティ内での専門性と経験を示します</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                今すぐアカウントを作成して、最初のバッジ獲得を目指しましょう！
              </p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                マイページで進捗を確認する
                <ArrowRight className="w-4 h-4" />
              </Link>
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
