import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SharedList from '@/models/SharedList';
import User from '@/models/User';

// POST /api/shared-lists/[id]/invite - ユーザーを招待（メールアドレス、ユーザーID、または名前検索）
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // /api/shared-lists/[id]/invite

    const body = await request.json();
    const { email, userId } = body;

    if (!email && !userId) {
      return new Response(
        JSON.stringify({ error: 'メールアドレスまたはユーザーIDを指定してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 共有リストを取得（オーナーのみ招待可能）
    const sharedList = await SharedList.findOne({
      _id: id,
      ownerId: user.id
    });

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: '共有リストが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let invitedUser;

    // ユーザーIDが指定されている場合はIDで検索
    if (userId) {
      invitedUser = await User.findById(userId);
    } else if (email) {
      // メールアドレスでユーザーを検索
      invitedUser = await User.findOne({ email: email.trim().toLowerCase() });
    }

    if (!invitedUser) {
      return new Response(
        JSON.stringify({
          error: 'ユーザーが見つかりません',
          notFound: true
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 自分自身は招待できない
    if (invitedUser._id.toString() === user.id) {
      return new Response(
        JSON.stringify({ error: '自分自身を招待することはできません' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 既に招待済みかチェック
    const alreadyShared = sharedList.sharedWith.some(
      (id: any) => id.toString() === invitedUser._id.toString()
    );

    if (alreadyShared) {
      return new Response(
        JSON.stringify({ error: 'このユーザーは既に招待済みです' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 招待リストに追加
    sharedList.sharedWith.push(invitedUser._id);
    await sharedList.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${invitedUser.name || invitedUser.email}を招待しました`,
        invitedUser: {
          id: invitedUser._id.toString(),
          name: invitedUser.name,
          email: invitedUser.email,
          image: invitedUser.image
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Invite to shared list error:', error);
    return new Response(
      JSON.stringify({ error: '招待に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// DELETE /api/shared-lists/[id]/invite - 招待を取り消し
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ユーザーIDが必要です' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const sharedList = await SharedList.findOne({
      _id: id,
      ownerId: user.id
    });

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: '共有リストが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 招待リストから削除
    sharedList.sharedWith = sharedList.sharedWith.filter(
      (id: any) => id.toString() !== userId
    );
    await sharedList.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: '招待を取り消しました'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Remove invite error:', error);
    return new Response(
      JSON.stringify({ error: '招待の取り消しに失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// GET /api/shared-lists/[id]/invite - 招待済みユーザー一覧を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    const sharedList = await SharedList.findOne({
      _id: id,
      ownerId: user.id
    }).populate('sharedWith', 'name email image');

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: '共有リストが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitedUsers: sharedList.sharedWith.map((u: any) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          image: u.image
        }))
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get invited users error:', error);
    return new Response(
      JSON.stringify({ error: '招待済みユーザーの取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
