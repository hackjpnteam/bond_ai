'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, User } from 'lucide-react';
import Image from 'next/image';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageUpdate: (imageUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfileImageUpload({ 
  currentImage, 
  onImageUpdate,
  size = 'md' 
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('JPG、PNG、WebP形式のファイルのみ対応しています');
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // アップロード実行
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onImageUpdate(data.profileImage);
          setPreviewUrl(null);
          alert('プロフィール画像をアップロードしました！');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'アップロードに失敗しました');
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('アップロード中にエラーが発生しました');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Image Display */}
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100`}>
        {displayImage ? (
          <Image
            src={displayImage}
            alt="Profile"
            fill
            className="object-cover"
            sizes={size === 'lg' ? '128px' : size === 'md' ? '96px' : '64px'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
            <User className={`${size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-8 h-8' : 'w-6 h-6'} text-gray-600`} />
          </div>
        )}
        
        {/* Upload overlay when uploading */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}

        {/* Preview overlay */}
        {previewUrl && !uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-gray-300"
              onClick={clearPreview}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center gap-2">
        <Button 
          onClick={handleButtonClick}
          disabled={uploading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              アップロード中...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              {currentImage ? '画像を変更' : '画像をアップロード'}
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          JPG, PNG, WebP (最大5MB)
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}