import dns from 'dns'
import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

dns.setServers(['8.8.8.8', '1.1.1.1'])

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  family: 4
} as const

const KEY_CANDIDATES = [
  'relationship',
  'relationshipType',
  'relation',
  'category',
  'relType',
  'role',
  'kind',
  'label',
  'status',
  'relationType',
  'relationship_status',
  'rel',
  'relLabel',
  'type',
  'typeName',
  'categoryName',
  'group',
  'segment',
  'tag',
  'tags',
  'value',
  'relationship_value',
  'relationshipLabel',
  'meta.relationship',
  'meta.type'
] as const

const STRING_TO_VALUE: Record<string, number> = {
  投資家: 4,
  investor: 4,
  協業先: 3,
  partner: 3,
  取引先: 2,
  client: 2,
  知人: 1,
  friend: 1,
  その他: 0,
  other: 0,
  未設定: 0,
  unassigned: 0,
  unset: 0,
  unknown: 0,
  none: 0
}

const VALUE_TO_LABEL: Record<number, string> = {
  4: '投資家',
  3: '協業先',
  2: '取引先',
  1: '知人',
  0: '未設定'
}

const LABEL_KEYS = [
  'relationshipLabel',
  'label',
  'relLabel',
  'type',
  'typeName',
  'category',
  'categoryName',
  'role',
  'kind',
  'status',
  'relation',
  'relationType',
  'relationshipType',
  'group',
  'segment',
  'displayLabel'
] as const

const VALUE_KEYS = [
  'relationshipValue',
  'relationship',
  'companyRelationships',
  'value',
  'relationship_value'
] as const

interface DebugInfo {
  usedKey: string | null
  raw: unknown
  parsed: number | null
  reason: string | null
}

interface ConnectionInfo {
  method: 'std' | 'srv' | null
  ok: boolean
  error: string
}

class ConnectionError extends Error {
  constructor(message: string, public readonly conn: ConnectionInfo) {
    super(message)
  }
}

let cachedClient: MongoClient | null = null
let cachedConn: ConnectionInfo | null = null

function summarizeError(error: unknown) {
  if (!error) return ''
  const message = typeof error === 'string' ? error : (error as any)?.message ?? String(error)
  return message.split('\n')[0]
}

async function connectWithUri(uri: string, method: 'std' | 'srv'): Promise<MongoClient> {
  const client = new MongoClient(uri, CONNECTION_OPTIONS)
  try {
    await client.connect()
    const dbName = process.env.MONGODB_DB
    if (!dbName) {
      throw new ConnectionError('MONGODB_DB is not set', { method, ok: false, error: 'MONGODB_DB is not set' })
    }
    await client.db(dbName).command({ ping: 1 })
    cachedClient = client
    cachedConn = { method, ok: true, error: '' }
    return client
  } catch (error) {
    const info: ConnectionInfo = { method, ok: false, error: summarizeError(error) }
    await client.close().catch(() => {})
    throw new ConnectionError(info.error || 'connection failed', info)
  }
}

async function getClient(forceStd: boolean) {
  if (cachedClient) {
    return { client: cachedClient, conn: cachedConn ?? { method: null, ok: true, error: '' } }
  }

  const stdUri = process.env.MONGODB_URI_STD?.trim()
  const srvUri = process.env.MONGODB_URI?.trim()
  const preferStd = forceStd || process.env.MONGODB_PREFER_STD === '1'

  if (stdUri) {
    return { client: await connectWithUri(stdUri, 'std'), conn: cachedConn! }
  }

  if (!stdUri && srvUri && !preferStd) {
    return { client: await connectWithUri(srvUri, 'srv'), conn: cachedConn! }
  }

  throw new ConnectionError('No MongoDB URI configured', {
    method: stdUri ? 'std' : srvUri ? 'srv' : null,
    ok: false,
    error: 'missing_connection_string'
  })
}

function normalizeRawValue(raw: unknown) {
  if (Array.isArray(raw)) return raw.length ? raw[0] : null
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>
    if ('value' in record || 'label' in record) {
      return record.value ?? record.label ?? null
    }
  }
  return raw
}

