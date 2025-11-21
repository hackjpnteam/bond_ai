import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCollection(collection: string) {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB

  if (!uri || !dbName) {
    throw new Error('MONGODB_URI または MONGODB_DB が設定されていません')
  }

  const client = await MongoClient.connect(uri)
  return {
    client,
    col: client.db(dbName).collection(collection)
  }
}

export async function GET() {
  try {
    const { client, col } = await getCollection('evaluations')

    const total = await col.countDocuments({})
    const sample = await col
      .find({}, { projection: { _id: 0, userEmail: 1, company: 1, relationship: 1 } })
      .limit(10)
      .toArray()

    const duplicates = await col
      .aggregate([
        {
          $group: {
            _id: { userEmail: '$userEmail', company: '$company' },
            count: { $sum: 1 },
            relationships: { $addToSet: '$relationship' }
          }
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 20 }
      ])
      .toArray()

    const missing = await col
      .find(
        {
          $or: [{ relationship: { $exists: false } }, { relationship: null }]
        },
        { projection: { _id: 0, userEmail: 1, company: 1 } }
      )
      .limit(20)
      .toArray()

    await client.close()

    return NextResponse.json({
      total,
      sample,
      duplicates,
      missing
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'internal error' }, { status: 500 })
  }
}
