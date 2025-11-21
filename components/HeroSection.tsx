'use client'

import { useState } from 'react'
import { ArrowRight, Shield, Video } from 'lucide-react'
import { VideoRatingModal } from '@/components/VideoRatingModal'
import Link from 'next/link'

export function HeroSection() {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)

  return (
    <>
      <section className="section">
        <div className="container-narrow mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-ash-line bg-hero-gradient p-10 md:p-16">
            {/* 薄い紙のような表面感 */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-transparent" />

            {/* タイトル */}
            <div className="relative z-10 text-center">
              <div className="animate-fade-in-up flex justify-center">
                <div className="pill bg-ash-surface2/80 text-ash-text mb-8 border border-ash-line">
                  <Shield className="w-4 h-4 text-ash-muted" />
                  <span className="font-medium">信頼経済圏</span>
                </div>
              </div>
              
              <h1 className="text-center animate-slide-in-left mb-6 text-3xl md:text-4xl lg:text-5xl font-serif font-bold tracking-wide leading-relaxed">
                信頼でつながる最適な出会いを。
              </h1>
              
              <p className="mx-auto max-w-3xl text-center mb-8 animate-slide-in-right font-medium leading-relaxed" style={{animationDelay: '0.3s'}}>
                Bondは、あなたの「会いたい企業・投資家・顧客」を信頼スコアに基づいて導き出す<br className="hidden md:block" />
                ビジネスマッチングプラットフォームです。
              </p>
              
              <p className="mx-auto max-w-2xl text-center mb-12 animate-slide-in-right text-sm md:text-base leading-relaxed" style={{animationDelay: '0.4s'}}>
                起業家・投資家・営業担当・仲介者のすべてが、<br className="hidden md:block" />
                "信頼経済圏"の中で成長を加速させます。
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 text-lg font-medium" style={{animationDelay: '0.5s'}}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  <span>信頼で見つかる最適ルート</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  <span>Bondで評価する・つながる・動く</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center justify-center gap-3 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
                <Link href="/signup" className="btn-dark group">
                  無料で始める
                  <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="mailto:info@bond.com?subject=資料請求" className="btn-ol group">
                  資料請求
                </Link>
              </div>
            </div>

            {/* 背景ストローク（うっすらした線画） */}
            <svg className="pointer-events-none absolute -bottom-8 right-0 h-64 w-96 opacity-30 stroke-mask" viewBox="0 0 400 200" fill="none">
              <path d="M10 150 C 120 10, 280 10, 390 150" stroke="#D8C9B9" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </section>

      <VideoRatingModal 
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        companyName="Bond"
      />
    </>
  )
}