function parseRelationshipValue(raw: unknown) {
  const normalized = normalizeRawValue(raw)
  if (normalized === null || normalized === undefined) return { parsed: null, reason: 'NO_MATCH_FIELDS' }
  if (typeof normalized === 'number' && !Number.isNaN(normalized)) return { parsed: normalized, reason: null }
  if (typeof normalized === 'string') {
    const trimmed = normalized.trim()
    if (!trimmed) return { parsed: null, reason: 'EMPTY_STRING' }
    if (!Number.isNaN(Number(trimmed))) return { parsed: Number(trimmed), reason: null }
    const lower = trimmed.toLowerCase()
    if (STRING_TO_VALUE.hasOwnProperty(trimmed)) return { parsed: STRING_TO_VALUE[trimmed], reason: null }
    if (STRING_TO_VALUE.hasOwnProperty(lower)) return { parsed: STRING_TO_VALUE[lower], reason: null }
    return { parsed: null, reason: `UNRECOGNIZED_STRING:${trimmed}` }
  }
  return { parsed: null, reason: 'UNSUPPORTED_TYPE' }
}

function deriveRelationship(doc: Record<string, unknown>) {
  const debug: DebugInfo = { usedKey: null, raw: null, parsed: null, reason: 'NO_MATCH_FIELDS' }
  for (const key of KEY_CANDIDATES) {
    const raw = key.includes('.')
      ? key.split('.').reduce((acc: any, part) => (acc ? acc[part] : undefined), doc)
      : doc[key]
    if (raw !== undefined) {
      debug.usedKey = key
      debug.raw = raw
      const { parsed, reason } = parseRelationshipValue(raw)
      debug.parsed = parsed
      debug.reason = reason
      if (parsed !== null) {
        return { value: parsed, debug }
      }
    }
  }
  return { value: null, debug }
}

function buildPayload(value: number | null) {
  const label = value === null ? 'その他' : VALUE_TO_LABEL[value] ?? 'その他'
  const numerics = VALUE_KEYS.reduce<Record<string, number | null>>((acc, key) => {
    acc[key] = value
    return acc
  }, {})
  const labels = LABEL_KEYS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = label
    return acc
  }, {})
  return { label, numerics, labels }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const debugMode = url.searchParams.get('debug') === '1'
  const forceStd = url.searchParams.get('forceStd') === '1'
  const responseHeaders = { headers: { 'cache-control': 'no-store' as const } }

  let connInfo: ConnectionInfo | null = null

  try {
    const { client, conn } = await getClient(forceStd)
    connInfo = conn

    const dbName = process.env.MONGODB_DB
    if (!dbName) {
      throw new ConnectionError('MONGODB_DB is not set', { method: conn.method, ok: false, error: 'MONGODB_DB is not set' })
    }

    const projection: Record<string, number> = { _id: 0, userEmail: 1, company: 1, comment: 1 }
    KEY_CANDIDATES.forEach((key) => {
      const root = key.split('.')[0]
      projection[root] = 1
    })

    const rows = await client
      .db(dbName)
      .collection('evaluations')
      .find({ userEmail: { $exists: true }, company: { $exists: true } }, { projection })
      .limit(5000)
      .toArray()

    const data = rows.map((row) => {
      const { value, debug } = deriveRelationship(row as Record<string, unknown>)
      const payload = buildPayload(value)
      const result: Record<string, unknown> = {
        userEmail: (row as any).userEmail ?? null,
        company: (row as any).company ?? null,
        ...payload.numerics,
        ...payload.labels
      }
      if (debugMode) {
        result._debug = debug
      }
      return result
    })

    const body: Record<string, unknown> = { count: data.length, data }
    if (debugMode) {
      body._conn = connInfo
    }

    return NextResponse.json(body, responseHeaders)
  } catch (error: any) {
    const info: ConnectionInfo = error instanceof ConnectionError
      ? error.conn
      : connInfo || { method: null, ok: false, error: summarizeError(error) }

    const body: Record<string, unknown> = {
      error: error?.message || 'internal error',
      _conn: info
    }

    return NextResponse.json(body, { status: 500, ...responseHeaders })
  }
}
