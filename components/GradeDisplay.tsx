import { cn } from '@/lib/utils'

interface GradeDisplayProps {
  grade: 'A' | 'B' | 'C' | 'D' | 'E'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  className?: string
}

export function GradeDisplay({ grade, size = 'md', showLabel = false, className }: GradeDisplayProps) {
  const getGradeConfig = (grade: string) => {
    switch (grade) {
      case 'A':
        return {
          color: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600',
          shadow: 'shadow-emerald-500/25',
          border: 'border-emerald-200',
          label: '優秀',
          description: '非常に優れた企業'
        }
      case 'B':
        return {
          color: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
          shadow: 'shadow-blue-500/25',
          border: 'border-blue-200',
          label: '良好',
          description: '良い評価の企業'
        }
      case 'C':
        return {
          color: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
          shadow: 'shadow-amber-500/25',
          border: 'border-amber-200',
          label: '普通',
          description: '標準的な企業'
        }
      case 'D':
        return {
          color: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600',
          shadow: 'shadow-orange-500/25',
          border: 'border-orange-200',
          label: '要注意',
          description: '改善が必要な企業'
        }
      case 'E':
        return {
          color: 'bg-gradient-to-br from-red-400 via-red-500 to-red-600',
          shadow: 'shadow-red-500/25',
          border: 'border-red-200',
          label: '問題あり',
          description: '重要な問題がある企業'
        }
      default:
        return {
          color: 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600',
          shadow: 'shadow-gray-500/25',
          border: 'border-gray-200',
          label: '未評価',
          description: '評価データなし'
        }
    }
  }

  const sizeConfig = {
    sm: {
      container: 'h-7 px-2.5',
      grade: 'text-sm font-bold',
      label: 'text-xs ml-1.5'
    },
    md: {
      container: 'h-8 px-3',
      grade: 'text-sm font-bold',
      label: 'text-xs ml-2'
    },
    lg: {
      container: 'h-10 px-4',
      grade: 'text-base font-bold',
      label: 'text-sm ml-2'
    },
    xl: {
      container: 'h-12 px-5',
      grade: 'text-lg font-bold',
      label: 'text-base ml-2.5'
    }
  }

  const config = getGradeConfig(grade)
  const sizes = sizeConfig[size]

  if (showLabel) {
    return (
      <div 
        className={cn(
          'inline-flex items-center rounded-full text-white border-2 backdrop-blur-sm',
          'transition-all duration-200 hover:scale-105 hover:shadow-lg',
          config.color,
          config.shadow,
          config.border,
          sizes.container,
          className
        )}
        title={`総合評価 ${grade}: ${config.label} - ${config.description}`}
      >
        <span className={cn('leading-none', sizes.grade)}>
          総合評価
        </span>
        <span className={cn('font-black leading-none', sizes.grade, sizes.label)}>
          {grade}
        </span>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center justify-center rounded-full text-white border-2',
        'transition-all duration-200 hover:scale-105 hover:shadow-lg backdrop-blur-sm',
        config.color,
        config.shadow,
        config.border,
        sizes.container,
        'aspect-square min-w-fit',
        className
      )}
      title={`総合評価 ${grade}: ${config.label} - ${config.description}`}
    >
      <span className={cn('leading-none font-black', sizes.grade)}>
        {grade}
      </span>
    </div>
  )
}

export function calculateGrade(rating: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (rating >= 4.5) return 'A'
  if (rating >= 4.0) return 'B'
  if (rating >= 3.5) return 'C'
  if (rating >= 3.0) return 'D'
  return 'E'
}

export function getGradeLabel(grade: 'A' | 'B' | 'C' | 'D' | 'E'): string {
  const labels = {
    'A': '優秀',
    'B': '良好', 
    'C': '普通',
    'D': '要注意',
    'E': '問題あり'
  }
  return labels[grade]
}