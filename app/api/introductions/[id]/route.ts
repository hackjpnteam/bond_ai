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

// Mock database - same as in the parent route
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { status, reason } = await request.json()
    
    if (!status || !['accepted', 'declined', 'completed'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be accepted, declined, or completed' 
      }, { status: 400 })
    }
    
    const introductionIndex = mockIntroductions.findIndex(intro => intro.id === id)
    
    if (introductionIndex === -1) {
      return NextResponse.json({ error: 'Introduction not found' }, { status: 404 })
    }
    
    const introduction = mockIntroductions[introductionIndex]
    
    // Update the introduction
    mockIntroductions[introductionIndex] = {
      ...introduction,
      status: status as Introduction['status'],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    
    // Log the action for audit purposes
    console.log(`Introduction ${id} status changed to ${status}`, reason ? `Reason: ${reason}` : '')
    
    return NextResponse.json({
      success: true,
      introduction: mockIntroductions[introductionIndex],
      message: `紹介を${status === 'accepted' ? '承認' : status === 'declined' ? '辞退' : '完了'}しました`
    })
  } catch (error) {
    console.error('Error updating introduction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const introduction = mockIntroductions.find(intro => intro.id === id)
    
    if (!introduction) {
      return NextResponse.json({ error: 'Introduction not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      introduction
    })
  } catch (error) {
    console.error('Error fetching introduction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}