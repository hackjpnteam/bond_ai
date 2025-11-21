'use client';

import { Check, Loader2 } from 'lucide-react';

interface SimpleStepProps {
  step: 1 | 2 | 3;
}

const STEP_LABELS = {
  1: '検索中…',
  2: '情報を解析中…',
  3: 'AI がレポートを生成中…',
};

export function SimpleStep({ step }: SimpleStepProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                stepNum < step
                  ? 'bg-green-500 text-white'
                  : stepNum === step
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {stepNum < step ? (
                <Check className="w-4 h-4" />
              ) : stepNum === step ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                stepNum
              )}
            </div>
            {stepNum < 3 && (
              <div
                className={`w-8 md:w-16 h-0.5 transition-colors ${
                  stepNum < step ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="ml-4 text-sm font-medium text-gray-700 hidden md:block">
        {STEP_LABELS[step]}
      </div>
    </div>
  );
}
