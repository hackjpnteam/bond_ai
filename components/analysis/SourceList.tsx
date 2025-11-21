'use client';

import { Check, Circle, Loader2, X } from 'lucide-react';

export interface Source {
  title: string;
  url: string;
  status: 'pending' | 'fetching' | 'done' | 'error';
}

interface SourceListProps {
  sources: Source[];
}

function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">
        解析中のソース
      </h3>
      <div className="space-y-1.5 sm:space-y-2">
        {sources.map((source, index) => (
          <div
            key={`${source.url}-${index}`}
            className="flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gray-50 rounded-md transition-all hover:bg-gray-100"
          >
            <div className="flex-shrink-0 mt-0.5">
              {source.status === 'done' && (
                <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              )}
              {source.status === 'fetching' && (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
              {source.status === 'pending' && (
                <div className="w-3 h-3 bg-gray-300 rounded-full" />
              )}
              {source.status === 'error' && (
                <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {source.title}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate font-mono">
                {getDomain(source.url)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
