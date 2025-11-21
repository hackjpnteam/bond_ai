'use client'

import { useEffect, useState, useRef } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RatingTrendData {
  date: string
  rating: number
  count: number
}

interface RatingTrendChartProps {
  companySlug: string
}

export function RatingTrendChart({ companySlug }: RatingTrendChartProps) {
  const [trendData, setTrendData] = useState<RatingTrendData[]>([])
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetchTrendData()
  }, [companySlug])

  useEffect(() => {
    if (trendData.length > 0 && canvasRef.current) {
      drawChart()
    }
  }, [trendData])

  const fetchTrendData = async () => {
    try {
      setLoading(true)
      
      // デモデータ（実際のAPIが実装されるまで）
      const demoData: RatingTrendData[] = [
        { date: '2024-07', rating: 4.2, count: 5 },
        { date: '2024-08', rating: 4.4, count: 8 },
        { date: '2024-09', rating: 4.6, count: 12 },
        { date: '2024-10', rating: 4.7, count: 15 },
        { date: '2024-11', rating: 4.8, count: 18 },
        { date: '2024-12', rating: 4.7, count: 22 }
      ]
      
      setTrendData(demoData)
    } catch (error) {
      console.error('Error fetching trend data:', error)
    } finally {
      setLoading(false)
    }
  }

  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = 40

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (trendData.length === 0) return

    // 値の範囲を計算
    const minRating = Math.min(...trendData.map(d => d.rating)) - 0.2
    const maxRating = Math.max(...trendData.map(d => d.rating)) + 0.2

    // グリッドとラベルを描画
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.font = '12px Inter'
    ctx.fillStyle = '#6b7280'

    // Y軸のグリッド線（評価値）
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * (height - 2 * padding)
      const rating = maxRating - (i / 4) * (maxRating - minRating)
      
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
      
      ctx.fillText(rating.toFixed(1), 5, y + 4)
    }

    // X軸のグリッド線とラベル
    trendData.forEach((item, index) => {
      const x = padding + (index / (trendData.length - 1)) * (width - 2 * padding)
      
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
      
      const month = item.date.split('-')[1]
      ctx.fillText(`${month}月`, x - 10, height - 15)
    })

    // 評価トレンドラインを描画
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.beginPath()

    trendData.forEach((item, index) => {
      const x = padding + (index / (trendData.length - 1)) * (width - 2 * padding)
      const y = padding + (1 - (item.rating - minRating) / (maxRating - minRating)) * (height - 2 * padding)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // データポイントを描画
    trendData.forEach((item, index) => {
      const x = padding + (index / (trendData.length - 1)) * (width - 2 * padding)
      const y = padding + (1 - (item.rating - minRating) / (maxRating - minRating)) * (height - 2 * padding)
      
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
      
      // 白い境界線
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }

  const getTrendDirection = () => {
    if (trendData.length < 2) return 'stable'
    
    const firstRating = trendData[0].rating
    const lastRating = trendData[trendData.length - 1].rating
    const diff = lastRating - firstRating
    
    if (diff > 0.1) return 'up'
    if (diff < -0.1) return 'down'
    return 'stable'
  }

  const getTrendIcon = () => {
    const direction = getTrendDirection()
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendText = () => {
    const direction = getTrendDirection()
    switch (direction) {
      case 'up':
        return '評価上昇中'
      case 'down':
        return '評価下降中'
      default:
        return '評価安定'
    }
  }

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">グラフを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ash-text">評価トレンド</h3>
        <div className="flex items-center gap-2 text-sm">
          {getTrendIcon()}
          <span className="font-medium">{getTrendText()}</span>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 border border-ash-line rounded-lg bg-white"
          style={{ width: '100%', height: '256px' }}
        />
        
        {trendData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">データがありません</div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-ash-text">
            {trendData.length > 0 ? trendData[trendData.length - 1].rating.toFixed(1) : '-'}
          </div>
          <div className="text-ash-muted">最新評価</div>
        </div>
        
        <div className="text-center">
          <div className="font-semibold text-ash-text">
            {trendData.length > 0 ? trendData[trendData.length - 1].count : 0}
          </div>
          <div className="text-ash-muted">累計評価数</div>
        </div>
        
        <div className="text-center">
          <div className="font-semibold text-ash-text">
            {trendData.length > 0 ? (
              trendData.length >= 2 ? 
                (trendData[trendData.length - 1].rating - trendData[trendData.length - 2].rating >= 0 ? '+' : '') +
                (trendData[trendData.length - 1].rating - trendData[trendData.length - 2].rating).toFixed(1)
              : '0.0'
            ) : '-'}
          </div>
          <div className="text-ash-muted">前月比</div>
        </div>
      </div>
    </div>
  )
}