'use client'

import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  role?: string;
  avatarUrl: string;
  videoUrl: string;
};

const DATA: Testimonial[] = [
  {
    id: "1",
    name: "田中 恵美香",
    role: "起業家",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  },
  {
    id: "2",
    name: "Jason Park",
    role: "創業者",
    avatarUrl: "https://i.pravatar.cc/150?img=11",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "3",
    name: "林 美咲",
    role: "エンジニア",
    avatarUrl: "https://i.pravatar.cc/150?img=49",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
  {
    id: "4",
    name: "王 明華",
    role: "マーケター",
    avatarUrl: "https://i.pravatar.cc/150?img=23",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  },
];

// 動画カードコンポーネント
function BondVideoCard({
  testimonial,
}: {
  testimonial: Testimonial;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      className="relative w-full h-[400px] cursor-pointer snap-start"
      data-card
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-black">
        {!isPlaying ? (
          <div 
            className="relative w-full h-full"
            onClick={() => setIsPlaying(true)}
          >
            <video
              src={testimonial.videoUrl}
              className="w-full h-full object-cover"
              muted
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatarUrl}
                  alt={`${testimonial.name} avatar`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                />
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  {testimonial.role && (
                    <div className="text-sm text-gray-300">{testimonial.role}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <video
            src={testimonial.videoUrl}
            className="w-full h-full object-cover"
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}

export function BondTestimonials() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (dir: "prev" | "next") => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby="bond-stories-heading"
      className="
        relative py-20 sm:py-24
        bg-[radial-gradient(1200px_600px_at_50%_-10%,_#fff3e6_0%,_#f6e8db_45%,_#efe3d8_65%,_#eadfd6_100%)]
        text-[#2b2b2b]
      "
    >
      {/* 背景の"花びら"SVG模様 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%221200%22 height=%22670%22 viewBox=%220 0 1200 670%22><g fill=%22none%22 stroke=%22%232b2b2b%22 stroke-opacity=%220.08%22 stroke-width=%223%22><path d=%22M150 120c180 120 300 90 430 220S980 520 1120 420%22/><path d=%22M50 250c120 80 200 60 290 140S640 500 740 440%22 opacity=%220.6%22/><path d=%22M250 50c160 100 260 70 370 180S900 380 1020 300%22 opacity=%220.4%22/></g></svg>')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right -120px top -40px",
          backgroundSize: "900px auto",
        }}
      />

      {/* 追加の装飾要素 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-20 opacity-10"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22><circle cx=%22100%22 cy=%22100%22 r=%2280%22 fill=%22none%22 stroke=%22%232b2b2b%22 stroke-width=%222%22 opacity=%220.2%22/><circle cx=%22100%22 cy=%22100%22 r=%2260%22 fill=%22none%22 stroke=%22%232b2b2b%22 stroke-width=%221.5%22 opacity=%220.15%22/></svg>')",
          backgroundRepeat: "no-repeat",
          width: "200px",
          height: "200px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="bond-stories-heading"
            className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-ash-text"
          >
            Bondの口コミ
          </h2>
          <p className="mt-3 text-base sm:text-lg text-ash-muted">
            実際にBondを使って信頼・評価・成長を得た人たちの声
          </p>
        </div>

        {/* 横スクロール・スナップ */}
        <div className="relative mt-10">
          {/* 左右ナビ */}
          <div className="hidden md:flex absolute -left-2 top-1/2 z-10 -translate-y-1/2">
            <button
              aria-label="前へ"
              onClick={() => scrollByCards("prev")}
              className="rounded-full border border-black/10 bg-white/70 backdrop-blur p-3 shadow hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden md:flex absolute -right-2 top-1/2 z-10 -translate-y-1/2">
            <button
              aria-label="次へ"
              onClick={() => scrollByCards("next")}
              className="rounded-full border border-black/10 bg-white/70 backdrop-blur p-3 shadow hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={scrollerRef}
            className="
              mt-4 grid grid-flow-col auto-cols-[85%] sm:auto-cols-[48%] lg:auto-cols-[23%]
              gap-6 overflow-x-auto pb-4
              snap-x snap-mandatory
              [&::-webkit-scrollbar]:h-2
              [&::-webkit-scrollbar-thumb]:bg-neutral-300/60
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-track]:bg-neutral-100
              scroll-smooth
            "
            role="list"
            aria-label="お客様の声"
          >
            {DATA.map((t) => (
              <BondVideoCard key={t.id} testimonial={t} />
            ))}
          </div>

          {/* スクロールインジケーター */}
          <div className="flex justify-center mt-6 gap-1 md:hidden">
            {Array.from({ length: Math.ceil(DATA.length / 1) }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-neutral-400/50"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}