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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving'
  console.log('[OGP Image] Fetching data for userId:', userId, 'from:', `${baseUrl}/api/trust-map/share/${userId}`)
  try {
    const res = await fetch(`${baseUrl}/api/trust-map/share/${userId}`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.log('[OGP Image] API returned error:', res.status)
      return null
    }
    const data = await res.json()
    console.log('[OGP Image] Received data:', { userName: data?.me?.name, companies: data?.companies?.length })
    return data
  } catch (error) {
    console.error('[OGP Image] Fetch error:', error)
    return null
  }
}

// 画像URLを絶対URLに変換
function getAbsoluteImageUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null
  if (imageUrl.includes('default')) return null
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bond.giving'
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`
  }
  return imageUrl
}

export default async function Image({ params }: { params: Promise<{ userId: string }> }) {
  // Next.js 15では params が Promise になっている
  const { userId } = await params
  console.log('[OGP Image] Generating image for userId:', userId)
  const data = await getUserData(userId)

  const userName = data?.me?.name || 'ユーザー'
  const userImage = data?.me?.imageUrl
  const companies = data?.companies || []
  const users = data?.users || []
  const companyCount = companies.length
  const connectionCount = users.length

  // 中心座標
  const centerX = 600
  const centerY = 315

  // ネットワークノードの位置を計算（全ノードを円周上に均等配置）
  const allNodes: any[] = []
  const totalNodes = Math.min(companyCount, 8) + Math.min(connectionCount, 4)
  const radius = 180

  // 企業ノード（最大8個）
  const maxCompanies = Math.min(companyCount, 8)
  for (let i = 0; i < maxCompanies; i++) {
    const angle = (i / totalNodes) * 2 * Math.PI - Math.PI / 2
    allNodes.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius * 0.7,
      type: 'company',
      data: companies[i],
    })
  }

  // ユーザーノード（最大4個）
  const maxUsers = Math.min(connectionCount, 4)
  for (let i = 0; i < maxUsers; i++) {
    const angle = ((maxCompanies + i) / totalNodes) * 2 * Math.PI - Math.PI / 2
    allNodes.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius * 0.7,
      type: 'user',
      data: users[i],
    })
  }

  // 中央ユーザーの画像URL
  const centerUserImageUrl = getAbsoluteImageUrl(userImage)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF5F8 0%, #FFFAF5 50%, #FFF5F8 100%)',
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
          {allNodes.map((node, i) => (
            <line
              key={`line-${i}`}
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              stroke={node.type === 'company' ? '#FF5E9E' : '#FF5E9E'}
              strokeWidth="3"
              strokeOpacity="0.5"
            />
          ))}
        </svg>

        {/* ノードを描画 */}
        {allNodes.map((node, i) => {
          const isCompany = node.type === 'company'
          const nodeSize = isCompany ? 70 : 60
          const imageUrl = getAbsoluteImageUrl(node.data?.imageUrl)

          return (
            <div
              key={`node-${i}`}
              style={{
                position: 'absolute',
                left: node.x - nodeSize / 2,
                top: node.y - nodeSize / 2,
                width: nodeSize,
                height: nodeSize,
                borderRadius: '50%',
                background: '#fff',
                border: isCompany ? '3px solid #3B82F6' : '3px solid #8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  width={nodeSize - 6}
                  height={nodeSize - 6}
                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                <div
                  style={{
                    width: nodeSize - 6,
                    height: nodeSize - 6,
                    borderRadius: '50%',
                    background: isCompany ? '#EBF5FF' : '#F3E8FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isCompany ? 28 : 24,
                  }}
                >
                  {isCompany ? '🏢' : '❤️'}
                </div>
              )}
            </div>
          )
        })}

        {/* ノードラベル */}
        {allNodes.map((node, i) => {
          const isCompany = node.type === 'company'
          const nodeSize = isCompany ? 70 : 60
          const label = isCompany
            ? (node.data?.id || node.data?.fullName || '').substring(0, 8)
            : (node.data?.name || '').substring(0, 6)

          return (
            <div
              key={`label-${i}`}
              style={{
                position: 'absolute',
                left: node.x - 50,
                top: node.y + nodeSize / 2 + 4,
                width: 100,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#333',
                  fontWeight: 600,
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.9)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {label}
              </span>
            </div>
          )
        })}

        {/* 中央のユーザーアイコン */}
        <div
          style={{
            position: 'absolute',
            left: centerX - 60,
            top: centerY - 60,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(255,94,158,0.4)',
            border: '4px solid #FF5E9E',
            overflow: 'hidden',
          }}
        >
          {centerUserImageUrl ? (
            <img
              src={centerUserImageUrl}
              width={110}
              height={110}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF5E9E 0%, #FF8AB5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                color: '#fff',
              }}
            >
              👤
            </div>
          )}
        </div>

        {/* 中央ユーザー名 */}
        <div
          style={{
            position: 'absolute',
            left: centerX - 80,
            top: centerY + 68,
            width: 160,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: '#333',
              fontWeight: 700,
              background: 'rgba(255,255,255,0.95)',
              padding: '4px 12px',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {userName}
          </span>
        </div>

        {/* タイトル（上部） */}
        <div
          style={{
            position: 'absolute',
            top: 30,
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
              fontSize: 42,
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
            bottom: 50,
            left: 0,
            right: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: 100,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 44, fontWeight: 'bold', color: '#3B82F6' }}>
              {companyCount}
            </span>
            <span style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>評価企業</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 44, fontWeight: 'bold', color: '#8B5CF6' }}>
              {connectionCount}
            </span>
            <span style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>つながり</span>
          </div>
        </div>

        {/* Bondロゴ */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13, color: '#999' }}>Powered by</span>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#FF5E9E' }}>Bond</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
