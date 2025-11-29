import { Users, TrendingUp, Building2, Zap, Network, Star } from "lucide-react";
import type { ReactNode } from "react";
import { HeroSection } from "@/components/HeroSection";
// import { BondTestimonials } from "@/components/BondTestimonials";
import Link from "next/link";
import { TopCompaniesHighlight } from "@/components/TopCompaniesHighlight";
import { TrustMapDemo } from "@/components/TrustMapDemo";

const conceptHighlights = [
  {
    icon: '🤝',
    title: '信頼ネットワークで安全にアプローチ',
    description: '共通の知人・過去の取引・評価データから、\n安心して会える相手だけを抽出。'
  },
  {
    icon: '💬',
    title: '口コミベースの信頼スコア',
    description: '実際の取引・勤務・顧客体験から生まれる\nリアルな"評判の見える化"。'
  },
  {
    icon: '⚙️',
    title: 'AIが最短ルートを提案',
    description: '「この企業に行くなら、まずこの人を経由すると早い」\n最適な紹介ルートを自動で表示。'
  }
]

export default function Page() {
  return (
    <>
      <HeroSection />

      {/* Concept Section */}
      <section id="concept" className="section py-10 md:py-16">
        <div className="container-narrow mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="mb-4 md:mb-6 text-xl sm:text-2xl md:text-3xl">会いたい会社を、最適ルートで。</h2>
            <p className="max-w-3xl mx-auto leading-relaxed mb-4 text-sm md:text-base">
              Bondは「信頼関係」をベースに、<br className="hidden sm:block" />
              M&A仲介・資金調達・営業活動のマッチング効率を最大化します。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 justify-items-center">
            {conceptHighlights.map((item) => (
              <div
                key={item.title}
                className="card p-4 md:p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer w-full max-w-sm text-center space-y-2 md:space-y-3"
              >
                <div className="text-2xl md:text-3xl">{item.icon}</div>
                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-base md:text-lg font-semibold">{item.title}</h3>
                  <p className="text-xs md:text-sm leading-relaxed text-ash-muted whitespace-pre-line">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Map Demo */}
      <TrustMapDemo />

      {/* Use Case Section */}
      <section id="use-case" className="section py-10 md:py-16 bg-gradient-to-b from-ash-surface/30 to-white">
        <div className="container-narrow mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="mb-4 md:mb-6 text-xl sm:text-2xl md:text-3xl">さまざまなビジネスシーンで</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {/* Use Case 1 - VC・投資家 */}
            <div className="card p-4 md:p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl flex-shrink-0">🚀</div>
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">VC・投資家</h3>
                  <p className="text-xs md:text-sm leading-relaxed">
                    どの投資家が誰を紹介し、どんな観点で投資したかが一目でわかる。起業家の"信用背景"まで可視化され、投資判断が速く・正確に。
                  </p>
                </div>
              </div>
            </div>

            {/* Use Case 2 - 人材紹介・エージェント */}
            <div className="card p-4 md:p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl flex-shrink-0">🧑‍💼</div>
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">人材紹介・エージェント</h3>
                  <p className="text-xs md:text-sm leading-relaxed">
                    候補者・企業・紹介者のつながりを可視化。「誰が推薦しているか」がわかるから、決定率が上がる。
                  </p>
                </div>
              </div>
            </div>

            {/* Use Case 3 - 士業 */}
            <div className="card p-4 md:p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl flex-shrink-0">⚖️</div>
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">士業（税理士・弁護士・社労士・コンサル）</h3>
                  <p className="text-xs md:text-sm leading-relaxed">
                    紹介者・実績・評価をまとめて信頼プロフィール化。初回相談前から "この先生なら安心" を伝えられる。
                  </p>
                </div>
              </div>
            </div>

            {/* Use Case 4 - M&A仲介 */}
            <div className="card p-4 md:p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl flex-shrink-0">🤝</div>
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">M&A仲介</h3>
                  <p className="text-xs md:text-sm leading-relaxed">
                    売り手・買い手・仲介者の信頼関係がひと目でわかる。リスクの高い交渉を、信頼データで安全に進められる。
                  </p>
                </div>
              </div>
            </div>

            {/* Use Case 5 - 不動産営業 */}
            <div className="card p-4 md:p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl flex-shrink-0">🏡</div>
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">不動産営業</h3>
                  <p className="text-xs md:text-sm leading-relaxed">
                    過去顧客・紹介者・共通の知人がつながる顧客マップ。紹介が自然に生まれ、初回から信頼で商談が始まる。
                  </p>
                </div>
              </div>
            </div>

            {/* Use Case 6 - BtoB営業 */}
            <div className="card p-4 md:p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl flex-shrink-0">💼</div>
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">BtoB営業（SaaS / ITツール / 受託開発）</h3>
                  <p className="text-xs md:text-sm leading-relaxed">
                    共通の投資家・知人・顧客が一目でわかる。寒いアウトバウンドではなく"信頼起点の営業"ができる。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking Section */}
      <section id="ranking" className="section py-10 md:py-16 bg-gradient-to-b from-white/50 to-ash-surface/30">
        <div className="container-narrow mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="mb-3 md:mb-4 text-xl sm:text-2xl md:text-3xl">📊 信頼スコアで見る注目企業</h2>
            <p className="max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
              Bondで評価の高い企業が、信頼スコア順にランキング。
            </p>
          </div>

          <TopCompaniesHighlight />

          <div className="text-center mt-4">
            <Link href="/ranking" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium py-2">
              ランキングをもっと見る →
            </Link>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
            <div className="text-center p-3 md:p-4 bg-white/50 rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">100+</div>
              <div className="text-xs md:text-sm text-ash-muted">登録企業</div>
            </div>
            <div className="text-center p-3 md:p-4 bg-white/50 rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-green-600">4.5</div>
              <div className="text-xs md:text-sm text-ash-muted">平均評価</div>
            </div>
            <div className="text-center p-3 md:p-4 bg-white/50 rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-purple-600">1,000+</div>
              <div className="text-xs md:text-sm text-ash-muted">ユーザー評価</div>
            </div>
            <div className="text-center p-3 md:p-4 bg-white/50 rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-orange-600">毎日</div>
              <div className="text-xs md:text-sm text-ash-muted">更新頻度</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <BondTestimonials /> */}

      {/* CTA Section */}
      <section className="section py-10 md:py-16">
        <div className="container-narrow mx-auto px-3 md:px-4 text-center">
          <div className="card p-6 sm:p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="mb-4 md:mb-6 text-xl sm:text-2xl md:text-3xl">あなたの"信頼の輪"を広げよう。</h2>
            <p className="mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
              信頼に基づいた出会いが、新しいチャンスを生み出します。<br className="hidden sm:block" />
              今すぐBondで、信頼経済圏の一員に。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="btn-dark w-full sm:w-auto py-3 px-6">
                無料で始める
              </Link>
              <Link href="/letter" className="btn-ol w-full sm:w-auto py-3 px-6">
                はじめに
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

function CustomLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
