import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getDb } from '@/lib/db'
import { RatingDoc, CompanyDoc } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, rating, comment, role } = await request.json()

    if (!companyId || !rating || rating < 1 || rating > 5 || !role) {
      return NextResponse.json(
        { error: 'Invalid rating data' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const userId = new ObjectId(session.user.id)
    const companyObjId = new ObjectId(companyId)

    // Check if user already rated this company
    const existingRating = await db.collection<RatingDoc>('ratings').findOne({
      companyId: companyObjId,
      userId
    })

    if (existingRating) {
      // Update existing rating
      await db.collection<RatingDoc>('ratings').updateOne(
        { _id: existingRating._id },
        { 
          $set: { 
            rating, 
            comment,
            role,
            updatedAt: new Date() 
          }
        }
      )
    } else {
      // Create new rating
      await db.collection<RatingDoc>('ratings').insertOne({
        _id: new ObjectId(),
        companyId: companyObjId,
        userId,
        rating,
        comment,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Update company's average rating
    const ratings = await db.collection<RatingDoc>('ratings')
      .find({ companyId: companyObjId })
      .toArray()

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    
    await db.collection<CompanyDoc>('companies').updateOne(
      { _id: companyObjId },
      { 
        $set: { 
          rating: avgRating,
          totalRatings: ratings.length 
        }
      }
    )

    return NextResponse.json({ 
      success: true,
      rating: avgRating,
      totalRatings: ratings.length 
    })
  } catch (error) {
    console.error('Rating error:', error)
    return NextResponse.json(
      { error: 'Failed to save rating' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const ratings = await db.collection<RatingDoc>('ratings')
      .aggregate([
        { $match: { companyId: new ObjectId(companyId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            rating: 1,
            comment: 1,
            role: 1,
            createdAt: 1,
            'user.name': 1,
            'user.image': 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 50 }
      ])
      .toArray()

    return NextResponse.json(ratings)
  } catch (error) {
    console.error('Get ratings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}