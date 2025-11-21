'use client'

import { CompanyRegistrationForm } from '@/components/CompanyRegistrationForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Building2, ShieldCheck, Clock } from 'lucide-react'

export default function RegisterCompanyPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-2xl border-b border-ash-line/30">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm hover:opacity-80 text-ash-muted">
            <ArrowLeft className="w-4 h-4" />
            ホームに戻る
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* ヘッダー情報 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-ash-text">会社登録</h1>
          </div>
          <p className="text-ash-muted max-w-2xl mx-auto leading-relaxed mb-8">
            Bond で会社情報を登録して、優秀な人材や投資家とつながりましょう。
            透明性の高い評価システムで、あなたの会社の魅力を伝えることができます。
          </p>

        </div>

        {/* 登録フォーム */}
        <CompanyRegistrationForm />

        {/* フッター注意事項 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-4xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-3">登録について</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• 登録された情報は、Bond の<Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>に基づいて管理されます</li>
            <li>• 虚偽の情報を登録した場合、アカウントが削除される可能性があります</li>
            <li>• 審査には通常1-3営業日かかります。結果はメールでお知らせします</li>
            <li>• 登録後、会社ページの編集や追加情報の入力が可能になります</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
