'use client';

import React from 'react';
import { Send, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InputBarProps {
  value: string;
  setValue: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ 
  value, 
  setValue, 
  loading, 
  onSubmit, 
  placeholder = "会社名を入力...",
  disabled: externalDisabled = false
}) => {
  const disabled = loading || !value.trim() || externalDisabled;
  
  return (
    // ① コンテナ側に w-full を付与、アイテムを縦中央揃え、デスクトップで最大幅制限
    <div className="flex items-center gap-2 sm:gap-3 w-full max-w-4xl mx-auto">
      {/* ② flex子要素に min-w-0 を指定してはみ出し防止 */}
      <div className="flex-1 min-w-0 relative">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          // ③ 入力自身は w-full、右アイコン分の余白 pr-12、デスクトップで大きめサイズ
          className="w-full h-11 sm:h-12 rounded-xl pr-12 text-sm sm:text-base"
          disabled={externalDisabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* ④ 送信ボタンは shrink-0 で縮まず切れない、デスクトップで最小幅確保 */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Button
          onClick={onSubmit}
          disabled={disabled}
          className="h-11 sm:h-12 rounded-xl gap-2 min-w-[80px] sm:min-w-[100px] px-4 sm:px-6"
          title="Shift+Enter でも送信できます"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">送信</span>
          <span className="sm:hidden">送信</span>
        </Button>
        <span className="text-[10px] text-muted-foreground hidden sm:block">Shift+Enter</span>
      </div>
    </div>
  );
};

export default InputBar;