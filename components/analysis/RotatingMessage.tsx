'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  '企業データを収集中…',
  '公式サイトの構造を解析しています…',
  'ニュースとプレスリリースをチェックしています…',
  '競合情報を整理しています…',
  'AI がレポートを生成しています…',
];

export function RotatingMessage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2800); // 2.8秒ごとにローテーション

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg">
      <div className="relative flex-shrink-0">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping absolute" />
        <div className="w-2 h-2 bg-blue-600 rounded-full" />
      </div>
      <p className="text-xs sm:text-sm text-gray-700 font-medium transition-opacity duration-300 leading-relaxed">
        {MESSAGES[currentIndex]}
      </p>
    </div>
  );
}
