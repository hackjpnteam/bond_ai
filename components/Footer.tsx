import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-bond-cream">
      <div className="container-narrow mx-auto px-3 md:px-4 py-6 md:py-10 text-sm text-ash-muted">
        <div className="flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/ranking" className="hover:text-ash-text transition-colors py-1">
              ランキング
            </Link>
            <Link href="/timeline" className="hover:text-ash-text transition-colors py-1">
              タイムライン
            </Link>
            <Link href="/privacy" className="hover:text-ash-text transition-colors py-1">
              プライバシー
            </Link>
            <Link href="/terms" className="hover:text-ash-text transition-colors py-1">
              利用規約
            </Link>
            <Link href="/support" className="hover:text-ash-text transition-colors py-1">
              サポート
            </Link>
          </div>
        </div>
        <div className="border-t border-ash-line mt-6 md:mt-8 pt-6 md:pt-8 text-center text-xs md:text-sm">
          <p>© 2025 Bond ver1.4.4. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
