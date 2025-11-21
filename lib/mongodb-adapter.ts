import type { Adapter, AdapterAccount } from 'next-auth/adapters'
import type { MongoClient, Db, Collection, Document, WithId } from 'mongodb'
import { ObjectId } from 'mongodb'

type CollectionNames = {
  Users: string
  Accounts: string
  Sessions: string
  VerificationTokens: string
}

type AdapterOptions = {
  databaseName?: string
  collections?: Partial<CollectionNames>
}

type MongoClientLike =
  | MongoClient
  | Promise<MongoClient>
  | (() => MongoClient | Promise<MongoClient>)

const defaultCollections: CollectionNames = {
  Users: 'users',
  Accounts: 'accounts',
  Sessions: 'sessions',
  VerificationTokens: 'verification_tokens',
}

const objectId = (value?: string | null) =>
  value ? new ObjectId(value) : new ObjectId()

const fromDoc = <T extends Document>(doc: WithId<T> | null) => {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: _id.toString(), ...rest } as any
}

const sessionFromDoc = (doc: WithId<Document>) => {
  const { _id, userId, ...rest } = doc
  return {
    id: _id?.toString(),
    userId: userId?.toString(),
    ...rest,
  } as any
}

async function resolveClient(client: MongoClientLike) {
  if (typeof client === 'function') {
    return client()
  }
  return client
}

export function MongoDBAdapter(
  client: MongoClientLike,
  options: AdapterOptions = {}
): Adapter {
  const dbName = options.databaseName ?? 'bond-launch'
  const collectionNames = { ...defaultCollections, ...options.collections }

  const getDb = async (): Promise<Db> => {
    const resolved = await resolveClient(client)
    return resolved.db(dbName)
  }

  const getCollection = async <T extends Document = Document>(
    key: keyof CollectionNames
  ): Promise<Collection<T>> => {
    const db = await getDb()
    return db.collection<T>(collectionNames[key])
  }

  return {
    async createUser(data) {
      const users = await getCollection('Users')
      const userId = objectId(data.id)
      const document = { ...data, _id: userId }
      delete (document as any).id
      await users.insertOne(document as Document)
      return fromDoc(document as WithId<Document>)
    },

    async getUser(id) {
      const users = await getCollection('Users')
      const user = await users.findOne({ _id: objectId(id) })
      return fromDoc(user)
    },

    async getUserByEmail(email) {
      const users = await getCollection('Users')
      const user = await users.findOne({ email })
      return fromDoc(user)
    },

    async getUserByAccount(
      account: Pick<AdapterAccount, 'provider' | 'providerAccountId'>
    ) {
      const accounts = await getCollection('Accounts')
      const dbAccount = await accounts.findOne({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      })
      if (!dbAccount) return null
      const users = await getCollection('Users')
      const user = await users.findOne({ _id: (dbAccount as any).userId })
      return fromDoc(user)
    },

    async updateUser(data) {
      const users = await getCollection('Users')
      const { id, ...rest } = data
      if (!id) throw new Error('User id is required to update user')
      await users.updateOne({ _id: objectId(id) }, { $set: rest })
      const updated = await users.findOne({ _id: objectId(id) })
      return fromDoc(updated)!
    },

    async deleteUser(id) {
      const users = await getCollection('Users')
      const accounts = await getCollection('Accounts')
      const sessions = await getCollection('Sessions')
      await Promise.all([
        users.deleteOne({ _id: objectId(id) }),
        accounts.deleteMany({ userId: objectId(id) }),
        sessions.deleteMany({ userId: objectId(id) }),
      ])
    },

    async linkAccount(account) {
      const accounts = await getCollection('Accounts')
      const document = {
        ...account,
        userId: objectId(account.userId),
      }
      await accounts.insertOne(document as Document)
      return account
    },

    async unlinkAccount(account) {
      const accounts = await getCollection('Accounts')
      await accounts.deleteOne({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      })
    },

    async createSession(session) {
      const sessions = await getCollection('Sessions')
      const document = {
        ...session,
        _id: objectId(session.id),
        userId: objectId(session.userId),
      }
      delete (document as any).id
      await sessions.insertOne(document as Document)
      return sessionFromDoc(document as WithId<Document>)
    },

    async getSessionAndUser(sessionToken) {
      const sessions = await getCollection('Sessions')
      const users = await getCollection('Users')
      const session = await sessions.findOne({ sessionToken })
      if (!session) return null
      const user = await users.findOne({ _id: (session as any).userId })
      if (!user) return null
      return {
        session: sessionFromDoc(session as WithId<Document>),
        user: fromDoc(user)!,
      }
    },

    async updateSession(session) {
      const sessions = await getCollection('Sessions')
      await sessions.updateOne(
        { sessionToken: session.sessionToken },
        { $set: session }
      )
      const updated = await sessions.findOne({
        sessionToken: session.sessionToken,
      })
      return updated ? sessionFromDoc(updated as WithId<Document>) : null
    },

    async deleteSession(sessionToken) {
      const sessions = await getCollection('Sessions')
      await sessions.deleteOne({ sessionToken })
    },

    async createVerificationToken(token) {
      const tokens = await getCollection('VerificationTokens')
      await tokens.insertOne(token as Document)
      return token
    },

    async useVerificationToken(params) {
      const tokens = await getCollection('VerificationTokens')
      const result = await tokens.findOneAndDelete({
        identifier: params.identifier,
        token: params.token,
      })
      if (!result.value) return null
      const { _id, ...rest } = result.value
      return rest as any
    },
  }
}

export default MongoDBAdapter
