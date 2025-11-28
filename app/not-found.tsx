import Link from 'next/link';
import { Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-gray-200">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mt-4">
            ページが見つかりません
          </h2>
          <p className="text-gray-600 mt-2">
            お探しのURLは存在しないか、移動した可能性があります。
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Search className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-800">検索してみましょう</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            企業名や人名で検索して、お探しの情報を見つけてください。
          </p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            検索ページへ
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <Home className="w-4 h-4" />
          ホームへ戻る
        </Link>

        <p className="text-xs text-gray-400 mt-8">
          問題が続く場合は <Link href="/support" className="text-blue-600 hover:underline">サポート</Link> までお問い合わせください。
        </p>
      </div>
    </div>
  );
}
