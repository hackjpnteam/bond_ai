import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';

// POST: Toggle like on evaluation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const userId = user.id;
    const likes = evaluation.likes || [];
    const hasLiked = likes.includes(userId);

    if (hasLiked) {
      // Unlike
      evaluation.likes = likes.filter((likeId: string) => likeId !== userId);
    } else {
      // Like
      evaluation.likes = [...likes, userId];
    }

    await evaluation.save();

    return NextResponse.json({
      success: true,
      liked: !hasLiked,
      likesCount: evaluation.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get like status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession(request);
    const { id } = await params;

    await connectDB();

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const likes = evaluation.likes || [];
    const hasLiked = user ? likes.includes(user.id) : false;

    return NextResponse.json({
      likesCount: likes.length,
      hasLiked
    });
  } catch (error) {
    console.error('Error getting like status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
