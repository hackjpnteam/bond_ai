import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'

async function seed() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db('bond-launch')
    
    await db.collection('companies').createIndex({ slug: 1 }, { unique: true })
    await db.collection('companies').createIndex({ 'trust.total': -1 })
    await db.collection('submissions').createIndex({ companyId: 1, status: 1 })
    await db.collection('submissions').createIndex({ createdAt: -1 })
    await db.collection('edges').createIndex({ companyId: 1 })
    await db.collection('edges').createIndex({ userId: 1 })
    console.log('Indexes created')
    
    const users = [
      {
        _id: new ObjectId(),
        authId: 'user-1',
        name: 'Alice Investor',
        email: 'alice@investor.com',
        image: 'https://i.pravatar.cc/150?img=1',
        roles: [],
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        authId: 'user-2',
        name: 'Bob Employee',
        email: 'bob@employee.com',
        image: 'https://i.pravatar.cc/150?img=2',
        roles: [],
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        authId: 'user-3',
        name: 'Charlie Founder',
        email: 'charlie@founder.com',
        image: 'https://i.pravatar.cc/150?img=3',
        roles: [],
        createdAt: new Date()
      }
    ]
    
    const companies = [
      {
        _id: new ObjectId(),
        name: 'TechStart AI',
        slug: 'techstart-ai',
        logoUrl: 'https://i.pravatar.cc/150?img=10',
        website: 'https://techstart.ai',
        category: ['AI', 'B2B SaaS'],
        stage: 'Seed' as const,
        createdAt: new Date(),
        publishedAt: new Date(),
        metrics: {
          nps: 72,
          mrr: 50000,
          growthRate3m: 35
        },
        trust: {
          total: 0,
          byRole: {}
        }
      },
      {
        _id: new ObjectId(),
        name: 'FinFlow',
        slug: 'finflow',
        logoUrl: 'https://i.pravatar.cc/150?img=11',
        website: 'https://finflow.com',
        category: ['FinTech', 'Payments'],
        stage: 'A' as const,
        createdAt: new Date(),
        publishedAt: new Date(),
        metrics: {
          nps: 85,
          mrr: 250000,
          growthRate3m: 20
        },
        trust: {
          total: 0,
          byRole: {}
        }
      }
    ]
    
    const submissions = [
      {
        _id: new ObjectId(),
        companyId: companies[0]._id,
        authorId: users[0]._id,
        role: 'Investor' as const,
        status: 'published' as const,
        comment: 'Exceptional AI team with deep domain expertise. The founders have a clear vision and strong execution capabilities.',
        metadata: {
          fundName: 'TechVentures',
          stage: 'Seed'
        },
        weight: 5,
        createdAt: new Date(),
        publishedAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: companies[0]._id,
        authorId: users[1]._id,
        role: 'Employee' as const,
        status: 'published' as const,
        comment: 'Amazing culture and brilliant colleagues. We are building something truly innovative here.',
        metadata: {
          employeeTitle: 'Senior Engineer',
          joinedYear: 2023
        },
        weight: 4,
        createdAt: new Date(),
        publishedAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: companies[0]._id,
        authorId: users[2]._id,
        role: 'Founder' as const,
        status: 'published' as const,
        comment: 'Proud to be building the future of AI-powered analytics with an incredible team.',
        metadata: {},
        weight: 3,
        createdAt: new Date(),
        publishedAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: companies[1]._id,
        authorId: users[0]._id,
        role: 'Advisor' as const,
        status: 'published' as const,
        comment: 'Strong product-market fit in the payments space. The team executes flawlessly.',
        metadata: {},
        weight: 2,
        createdAt: new Date(),
        publishedAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: companies[1]._id,
        authorId: users[1]._id,
        role: 'Customer' as const,
        status: 'draft' as const,
        comment: 'FinFlow has transformed our payment operations. Highly recommend for any growing business.',
        metadata: {
          customerPlan: 'Enterprise',
          startedAt: '2023-Q2'
        },
        weight: 3,
        createdAt: new Date()
      }
    ]
    
    const edges = [
      {
        _id: new ObjectId(),
        companyId: companies[0]._id,
        userId: users[0]._id,
        role: 'Investor' as const,
        weight: 5,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: companies[0]._id,
        userId: users[1]._id,
        role: 'Employee' as const,
        weight: 4,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: companies[0]._id,
        userId: users[2]._id,
        role: 'Founder' as const,
        weight: 3,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        companyId: companies[1]._id,
        userId: users[0]._id,
        role: 'Advisor' as const,
        weight: 2,
        createdAt: new Date()
      }
    ]
    
    await db.collection('users').deleteMany({})
    await db.collection('companies').deleteMany({})
    await db.collection('submissions').deleteMany({})
    await db.collection('edges').deleteMany({})
    
    await db.collection('users').insertMany(users)
    console.log(`Inserted ${users.length} users`)
    
    await db.collection('companies').insertMany(companies)
    console.log(`Inserted ${companies.length} companies`)
    
    await db.collection('submissions').insertMany(submissions)
    console.log(`Inserted ${submissions.length} submissions`)
    
    await db.collection('edges').insertMany(edges)
    console.log(`Inserted ${edges.length} edges`)
    
    await db.collection('companies').updateOne(
      { _id: companies[0]._id },
      { $set: { trust: { total: 12, byRole: { Investor: 5, Employee: 4, Founder: 3 } } } }
    )
    
    await db.collection('companies').updateOne(
      { _id: companies[1]._id },
      { $set: { trust: { total: 2, byRole: { Advisor: 2 } } } }
    )
    
    console.log('Trust scores updated')
    console.log('Seed completed successfully!')
    
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seed()