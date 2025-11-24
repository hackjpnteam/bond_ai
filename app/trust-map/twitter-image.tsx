import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = '信頼ネットワーク - Bond'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
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
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.1,
          }}
        >
          <svg width="600" height="600" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#E8B4B8" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#E8B4B8" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="#E8B4B8" strokeWidth="0.5" />
            <circle cx="50" cy="20" r="5" fill="#E8B4B8" />
            <circle cx="80" cy="50" r="5" fill="#E8B4B8" />
            <circle cx="50" cy="80" r="5" fill="#E8B4B8" />
            <circle cx="20" cy="50" r="5" fill="#E8B4B8" />
            <circle cx="35" cy="25" r="3" fill="#D4A5A5" />
            <circle cx="75" cy="35" r="3" fill="#D4A5A5" />
            <circle cx="65" cy="75" r="3" fill="#D4A5A5" />
            <circle cx="25" cy="65" r="3" fill="#D4A5A5" />
          </svg>
        </div>

        {/* Bond Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E8B4B8 0%, #D4A5A5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(232, 180, 184, 0.3)',
            }}
          >
            <span style={{ color: 'white', fontSize: 36, fontWeight: 'bold' }}>B</span>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: '#333',
            margin: 0,
            marginBottom: 16,
          }}
        >
          信頼ネットワーク
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 28,
            color: '#666',
            margin: 0,
            marginBottom: 40,
          }}
        >
          Trust Network
        </p>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 24, color: '#999' }}>Powered by</span>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: '#E8B4B8' }}>Bond</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
