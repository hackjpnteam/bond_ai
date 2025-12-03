import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SharedList from '@/models/SharedList';

// GET /api/shared-lists/[id] - Get a specific shared list
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    const sharedList = await SharedList.findOne({
      _id: id,
      $or: [
        { ownerId: user.id },
        { sharedWith: user.id },
        { isPublic: true }
      ]
    })
      .populate('sharedWith', 'name email image')
      .lean();

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: 'Shared list not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sharedList: {
          id: sharedList._id.toString(),
          shareId: sharedList.shareId,
          title: sharedList.title,
          description: sharedList.description,
          tags: sharedList.tags,
          isPublic: sharedList.isPublic,
          ownerId: sharedList.ownerId.toString(),
          sharedWith: sharedList.sharedWith.map((u: any) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            image: u.image
          })),
          viewCount: sharedList.viewCount,
          createdAt: sharedList.createdAt,
          updatedAt: sharedList.updatedAt
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get shared list error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get shared list' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// PUT /api/shared-lists/[id] - Update a shared list
export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { title, description, tags, isPublic, sharedWith } = body;

    const sharedList = await SharedList.findOne({
      _id: id,
      ownerId: user.id
    });

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: 'Shared list not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (title) sharedList.title = title;
    if (description !== undefined) sharedList.description = description;
    if (tags) sharedList.tags = tags;
    if (isPublic !== undefined) sharedList.isPublic = isPublic;
    if (sharedWith) sharedList.sharedWith = sharedWith;

    await sharedList.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shared list updated',
        sharedList: {
          id: sharedList._id.toString(),
          shareId: sharedList.shareId,
          title: sharedList.title,
          description: sharedList.description,
          tags: sharedList.tags,
          isPublic: sharedList.isPublic,
          sharedWith: sharedList.sharedWith.map((id: any) => id.toString()),
          viewCount: sharedList.viewCount,
          createdAt: sharedList.createdAt,
          updatedAt: sharedList.updatedAt
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update shared list error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update shared list' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// DELETE /api/shared-lists/[id] - Delete a shared list
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    const sharedList = await SharedList.findOneAndDelete({
      _id: id,
      ownerId: user.id
    });

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: 'Shared list not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shared list deleted'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Delete shared list error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete shared list' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
