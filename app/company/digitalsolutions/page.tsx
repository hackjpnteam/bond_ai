'use client'

import React from "react";
import { Star, Users, MapPin, Calendar, Building2, TrendingUp, Award, MessageCircle, ThumbsUp } from "lucide-react";
import { Rating } from "@/components/Rating";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// DigitalSolutionsの評価データ
const companyInfo = {
  name: "DigitalSolutions",
  location: "大阪",
  employees: 40,
  established: "2022年設立",
  description: "デジタル変革を支援するコンサルティング企業",
  industry: "コンサルティング",
  overallRating: 4.5,
  totalRatings: 56,
  grade: "A",
  badges: ["優秀企業"],
  logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center"
};

const evaluations = [
  {
    id: "1",
    userName: "鈴木 経営太郎",
    userRole: "中小企業経営者",
    userAvatar: "https://i.pravatar.cc/150?img=16",
    userType: "従業員",
    rating: 5,
    date: "2024年10月20日",
    title: "DXコンサルティングが素晴らしい",
    comment: "DigitalSolutionsのDXコンサルティングのおかげで、弊社の業務効率が大幅に改善されました。専門的なアドバイスと実践的なソリューションで、デジタル変革を成功に導いてくれました。",
    helpfulCount: 29,
    tags: ["DXコンサルティング", "業務効率", "専門性"]
  },
  {
    id: "2",
    userName: "田中 システム子",
    userRole: "ITマネージャー",
    userAvatar: "https://i.pravatar.cc/150?img=28",
    userType: "顧客",
    rating: 4,
    date: "2024年10月17日",
    title: "実用的なソリューション",
    comment: "理論だけでなく、実際に使える実用的なソリューションを提供してくれます。導入後のサポートも手厚く、安心してデジタル化を進めることができました。",
    helpfulCount: 22,
    tags: ["実用性", "サポート", "デジタル化"]
  },
  {
    id: "3",
    userName: "佐藤 アドバイザー",
    userRole: "ビジネスアドバイザー",
    userAvatar: "https://i.pravatar.cc/150?img=39",
    userType: "アドバイザー",
    rating: 5,
    date: "2024年10月14日",
    title: "戦略的なアプローチ",
    comment: "DigitalSolutionsは単なるシステム導入ではなく、事業戦略に基づいたデジタル変革を提案してくれます。長期的な視点での価値創造に優れていると感じます。",
    helpfulCount: 35,
    tags: ["戦略性", "長期視点", "価値創造"]
  },
  {
    id: "4",
    userName: "山田 DX推進",
    userRole: "DX推進担当",
    userAvatar: "https://i.pravatar.cc/150?img=43",
    userType: "従業員",
    rating: 4,
    date: "2024年10月11日",
    title: "チームワークが抜群",
    comment: "DigitalSolutionsで働いていますが、チームワークが本当に素晴らしいです。お客様のために全員が一丸となって取り組む姿勢があり、やりがいを感じています。",
    helpfulCount: 19,
    tags: ["チームワーク", "やりがい", "顧客第一"]
  },
  {
    id: "5",
    userName: "高橋 製造業",
    userRole: "製造業CTO",
    userAvatar: "https://i.pravatar.cc/150?img=54",
    userType: "顧客",
    rating: 4,
    date: "2024年10月8日",
    title: "製造業のDXに精通",
    comment: "製造業特有の課題を深く理解しており、現場に即したソリューションを提案してくれました。導入後の生産性向上は期待以上の結果でした。",
    helpfulCount: 26,
    tags: ["製造業DX", "現場理解", "生産性向上"]
  }
];

const ratingDistribution = {
  5: 32,
  4: 18,
  3: 5,
  2: 1,
  1: 0
};

const categoryRatings = {
  consulting: 4.6,
  solution: 4.4,
  support: 4.5,
  expertise: 4.7
};

export default function DigitalSolutionsEvaluationPage() {
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
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                    #{3}
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
                    <Badge key={badge} className="bg-purple-100 text-purple-800 border-purple-300">
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
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.consulting}</div>
                  <Rating value={categoryRatings.consulting} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">コンサルティング</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.solution}</div>
                  <Rating value={categoryRatings.solution} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">ソリューション</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.support}</div>
                  <Rating value={categoryRatings.support} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">サポート</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.expertise}</div>
                  <Rating value={categoryRatings.expertise} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">専門性</p>
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
                <Users className="w-4 h-4" />
                従業員
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                顧客
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                アドバイザー
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
              DigitalSolutionsとつながりませんか？
            </h2>
            <p className="text-ash-muted mb-6">
              デジタル変革のプロフェッショナルとの出会いを
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