'use client'

import { useState } from 'react'
import { ArrowRight, Video } from 'lucide-react'
import { VideoRatingModal } from '@/components/VideoRatingModal'
import Link from 'next/link'

export function HeroSection() {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)

  return (
    <>
      <section className="section pt-4 pb-8 md:py-12">
        <div className="container-narrow mx-auto px-3 md:px-4">
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-ash-line bg-hero-gradient p-6 sm:p-8 md:p-16">
            {/* 薄い紙のような表面感 */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-transparent" />

            {/* タイトル */}
            <div className="relative z-10 text-center">

              <h1 className="text-center animate-slide-in-left mb-6 md:mb-8 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold tracking-wide">
                <span className="block leading-tight md:leading-snug">アクセスしたい企業・人に</span>
                <span className="block leading-tight md:leading-snug mt-1 md:mt-2">一番早くたどり着く</span>
              </h1>

              <p className="mx-auto max-w-2xl text-center animate-slide-in-right font-medium leading-loose text-sm sm:text-base md:text-lg text-ash-muted" style={{animationDelay: '0.3s'}}>
                Bondは、信頼データにもとづいて、
              </p>
              <p className="mx-auto max-w-2xl text-center animate-slide-in-right font-medium leading-loose text-sm sm:text-base md:text-lg text-ash-muted" style={{animationDelay: '0.4s'}}>
                資金調達・営業・採用の<span className="font-bold text-ash-text">"正しい入り口"</span>を
              </p>
              <p className="mx-auto max-w-2xl text-center animate-slide-in-right font-medium leading-loose text-sm sm:text-base md:text-lg text-ash-muted" style={{animationDelay: '0.5s'}}>
                AIが教えてくれるサービスです。
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up mt-10 md:mt-14" style={{animationDelay: '0.7s'}}>
                <Link href="/signup" className="btn-dark group w-full sm:w-auto text-center py-3 px-6">
                  無料で始める
                  <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/letter" className="btn-ol group w-full sm:w-auto text-center py-3 px-6">
                  はじめに
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
