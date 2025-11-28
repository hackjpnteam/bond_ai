export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container-narrow mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">利用規約</h1>

        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">第1条（適用）</h2>
            <p className="text-ash-muted leading-relaxed">
              本規約は、hackjpn, inc.（以下「当社」）が提供するサービス「Bond」（以下「本サービス」）の利用条件を定めるものです。
              ユーザーの皆様には、本規約に同意いただいた上で、本サービスをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">第2条（利用登録）</h2>
            <p className="text-ash-muted leading-relaxed">
              本サービスの利用を希望する方は、当社の定める方法によって利用登録を申請し、
              当社がこれを承認することによって、利用登録が完了するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">第3条（禁止事項）</h2>
            <p className="text-ash-muted leading-relaxed">
              ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません：
            </p>
            <ul className="list-disc list-inside text-ash-muted mt-2 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社または第三者の知的財産権を侵害する行為</li>
              <li>当社または第三者の名誉・信用を毀損する行為</li>
              <li>不正アクセスやサービスの妨害行為</li>
              <li>虚偽の情報を登録する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">第4条（サービスの変更・停止）</h2>
            <p className="text-ash-muted leading-relaxed">
              当社は、ユーザーに事前に通知することなく、本サービスの内容を変更し、
              または本サービスの提供を停止することができるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">第5条（免責事項）</h2>
            <p className="text-ash-muted leading-relaxed">
              当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、
              連絡または紛争等について一切責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">第6条（規約の変更）</h2>
            <p className="text-ash-muted leading-relaxed">
              当社は、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができるものとします。
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
