'use client'

import React from "react";
import { Star, Users, MapPin, Calendar, Building2, TrendingUp, Award, MessageCircle, ThumbsUp } from "lucide-react";
import { Rating } from "@/components/Rating";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ギグーの評価データ
const companyInfo = {
  name: "ギグー",
  location: "東京",
  employees: 25,
  established: "2023年設立",
  description: "革新的なAI技術で未来を創造するスタートアップ",
  industry: "AI・機械学習",
  overallRating: 4.8,
  totalRatings: 47,
  grade: "A",
  badges: ["最高評価企業"],
  logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=200&fit=crop&crop=center"
};

const evaluations = [
  {
    id: "1",
    userName: "田中 投資郎",
    userRole: "ベンチャーキャピタリスト",
    userAvatar: "https://i.pravatar.cc/150?img=12",
    userType: "投資家",
    rating: 5,
    date: "2024年10月22日",
    title: "技術力と成長性に期待",
    comment: "ギグーのAI技術は非常に革新的で、市場でのポテンシャルが高いと感じています。チームの技術力も素晴らしく、今後の成長が楽しみです。投資判断においても信頼できる企業です。",
    helpfulCount: 18,
    tags: ["技術力", "成長性", "投資価値"]
  },
  {
    id: "2",
    userName: "佐藤 エンジニア",
    userRole: "シニアエンジニア",
    userAvatar: "https://i.pravatar.cc/150?img=25",
    userType: "従業員",
    rating: 5,
    date: "2024年10月20日",
    title: "最高の職場環境",
    comment: "ギグーで働けて本当に良かったです。最新技術に触れながら成長できる環境があり、チームワークも抜群です。経営陣のビジョンも明確で、やりがいを感じています。",
    helpfulCount: 24,
    tags: ["職場環境", "成長機会", "チームワーク"]
  },
  {
    id: "3",
    userName: "鈴木 マーケティング",
    userRole: "マーケティングディレクター",
    userAvatar: "https://i.pravatar.cc/150?img=33",
    userType: "顧客",
    rating: 5,
    date: "2024年10月18日",
    title: "AIソリューションが素晴らしい",
    comment: "ギグーのAIソリューションを導入してから、業務効率が大幅に向上しました。技術サポートも迅速で丁寧で、非常に満足しています。他社とは一線を画す技術力です。",
    helpfulCount: 31,
    tags: ["AIソリューション", "業務効率", "技術サポート"]
  },
  {
    id: "4",
    userName: "高橋 データサイエンティスト",
    userRole: "データサイエンティスト",
    userAvatar: "https://i.pravatar.cc/150?img=41",
    userType: "従業員",
    rating: 4,
    date: "2024年10月15日",
    title: "学習環境が充実",
    comment: "最新のAI技術を学べる環境が整っており、日々スキルアップできています。プロジェクトも挑戦的で、技術者として大きく成長できる会社だと思います。",
    helpfulCount: 16,
    tags: ["学習環境", "スキルアップ", "挑戦的プロジェクト"]
  },
  {
    id: "5",
    userName: "山田 ベンチャー",
    userRole: "エンジェル投資家",
    userAvatar: "https://i.pravatar.cc/150?img=52",
    userType: "投資家",
    rating: 5,
    date: "2024年10月12日",
    title: "将来性抜群のスタートアップ",
    comment: "AI分野での技術力と市場理解度が非常に高く、将来性を強く感じています。経営チームも優秀で、投資先として非常に魅力的な企業です。",
    helpfulCount: 22,
    tags: ["将来性", "技術力", "経営チーム"]
  }
];

const ratingDistribution = {
  5: 38,
  4: 7,
  3: 2,
  2: 0,
  1: 0
};

const categoryRatings = {
  technology: 4.9,
  management: 4.7,
  culture: 4.8,
  growth: 4.8
};

export default function GigooEvaluationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="container-narrow mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← ホームに戻る
            </Link>
          </div>
        </div>
      </div>

      {/* Company Overview */}
      <section className="section">
        <div className="container-narrow mx-auto px-4">
          <div className="card p-8 mb-8">
            <div className="flex items-start gap-6 mb-6">
              <img
                src={companyInfo.logo}
                alt={`${companyInfo.name} logo`}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-ash-text">{companyInfo.name}</h1>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    #{1}
                  </Badge>
                </div>
                <p className="text-ash-muted mb-4">{companyInfo.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-ash-muted" />
                    <span>{companyInfo.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-ash-muted" />
                    <span>{companyInfo.employees}名</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-ash-muted" />
                    <span>{companyInfo.established}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-ash-muted" />
                    <span>{companyInfo.industry}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-ash-line pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-ash-text mb-2">
                  {companyInfo.overallRating}
                </div>
                <Rating value={companyInfo.overallRating} readonly size="lg" className="justify-center mb-2" />
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white border-0">
                    総合評価{companyInfo.grade}
                  </Badge>
                </div>
                <p className="text-ash-muted">
                  {companyInfo.totalRatings}件の評価に基づく
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {companyInfo.badges.map((badge) => (
                    <Badge key={badge} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <Award className="w-3 h-3 mr-1" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">評価の分布</h3>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingDistribution[stars as keyof typeof ratingDistribution];
                  const percentage = (count / companyInfo.totalRatings) * 100;
                  
                  return (
                    <div key={stars} className="flex items-center gap-2 mb-2">
                      <span className="text-sm w-4">{stars}</span>
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-ash-muted w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Ratings */}
            <div className="border-t border-ash-line mt-6 pt-6">
              <h3 className="text-lg font-semibold mb-4">カテゴリ別評価</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.technology}</div>
                  <Rating value={categoryRatings.technology} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">技術力</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.management}</div>
                  <Rating value={categoryRatings.management} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">経営力</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.culture}</div>
                  <Rating value={categoryRatings.culture} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">企業文化</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.growth}</div>
                  <Rating value={categoryRatings.growth} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">成長性</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evaluator Types */}
      <section className="section">
        <div className="container-narrow mx-auto px-4">
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">評価者:</h3>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                投資家
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                従業員
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                顧客
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* User Reviews */}
      <section className="section">
        <div className="container-narrow mx-auto px-4">
          <h2 className="text-2xl font-bold text-ash-text mb-6">ユーザーレビュー</h2>
          
          <div className="space-y-6">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="card p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={evaluation.userAvatar}
                    alt={evaluation.userName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-ash-text">{evaluation.userName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {evaluation.userType}
                          </Badge>
                        </div>
                        <p className="text-sm text-ash-muted">{evaluation.userRole}</p>
                      </div>
                      <div className="text-sm text-ash-muted">{evaluation.date}</div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Rating value={evaluation.rating} readonly size="sm" />
                      <span className="text-sm text-ash-muted">({evaluation.rating}/5)</span>
                    </div>
                    
                    <h5 className="font-medium text-ash-text mb-2">{evaluation.title}</h5>
                    <p className="text-ash-text leading-relaxed mb-3">{evaluation.comment}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {evaluation.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-ash-muted">
                        <button className="flex items-center gap-1 hover:text-ash-text transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span>参考になった ({evaluation.helpfulCount})</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-ash-text transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span>返信</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container-narrow mx-auto px-4 text-center">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-ash-text mb-4">
              ギグーとつながりませんか？
            </h2>
            <p className="text-ash-muted mb-6">
              AI技術で未来を創造する、革新的なスタートアップとの出会いを
            </p>
            <div className="flex items-center justify-center gap-4">
              <button className="btn-dark">
                コンタクトを取る
              </button>
              <Link href="/" className="btn-ol">
                他の企業を見る
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}