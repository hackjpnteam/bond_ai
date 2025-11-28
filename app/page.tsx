import { Users, TrendingUp, Building2, Zap, Network, Star } from "lucide-react";
import type { ReactNode } from "react";
import { HeroSection } from "@/components/HeroSection";
// import { BondTestimonials } from "@/components/BondTestimonials";
import Link from "next/link";
import { TopCompaniesHighlight } from "@/components/TopCompaniesHighlight";

const conceptHighlights = [
  {
    icon: '🤝',
    title: '検証済みの信頼ネットワーク',
    description: '共通の知人や評価データから「安全な出会い」を保証。'
  },
  {
    icon: '💬',
    title: '口コミ型の信頼スコア',
    description: '実際の取引・勤務・顧客体験に基づいたリアルなフィードバック。'
  },
  {
    icon: '⚙️',
    title: 'AIによる最適ルート提案',
    description: '「この会社と会うなら、まずこの人を通すと良い」を自動で可視化。'
  }
]

export default function Page() {
  return (
    <>
      <HeroSection />

      {/* Concept Section */}
      <section id="concept" className="section">
        <div className="container-narrow mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="mb-6">会いたい会社を、最適ルートで。</h2>
            <p className="max-w-3xl mx-auto leading-relaxed mb-4">
              Bondは「信頼関係」をベースに、<br className="hidden md:block" />
              M&A仲介・資金調達・営業活動のマッチング効率を最大化します。
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {conceptHighlights.map((item) => (
              <div
                key={item.title}
                className="card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer w-full max-w-sm text-center space-y-3"
              >
                <div className="text-3xl">{item.icon}</div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ash-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Section */}
      <section id="use-case" className="section bg-gradient-to-b from-ash-surface/30 to-white">
        <div className="container-narrow mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-6">さまざまなビジネスシーンで</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Use Case 1 */}
            <div className="card p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💼</div>
                <div>
                  <h3 className="text-lg font-bold mb-2">M&A仲介に</h3>
                  <p className="text-sm leading-relaxed">
                    売り手・買い手・仲介人の信頼関係を可視化し、交渉のリスクを最小化。
                  </p>
                </div>
              </div>
            </div>

            {/* Use Case 2 */}
            <div className="card p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💰</div>
                <div>
                  <h3 className="text-lg font-bold mb-2">VC・投資家に</h3>
                  <p className="text-sm leading-relaxed">
                    起業家・スタートアップの実績と信頼スコアを一目で確認。"紹介経路"まで明確に。
                  </p>
                </div>
              </div>
            </div>

            {/* Use Case 3 */}
            <div className="card p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🏠</div>
                <div>
                  <h3 className="text-lg font-bold mb-2">不動産営業に</h3>
                  <p className="text-sm leading-relaxed">
                    成約率を上げる「信頼でつながる顧客マップ」。共通の知人経由で自然な紹介が生まれる。
                  </p>
                </div>
              </div>
            </div>

            {/* Use Case 4 */}
            <div className="card p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🩺</div>
                <div>
                  <h3 className="text-lg font-bold mb-2">保険営業に</h3>
                  <p className="text-sm leading-relaxed">
                    口コミベースで「紹介されやすい営業担当」を可視化。信頼を軸にした営業スタイルを実現。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking Section */}
      <section id="ranking" className="section bg-gradient-to-b from-white/50 to-ash-surface/30">
        <div className="container-narrow mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4">📊 信頼スコアで見る注目企業</h2>
            <p className="max-w-2xl mx-auto leading-relaxed">
              Bondで評価の高い企業が、信頼スコア順にランキング。
            </p>
          </div>
          
          <TopCompaniesHighlight />

          <div className="text-center">
            <Link href="/ranking" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
              ランキングをもっと見る →
            </Link>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100+</div>
              <div className="text-sm text-ash-muted">登録企業</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">4.5</div>
              <div className="text-sm text-ash-muted">平均評価</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">1,000+</div>
              <div className="text-sm text-ash-muted">ユーザー評価</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">毎日</div>
              <div className="text-sm text-ash-muted">更新頻度</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <BondTestimonials /> */}

      {/* CTA Section */}
      <section className="section">
        <div className="container-narrow mx-auto px-4 text-center">
          <div className="card p-12 max-w-4xl mx-auto">
            <h2 className="mb-6">あなたの"信頼の輪"を広げよう。</h2>
            <p className="mb-8 max-w-2xl mx-auto leading-relaxed">
              信頼に基づいた出会いが、新しいチャンスを生み出します。<br />
              今すぐBondで、信頼経済圏の一員に。
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/signup" className="btn-dark">
                無料で始める
              </Link>
              <Link href="/letter" className="btn-ol">
                はじめに
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-ash-line bg-ash-surface">
        <div className="container-narrow mx-auto px-4 py-10 text-sm text-ash-muted">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6">
              <CustomLink href="/ranking" className="hover:text-ash-text transition-colors">ランキング</CustomLink>
              <CustomLink href="/timeline" className="hover:text-ash-text transition-colors">タイムライン</CustomLink>
              <CustomLink href="/privacy" className="hover:text-ash-text transition-colors">プライバシー</CustomLink>
              <CustomLink href="/terms" className="hover:text-ash-text transition-colors">利用規約</CustomLink>
              <CustomLink href="/support" className="hover:text-ash-text transition-colors">サポート</CustomLink>
            </div>
          </div>
          <div className="border-t border-ash-line mt-8 pt-8 text-center">
            <p>&copy; 2024 Bond. All rights reserved.</p>
          </div>
        </div>
      </footer>
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
