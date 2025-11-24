import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '信頼ネットワーク - Bond'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// MongoDB接続はEdge Runtimeで使えないため、APIから取得
async function getUserData(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/trust-map/share/${userId}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: { userId: string } }) {
  const data = await getUserData(params.userId)

  const userName = data?.me?.name || 'ユーザー'
  const companyCount = data?.companies?.length || 0
  const connectionCount = data?.users?.length || 0

  // ネットワークノードの位置を計算
  const nodes = []
  const totalNodes = Math.min(companyCount + connectionCount, 8)

  for (let i = 0; i < totalNodes; i++) {
    const angle = (i / totalNodes) * 2 * Math.PI - Math.PI / 2
    const radius = 180
    nodes.push({
      x: 600 + Math.cos(angle) * radius,
      y: 315 + Math.sin(angle) * radius,
      type: i < companyCount ? 'company' : 'person',
    })
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FFFAF5 0%, #FFF5EB 50%, #FFFAF5 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* ネットワーク線 */}
        <svg
          width="1200"
          height="630"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {nodes.map((node, i) => (
            <line
              key={i}
              x1="600"
              y1="315"
              x2={node.x}
              y2={node.y}
              stroke="#E8B4B8"
              strokeWidth="2"
              strokeOpacity="0.5"
            />
          ))}
        </svg>

        {/* ネットワークノード */}
        {nodes.map((node, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: node.x - 25,
              top: node.y - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: node.type === 'company'
                ? 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
                : 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ color: 'white', fontSize: 20 }}>
              {node.type === 'company' ? '🏢' : '👤'}
            </span>
          </div>
        ))}

        {/* 中央のユーザーアイコン */}
        <div
          style={{
            position: 'absolute',
            left: 600 - 50,
            top: 315 - 50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8B4B8 0%, #D4A5A5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(232, 180, 184, 0.4)',
            border: '4px solid white',
          }}
        >
          <span style={{ color: 'white', fontSize: 40 }}>👤</span>
        </div>

        {/* タイトル（上部） */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#333',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {userName}さんの信頼ネットワーク
          </h1>
        </div>

        {/* 統計（下部） */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: 60,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#3B82F6' }}>
              {companyCount}
            </span>
            <span style={{ fontSize: 18, color: '#666' }}>企業</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 'bold', color: '#8B5CF6' }}>
              {connectionCount}
            </span>
            <span style={{ fontSize: 18, color: '#666' }}>つながり</span>
          </div>
        </div>

        {/* Bondロゴ */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16, color: '#999' }}>Powered by</span>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#E8B4B8' }}>Bond</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
