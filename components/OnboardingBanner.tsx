'use client';

import { useOnboarding } from '@/lib/use-onboarding';
import { Lock, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function OnboardingBanner() {
  const { status: sessionStatus } = useSession();
  const { status, isLoading, isFeatureLocked } = useOnboarding();

  // ログインしていない、ロード中、または完了済みの場合は表示しない
  if (sessionStatus !== 'authenticated' || isLoading || !isFeatureLocked || !status) {
    return null;
  }

  const { evaluationCount, requiredEvaluations, remainingEvaluations } = status;

  // 1件以上なら信頼ネットワークは開放済み
  const trustMapUnlocked = evaluationCount >= 1;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">
                {trustMapUnlocked
                  ? `あと${remainingEvaluations}件の評価で全機能が開放されます`
                  : '1件評価すると信頼ネットワークが開放されます'}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {trustMapUnlocked
                  ? '紹介リクエスト・接続管理・メッセージ機能を使えるようにしましょう'
                  : '評価を投稿して、信頼ネットワーク機能を使えるようにしましょう'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* プログレスバー */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(requiredEvaluations)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      i < evaluationCount
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-200 text-amber-600'
                    }`}
                  >
                    {i < evaluationCount ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Star className="w-3 h-3" />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-xs text-amber-700">
                {evaluationCount}/{requiredEvaluations}
              </span>
            </div>

            <Link
              href="/search"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              企業を検索して評価
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ロック画面コンポーネント
 * オンボーディング未完了時に機能をブロックする
 * @param requiredEvaluations - この機能を開放するのに必要な評価数（デフォルト: 2）
 */
export function LockedFeature({
  children,
  featureName = 'この機能',
  requiredEvaluations = 2
}: {
  children: React.ReactNode;
  featureName?: string;
  requiredEvaluations?: number;
}) {
  const { status: sessionStatus } = useSession();
  const { status, isLoading } = useOnboarding();

  // セッション確認中はローディング表示（フェイルセーフ）
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-500">認証を確認中...</p>
        </div>
      </div>
    );
  }

  // ログインしていない場合はそのまま表示（ログイン画面へのリダイレクトは別で処理）
  if (sessionStatus === 'unauthenticated') {
    return <>{children}</>;
  }

  // ロード中はローディング表示（フェイルセーフ：ロック状態を前提）
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // statusが取得できない場合はロック状態を維持（フェイルセーフ）
  if (!status) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {featureName}にアクセスできません
          </h2>
          <p className="text-gray-600 mb-6">
            ステータスの確認中にエラーが発生しました。ページを再読み込みしてください。
          </p>
        </div>
      </div>
    );
  }

  // 評価数が要件を満たしている場合はそのまま表示
  if (status.evaluationCount >= requiredEvaluations) {
    return <>{children}</>;
  }

  const remainingEvaluations = requiredEvaluations - status.evaluationCount;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {featureName}はロックされています
        </h2>
        <p className="text-gray-600 mb-6">
          あと{remainingEvaluations}件評価でこの機能が開放されます。
        </p>
        <Link
          href="/search"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-bond-pink hover:bg-bond-pinkDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bond-pink shadow-md"
        >
          <Star className="w-5 h-5 mr-2" />
          企業を検索して評価する
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          評価は匿名でも投稿できます
        </p>
      </div>
    </div>
  );
}

export default OnboardingBanner;
