import { NextRequest, NextResponse } from 'next/server'

interface Introduction {
  id: string
  fromUser: string
  toUser: string
  targetCompany: string
  message: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  createdAt: string
  updatedAt: string
}

// Mock database - in production this would be a real database
let mockIntroductions: Introduction[] = [
  {
    id: '1',
    fromUser: '田中 太郎',
    toUser: 'あなた',
    targetCompany: 'Google',
    message: 'Googleのエンジニアリングマネージャーの山田さんをご紹介したいと思います。AIプロジェクトについて相談されたいとのことでした。',
    status: 'pending',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    fromUser: '佐藤 花子',
    toUser: 'あなた',
    targetCompany: 'Microsoft',
    message: 'Microsoftのプロダクトマネージャーの鈴木さんとお話しされたいということでしたので、ご紹介させていただきます。',
    status: 'accepted',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-12'
  },
  {
    id: '3',
    fromUser: 'あなた',
    toUser: '山田 次郎',
    targetCompany: 'Tesla',
    message: 'Teslaの自動運転チームで働いている友人をご紹介していただけませんか？技術的な質問をしたいと思っています。',
    status: 'completed',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14'
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      introductions: mockIntroductions
    })
  } catch (error) {
    console.error('Error fetching introductions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fromUser, toUser, targetCompany, message } = await request.json()
    
    if (!fromUser || !toUser || !targetCompany || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const newIntroduction: Introduction = {
      id: (mockIntroductions.length + 1).toString(),
      fromUser,
      toUser,
      targetCompany,
      message,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    
    mockIntroductions.push(newIntroduction)
    
    return NextResponse.json({
      success: true,
      introduction: newIntroduction
    })
  } catch (error) {
    console.error('Error creating introduction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}