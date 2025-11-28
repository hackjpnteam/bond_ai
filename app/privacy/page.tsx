export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container-narrow mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. 個人情報の収集について</h2>
            <p className="text-ash-muted leading-relaxed">
              当社は、サービスの提供にあたり、お客様の個人情報を適切に収集・利用いたします。
              収集する情報には、氏名、メールアドレス、会社情報、職歴、人脈・コネクション情報などが含まれます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. 個人情報の利用目的</h2>
            <p className="text-ash-muted leading-relaxed">
              収集した個人情報は、以下の目的で利用いたします：
            </p>
            <ul className="list-disc list-inside text-ash-muted mt-2 space-y-1">
              <li>サービスの提供・運営</li>
              <li>ユーザー間のコネクション・マッチング機能の提供</li>
              <li>信頼スコアの算出および表示</li>
              <li>紹介経路の可視化・最適ルートの提案</li>
              <li>お問い合わせへの対応</li>
              <li>サービス改善のための分析</li>
              <li>重要なお知らせの送信</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. コネクション情報の共有について</h2>
            <p className="text-ash-muted leading-relaxed">
              Bondは、ユーザー同士が信頼に基づいてつながるサービスです。本サービスの性質上、
              以下の情報は他のユーザーと共有される場合があります：
            </p>
            <ul className="list-disc list-inside text-ash-muted mt-2 space-y-1">
              <li>プロフィール情報（氏名、会社名、役職など）</li>
              <li>コネクション（つながり）の関係性</li>
              <li>信頼スコアおよび評価情報</li>
              <li>共通の知人・紹介経路に関する情報</li>
            </ul>
            <p className="text-ash-muted leading-relaxed mt-4">
              これらの情報共有により、ユーザーは安全で信頼性の高いビジネスマッチングを実現できます。
              ユーザーは、プライバシー設定により一部の情報の公開範囲を制限することができます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. 個人情報の第三者提供</h2>
            <p className="text-ash-muted leading-relaxed">
              当社は、以下の場合を除き、お客様の同意なく個人情報を第三者に提供することはありません：
            </p>
            <ul className="list-disc list-inside text-ash-muted mt-2 space-y-1">
              <li>本サービスの機能として、他のユーザーへのコネクション情報の共有</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要な場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. 個人情報の管理</h2>
            <p className="text-ash-muted leading-relaxed">
              当社は、お客様の個人情報を適切に管理し、不正アクセス、紛失、破損、改ざん、漏洩などを防止するための措置を講じます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. お問い合わせ</h2>
            <p className="text-ash-muted leading-relaxed">
              個人情報の取り扱いに関するお問い合わせは、下記までご連絡ください。
            </p>
            <p className="text-ash-muted mt-2">
              <a href="mailto:team@hackjpn.com" className="text-blue-600 hover:underline">
                team@hackjpn.com
              </a>
            </p>
          </section>

          <section className="border-t border-ash-line pt-8 mt-8">
            <h2 className="text-xl font-semibold mb-4">運営会社</h2>
            <p className="text-ash-muted">
              hackjpn, inc.
            </p>
          </section>

          <p className="text-sm text-ash-muted mt-8">
            制定日：2024年1月1日
          </p>
        </div>
      </div>
    </div>
  );
}
