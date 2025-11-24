'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface OnboardingStatus {
  completed: boolean;
  evaluationCount: number;
  requiredEvaluations: number;
  remainingEvaluations: number;
  progress: number;
}

interface UseOnboardingReturn {
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFeatureLocked: boolean;
}

export function useOnboarding(): UseOnboardingReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingStatus = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/onboarding/status');

      if (!response.ok) {
        throw new Error('オンボーディング状態の取得に失敗しました');
      }

      const data = await response.json();
      setOnboardingStatus(data.onboarding);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    fetchOnboardingStatus();
  }, [fetchOnboardingStatus]);

  // 機能がロックされているかどうか
  const isFeatureLocked = sessionStatus === 'authenticated' &&
    onboardingStatus !== null &&
    !onboardingStatus.completed;

  return {
    status: onboardingStatus,
    isLoading,
    error,
    refetch: fetchOnboardingStatus,
    isFeatureLocked
  };
}

export default useOnboarding;
