'use client'

import React from "react";
import { Star, Users, MapPin, Calendar, Building2, TrendingUp, Award, MessageCircle, ThumbsUp } from "lucide-react";
import { Rating } from "@/components/Rating";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// StartupHubの評価データ
const companyInfo = {
  name: "StartupHub",
  location: "東京",
  employees: 15,
  established: "2024年設立",
  description: "スタートアップ支援プラットフォーム",
  industry: "プラットフォーム",
  overallRating: 4.7,
  totalRatings: 34,
  grade: "A",
  badges: ["注目の成長企業"],
  logo: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop&crop=center"
};

const evaluations = [
  {
    id: "1",
    userName: "鈴木 創業太郎",
    userRole: "スタートアップ創業者",
    userAvatar: "https://i.pravatar.cc/150?img=15",
    userType: "創業者",
    rating: 5,
    date: "2024年10月21日",
    title: "創業者にとって最高のプラットフォーム",
    comment: "StartupHubのおかげで投資家とのマッチングがスムーズに進みました。プラットフォームの使いやすさと、質の高いサポートに本当に感謝しています。これからもお世話になります。",
    helpfulCount: 26,
    tags: ["投資家マッチング", "使いやすさ", "サポート"]
  },
  {
    id: "2",
    userName: "田中 投資美",
    userRole: "ベンチャーキャピタリスト",
    userAvatar: "https://i.pravatar.cc/150?img=27",
    userType: "投資家",
    rating: 5,
    date: "2024年10月19日",
    title: "優秀なスタートアップが見つかる",
    comment: "StartupHubを通じて多くの優秀なスタートアップと出会えました。事前のスクリーニングがしっかりしており、投資判断に必要な情報が適切に整理されています。",
    helpfulCount: 19,
    tags: ["スクリーニング", "情報整理", "投資判断"]
  },
  {
    id: "3",
    userName: "佐藤 ファン子",
    userRole: "エンジェル投資家",
    userAvatar: "https://i.pravatar.cc/150?img=38",
    userType: "ファン",
    rating: 4,
    date: "2024年10月17日",
    title: "コミュニティが活発",
    comment: "StartupHubのコミュニティは非常に活発で、情報交換が盛んです。新しいトレンドやビジネスアイデアについて学ぶことができ、投資の参考になっています。",
    helpfulCount: 22,
    tags: ["コミュニティ", "情報交換", "トレンド"]
  },
  {
    id: "4",
    userName: "山田 起業次郎",
    userRole: "起業家",
    userAvatar: "https://i.pravatar.cc/150?img=44",
    userType: "創業者",
    rating: 5,
    date: "2024年10月14日",
    title: "メンタリングが充実",
    comment: "StartupHubのメンタリングプログラムで多くのことを学びました。経験豊富なメンターの方々からのアドバイスは非常に価値があり、事業成長に直結しています。",
    helpfulCount: 18,
    tags: ["メンタリング", "アドバイス", "事業成長"]
  },
  {
    id: "5",
    userName: "高橋 投資郎",
    userRole: "シード投資家",
    userAvatar: "https://i.pravatar.cc/150?img=51",
    userType: "投資家",
    rating: 4,
    date: "2024年10月11日",
    title: "効率的な投資プロセス",
    comment: "従来の投資プロセスと比べて、StartupHubを使うことで大幅に効率化できました。デューデリジェンスに必要な情報が整理されており、判断が早くなりました。",
    helpfulCount: 15,
    tags: ["効率化", "デューデリジェンス", "投資プロセス"]
  }
];

const ratingDistribution = {
  5: 25,
  4: 7,
  3: 2,
  2: 0,
  1: 0
};

const categoryRatings = {
  platform: 4.8,
  support: 4.6,
  matching: 4.7,
  community: 4.7
};

export default function StartupHubEvaluationPage() {
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
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    #{2}
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
                    <Badge key={badge} className="bg-orange-100 text-orange-800 border-orange-300">
                      <TrendingUp className="w-3 h-3 mr-1" />
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
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.platform}</div>
                  <Rating value={categoryRatings.platform} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">プラットフォーム</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.support}</div>
                  <Rating value={categoryRatings.support} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">サポート</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.matching}</div>
                  <Rating value={categoryRatings.matching} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">マッチング</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-ash-text">{categoryRatings.community}</div>
                  <Rating value={categoryRatings.community} readonly size="sm" className="justify-center mb-1" />
                  <p className="text-sm text-ash-muted">コミュニティ</p>
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
                創業者
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                投資家
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                ファン
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
              StartupHubとつながりませんか？
            </h2>
            <p className="text-ash-muted mb-6">
              スタートアップ支援のプロフェッショナルとの出会いを
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