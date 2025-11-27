/**
 * Trust Map シェア用 Open Graph 画像
 * - ユーザーの信頼ネットワークを動的に可視化したOGP画像を生成
 * - ユーザーアバター、企業ロゴを含む詳細なネットワーク図
 */
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
  const userImage = data?.me?.imageUrl
  const companies = data?.companies || []
  const users = data?.users || []
  const companyCount = companies.length
  const connectionCount = users.length

  // ネットワークノードの位置を計算（企業とユーザーを別々に配置）
  const companyNodes: any[] = []
  const userNodes: any[] = []
  const maxCompanies = Math.min(companyCount, 6)
  const maxUsers = Math.min(connectionCount, 4)

  // 企業ノード（上半分に配置）
  for (let i = 0; i < maxCompanies; i++) {
    const angle = (i / maxCompanies) * Math.PI - Math.PI / 2
    const radius = 170
    companyNodes.push({
      x: 600 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius * 0.8,
      company: companies[i],
    })
  }

  // ユーザーノード（下半分に配置）
  for (let i = 0; i < maxUsers; i++) {
    const angle = (i / maxUsers) * Math.PI + Math.PI / 2
    const radius = 150
    userNodes.push({
      x: 600 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius * 0.6,
      user: users[i],
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
          {/* 企業への線 */}
          {companyNodes.map((node, i) => (
            <line
              key={`company-${i}`}
              x1="600"
              y1="300"
              x2={node.x}
              y2={node.y}
              stroke="#3B82F6"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
          ))}
          {/* ユーザーへの線 */}
          {userNodes.map((node, i) => (
            <line
              key={`user-${i}`}
              x1="600"
              y1="300"
              x2={node.x}
              y2={node.y}
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
          ))}
        </svg>

        {/* 企業ノード */}
        {companyNodes.map((node, i) => (
          <div
            key={`company-${i}`}
            style={{
              position: 'absolute',
              left: node.x - 30,
              top: node.y - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#fff',
              border: '3px solid #3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(59,130,246,0.2)',
              overflow: 'hidden',
            }}
          >
            {node.company?.imageUrl && !node.company.imageUrl.includes('default') ? (
              <img
                src={node.company.imageUrl.startsWith('/')
                  ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving'}${node.company.imageUrl}`
                  : node.company.imageUrl}
                width={50}
                height={50}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#3B82F6', fontSize: 24 }}>🏢</span>
            )}
          </div>
        ))}

        {/* ユーザーノード */}
        {userNodes.map((node, i) => (
          <div
            key={`user-${i}`}
            style={{
              position: 'absolute',
              left: node.x - 25,
              top: node.y - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: '#fff',
              border: '3px solid #8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(139,92,246,0.2)',
              overflow: 'hidden',
            }}
          >
            {node.user?.imageUrl && !node.user.imageUrl.includes('default') ? (
              <img
                src={node.user.imageUrl.startsWith('/')
                  ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving'}${node.user.imageUrl}`
                  : node.user.imageUrl}
                width={44}
                height={44}
                style={{ objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              <span style={{ color: '#8B5CF6', fontSize: 20 }}>👤</span>
            )}
          </div>
        ))}

        {/* 中央のユーザーアイコン */}
        <div
          style={{
            position: 'absolute',
            left: 600 - 55,
            top: 300 - 55,
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(255,94,158,0.3)',
            border: '4px solid #FF5E9E',
            overflow: 'hidden',
          }}
        >
          {userImage && !userImage.includes('default') ? (
            <img
              src={userImage.startsWith('/')
                ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving'}${userImage}`
                : userImage}
              width={100}
              height={100}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span style={{ color: '#FF5E9E', fontSize: 50 }}>👤</span>
          )}
        </div>

        {/* タイトル（上部） */}
        <div
          style={{
            position: 'absolute',
            top: 35,
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
              fontSize: 44,
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
            bottom: 55,
            left: 0,
            right: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: 80,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 40, fontWeight: 'bold', color: '#3B82F6' }}>
              {companyCount}
            </span>
            <span style={{ fontSize: 16, color: '#666' }}>評価企業</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 40, fontWeight: 'bold', color: '#8B5CF6' }}>
              {connectionCount}
            </span>
            <span style={{ fontSize: 16, color: '#666' }}>つながり</span>
          </div>
        </div>

        {/* Bondロゴ */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            right: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14, color: '#999' }}>Powered by</span>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#FF5E9E' }}>Bond</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
