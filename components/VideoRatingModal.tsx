'use client'

import { useState, useRef } from 'react'
import { Rating } from '@/components/Rating'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Star, Video, Upload, Play, Pause, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface VideoRatingModalProps {
  isOpen: boolean
  onClose: () => void
  companyName?: string
}

export function VideoRatingModal({ isOpen, onClose, companyName = "Bond" }: VideoRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('動画ファイルは50MB以下にしてください')
      return
    }

    // ファイル形式チェック
    if (!file.type.startsWith('video/')) {
      toast.error('動画ファイルを選択してください')
      return
    }

    setVideoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setVideoPreview(previewUrl)
  }

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
    setVideoFile(null)
    setVideoPreview(null)
    setIsPlaying(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleVideoEnd = () => {
    setIsPlaying(false)
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('評価を選択してください')
      return
    }

    if (!comment.trim()) {
      toast.error('コメントを入力してください')
      return
    }

    setSubmitting(true)
    
    try {
      // ここで実際のAPIコールを行う
      // const formData = new FormData()
      // formData.append('rating', rating.toString())
      // formData.append('comment', comment)
      // if (videoFile) formData.append('video', videoFile)
      
      // デモ用のシミュレーション
      setTimeout(() => {
        if (videoFile) {
          toast.success('動画付き評価を送信しました！信頼度スコアが2倍付与されます。')
        } else {
          toast.success('評価を送信しました！ありがとうございます。')
        }
        setRating(0)
        setComment('')
        removeVideo()
        setSubmitting(false)
        onClose()
      }, 1500)
    } catch (error) {
      toast.error('送信に失敗しました。もう一度お試しください。')
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    removeVideo()
    setRating(0)
    setComment('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl animate-fade-in-up border border-gray-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            {companyName}を評価
          </h2>
          <p className="text-gray-600 text-sm">
            あなたの評価を投稿して、信頼の輪を広げましょう（動画投稿も可能）
          </p>
        </div>
        
        <div className="space-y-6">
          {/* 評価 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">評価を選択</p>
            <div className="flex justify-center">
              <Rating 
                value={rating} 
                onChange={setRating}
                size="lg"
              />
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2 font-medium">
                {rating === 5 && "素晴らしい！"}
                {rating === 4 && "とても良い"}
                {rating === 3 && "良い"}
                {rating === 2 && "まあまあ"}
                {rating === 1 && "改善が必要"}
              </p>
            )}
          </div>

          {/* テキストコメント */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              コメント <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="この企業・サービスについての評価を記載してください..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              rows={4}
              required
            />
          </div>

          {/* 動画アップロード */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-3">
              <span className="inline-flex items-center gap-2">
                <Video className="w-4 h-4" />
                動画レビュー（任意）
                <span className="text-xs text-gray-500 font-normal">- より詳細な評価を共有できます</span>
              </span>
            </label>
            
            {!videoPreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">
                    動画で詳細なレビューを投稿
                  </p>
                  <p className="text-sm text-gray-500">
                    MP4, MOV, AVI (最大50MB、3分以内推奨)
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    動画レビューは信頼度スコアが2倍になります
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full h-64 rounded-lg object-cover bg-black"
                  onEnded={handleVideoEnd}
                />
                
                {/* 動画コントロール */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </button>
                </div>

                {/* 削除ボタン */}
                <button
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>{videoFile?.name}</span>
                  <span>{(videoFile?.size || 0 / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              </div>
            )}
          </div>
          
          
          {/* ボタン */}
          <div className="flex gap-3">
            <Button 
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || rating === 0 || !comment.trim()}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? '送信中...' : videoFile ? '動画レビューを送信' : '評価を送信'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
