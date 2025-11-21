'use client';

import { Building2, User, Briefcase, MapPin, Star, TrendingUp } from 'lucide-react';
import { CompanyCandidate } from '@/types/bond';

interface CompanyCandidatesProps {
  candidates: CompanyCandidate[];
  onSelect: (candidate: CompanyCandidate) => void;
  query: string;
}

// マッチ度をラベルに変換
function getMatchLabel(score: number | undefined): { label: string; color: string } | null {
  if (!score || score <= 1) return null;
  if (score >= 20) return { label: '高マッチ', color: 'bg-green-100 text-green-700' };
  if (score >= 10) return { label: '中マッチ', color: 'bg-yellow-100 text-yellow-700' };
  return { label: '低マッチ', color: 'bg-gray-100 text-gray-600' };
}

export function CompanyCandidates({ candidates, onSelect, query }: CompanyCandidatesProps) {
  if (candidates.length === 0) {
    return null;
  }

  // マッチスコアがある候補がいるかチェック
  const hasScores = candidates.some(c => c.matchScore && c.matchScore > 1);

  return (
    <div className="w-full space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          「{query}」に該当する企業が複数見つかりました。
        </p>
        <p className="text-sm text-muted-foreground">
          調べたい企業を選択してください。
        </p>
        {hasScores && (
          <p className="text-xs text-primary mt-1">
            絞り込み条件に基づいてマッチ度順に並べ替えました
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {candidates.map((candidate, index) => {
          const matchInfo = getMatchLabel(candidate.matchScore);
          const isTopMatch = hasScores && index === 0 && matchInfo;

          return (
            <button
              key={candidate.slug}
              onClick={() => onSelect(candidate)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md group ${
                isTopMatch
                  ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                  : 'border-border bg-card hover:bg-muted/50 hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  isTopMatch
                    ? 'bg-gradient-to-br from-primary/20 to-primary/30'
                    : 'bg-gradient-to-br from-primary/10 to-primary/20'
                }`}>
                  <Building2 className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                      {candidate.name}
                    </h3>
                    {matchInfo && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${matchInfo.color}`}>
                        <TrendingUp className="w-3 h-3" />
                        {matchInfo.label}
                      </span>
                    )}
                    {isTopMatch && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium bg-primary/20 text-primary">
                        <Star className="w-3 h-3" />
                        おすすめ
                      </span>
                    )}
                  </div>

                  {candidate.industry && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                      {candidate.industry}
                    </span>
                  )}

                  {candidate.services && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {candidate.services}
                      </p>
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {candidate.ceo && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          代表: {candidate.ceo}
                        </span>
                      </div>
                    )}

                    {candidate.headquarters && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {candidate.headquarters}
                        </span>
                      </div>
                    )}
                  </div>

                  {candidate.founded && (
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      設立: {candidate.founded}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-primary font-medium group-hover:underline">
                  この企業を調べる →
                </span>
                {candidate.matchScore && candidate.matchScore > 1 && (
                  <span className="text-xs text-muted-foreground">
                    スコア: {candidate.matchScore}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CompanyCandidates;
