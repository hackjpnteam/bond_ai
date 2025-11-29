'use client';

export default function LetterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ash-bg/50 via-white to-ash-surface/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 手紙のコンテナ */}
        <div className="relative">
          {/* 手紙の影 */}
          <div className="absolute inset-0 bg-ash-peach/20 rounded-lg transform rotate-1 translate-y-2" />
          <div className="absolute inset-0 bg-ash-pink/20 rounded-lg transform -rotate-1 translate-y-1" />

          {/* 手紙本体 */}
          <div className="relative bg-ash-surface rounded-lg shadow-xl border border-ash-line overflow-hidden">
            {/* 手紙の上部装飾 */}
            <div className="h-2 bg-gradient-to-r from-ash-pink via-ash-peach to-ash-pink" />

            {/* 手紙の内容 */}
            <div className="px-8 md:px-12 pt-8 pb-10">
              {/* タイトル */}
              <h1 className="text-center text-2xl md:text-3xl font-serif text-ash-text mb-10">
                創業者からあなたへ
              </h1>

              {/* 本文 */}
              <div className="space-y-6 text-ash-muted leading-relaxed font-serif">
                <p className="text-lg">
                  AI時代が本格的に始まり、タイムラインは"AIがつくった広告"であふれ返るようになりました。
                </p>

                <p className="text-lg">
                  資本が広告を支配し、アルゴリズムが人の注意を奪い合う世界。
                  <br />
                  そんな時代だからこそ、私たちはあえて逆張りをします。
                </p>

                <p className="text-xl font-medium text-ash-text py-4 px-6 bg-ash-surface2/50 rounded-lg border-l-4 border-ash-pink">
                  「人と人の信頼こそが、商売を強く、美しくする。」
                </p>

                <p className="text-lg">
                  Bondは、その原点を取り戻すために生まれました。
                </p>

                <p className="text-lg">
                  Bondは、あなたの信頼の歴史を読み解き、未来の信用力を予測する
                  <span className="font-bold text-ash-text">"与信評価AIエージェント"</span>です。
                </p>

                <p className="text-lg">
                  従来の数字だけでは測れない「人間の価値」を、静かに可視化し、
                  <br />
                  恩送りが自然に生まれる世界をつくります。
                </p>
              </div>

              {/* 署名 */}
              <div className="mt-12 pt-8 border-t border-ash-line">
                <div className="text-right space-y-2">
                  <p className="text-2xl font-serif italic text-ash-text">
                    戸村光
                  </p>
                  <p className="text-sm text-ash-muted font-medium tracking-wider">
                    CEO of hackjpn
                  </p>
                </div>
              </div>
            </div>

            {/* 手紙の下部装飾 */}
            <div className="h-1 bg-gradient-to-r from-transparent via-ash-peach/50 to-transparent" />
          </div>
        </div>

        {/* 装飾的な背景要素 */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-ash-pink/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-ash-teal/20 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
