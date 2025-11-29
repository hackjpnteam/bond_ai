import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';

// POST: Add like on evaluation (no auth required, can like multiple times)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    // Always increment likes count (no toggle, no user check)
    const currentCount = evaluation.likesCount || evaluation.likes?.length || 0;
    evaluation.likesCount = currentCount + 1;

    // Keep likes array for backward compatibility but don't require it
    if (!evaluation.likes) {
      evaluation.likes = [];
    }

    await evaluation.save();

    return NextResponse.json({
      success: true,
      liked: true,
      likesCount: evaluation.likesCount
    });
  } catch (error) {
    console.error('Error adding like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get like count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const likesCount = evaluation.likesCount || evaluation.likes?.length || 0;

    return NextResponse.json({
      likesCount,
      hasLiked: false
    });
  } catch (error) {
    console.error('Error getting like status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
