import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';

// POST: Add reply to evaluation
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
    const body = await request.json();
    const { content, isAnonymous = false } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Content must be 500 characters or less' }, { status: 400 });
    }

    await connectDB();

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const newReply = {
      userId: user.id,
      content: content.trim(),
      isAnonymous,
      createdAt: new Date()
    };

    if (!evaluation.replies) {
      evaluation.replies = [];
    }
    evaluation.replies.push(newReply);
    await evaluation.save();

    return NextResponse.json({
      success: true,
      reply: {
        ...newReply,
        user: isAnonymous ? null : {
          _id: user.id,
          name: user.name,
          image: user.image
        }
      },
      repliesCount: evaluation.replies.length
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get replies for evaluation
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

    const replies = evaluation.replies || [];

    // Get user info for non-anonymous replies
    const userIds = replies
      .filter((r: any) => !r.isAnonymous)
      .map((r: any) => r.userId);

    const users = await User.find({ _id: { $in: userIds } }).select('_id name image');
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const repliesWithUsers = replies.map((reply: any) => ({
      userId: reply.userId,
      content: reply.content,
      isAnonymous: reply.isAnonymous,
      createdAt: reply.createdAt,
      user: reply.isAnonymous ? null : userMap.get(reply.userId) || null
    }));

    return NextResponse.json({
      replies: repliesWithUsers,
      repliesCount: replies.length
    });
  } catch (error) {
    console.error('Error getting replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
