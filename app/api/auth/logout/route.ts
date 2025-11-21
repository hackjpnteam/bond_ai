import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserSession from '@/models/UserSession';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get session token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      const cookies = cookieHeader?.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      token = cookies?.['bond_session_token'];
    }
    
    if (token) {
      // Deactivate the session
      await UserSession.updateOne(
        { sessionToken: token },
        { isActive: false }
      );
    }
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'ログアウトしました'
    });
    
    // Clear the session cookie
    response.cookies.set('bond_session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'ログアウト処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}