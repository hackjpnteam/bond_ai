import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata = {
  title: '料金プラン | Bond',
  description: '最初の100名まで完全無料でご利用いただけます',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            料金プラン
          </h1>
          <p className="text-xl text-gray-600">
            シンプルで分かりやすい料金体系
          </p>
        </div>

        {/* 無料プランカード */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#ff7a18] via-[#ff5f4a] to-[#ff3d81] p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              完全無料
            </h2>
            <p className="text-white/90 text-lg">
              最初の100名まで
            </p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">¥0</span>
                  <span className="text-xl text-gray-600">/月</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  🎉 早期ユーザー特典
                </p>
                <p className="text-gray-700 leading-relaxed">
                  最初のユーザーが<strong className="text-[#ff5f4a]">100名到達するまで、完全に無料</strong>でご利用いただけます。
                  100名を超えた際は、事前にお知らせします。
                </p>
              </div>
            </div>

            {/* 機能リスト */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                利用可能な機能
              </h3>

              <div className="space-y-3">
                {[
                  'AI による企業・人物検索',
                  '信頼スコアの閲覧',
                  'コミュニティ評価の投稿・閲覧',
                  'マイリスト機能',
                  'プロフィール作成',
                  '企業との関係性の管理',
                  'メッセージ機能',
                  '紹介依頼機能'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAボタン */}
            <div className="text-center pt-6 border-t">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white rounded-full shadow-lg transition-all transform hover:scale-105 bg-gradient-to-r from-[#ff7a18] via-[#ff5f4a] to-[#ff3d81] hover:from-[#ff8f3d] hover:to-[#ff4f91]"
              >
                今すぐ無料で始める
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                クレジットカード不要
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            よくある質問
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Q: 100名を超えた後の料金はどうなりますか？
              </h3>
              <p className="text-gray-700">
                A: 100名を超える前に、事前にメールでお知らせします。その際に、今後の料金プランについてご案内させていただきます。現在のユーザー数は随時サイト上で公開予定です。
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Q: 無料期間中に登録すれば、ずっと無料ですか？
              </h3>
              <p className="text-gray-700">
                A: 最初の100名の方には特別な早期ユーザー特典をご用意する予定です。詳細は100名到達前にお知らせします。
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Q: 機能制限はありますか？
              </h3>
              <p className="text-gray-700">
                A: いいえ、無料期間中もすべての機能を制限なくご利用いただけます。
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Q: 解約はいつでもできますか？
              </h3>
              <p className="text-gray-700">
                A: はい、いつでも自由にアカウントを削除できます。有料プランが開始した後も、いつでも解約可能です。
              </p>
            </div>
          </div>
        </div>

        {/* フッターCTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            まだ質問がありますか？
          </p>
          <Link
            href="/"
            className="text-[#ff5f4a] font-semibold hover:text-[#ff3d81] transition-colors"
          >
            ホームに戻る →
          </Link>
        </div>
      </div>
    </div>
  );
}
