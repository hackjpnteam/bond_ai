import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container-narrow mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">サポート</h1>

        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">お問い合わせ</h2>
            <p className="text-ash-muted leading-relaxed">
              Bondに関するお問い合わせは、以下の方法でご連絡ください。
            </p>
          </section>

          <section className="card p-6">
            <h3 className="text-lg font-semibold mb-4">メールでのお問い合わせ</h3>
            <p className="text-ash-muted">
              <a href="mailto:team@hackjpn.com" className="text-blue-600 hover:underline">
                team@hackjpn.com
              </a>
            </p>
            <p className="text-sm text-ash-muted mt-2">
              ※ 返信には2〜3営業日いただく場合がございます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">よくある質問</h2>

            <div className="space-y-4">
              <div className="card p-4">
                <h4 className="font-semibold mb-2">Q. アカウントの登録方法を教えてください</h4>
                <p className="text-ash-muted text-sm">
                  A. トップページの「無料で始める」ボタンから、メールアドレスまたはGoogleアカウントで登録できます。
                </p>
              </div>

              <div className="card p-4">
                <h4 className="font-semibold mb-2">Q. パスワードを忘れました</h4>
                <p className="text-ash-muted text-sm">
                  A. ログインページの「パスワードをお忘れですか？」リンクからパスワードをリセットできます。
                </p>
              </div>

              <div className="card p-4">
                <h4 className="font-semibold mb-2">Q. 退会するにはどうすればいいですか？</h4>
                <p className="text-ash-muted text-sm">
                  A. 設定ページからアカウントの削除が可能です。または、サポートまでご連絡ください。
                </p>
              </div>

              <div className="card p-4">
                <h4 className="font-semibold mb-2">Q. 会社情報を修正したい</h4>
                <p className="text-ash-muted text-sm">
                  A. マイページから会社情報の編集が可能です。法人名の変更等はサポートまでお問い合わせください。
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-ash-line pt-8 mt-8">
            <h2 className="text-xl font-semibold mb-4">運営会社</h2>
            <p className="text-ash-muted mb-4">
              hackjpn, inc.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-blue-600 hover:underline text-sm">
                プライバシーポリシー
              </Link>
              <Link href="/terms" className="text-blue-600 hover:underline text-sm">
                利用規約
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
