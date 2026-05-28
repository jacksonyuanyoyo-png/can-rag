#!/usr/bin/env node
/**
 * API golden path: login -> create KB -> (minimal import skip if no file) -> conversation -> message
 */
const BASE = process.env.API_BASE_URL || 'http://localhost:8000'
const PREFIX = '/v1'
const EMAIL = process.env.TEST_EMAIL || 'admin@example.com'
const PASSWORD = process.env.TEST_PASSWORD || 'admin123'

let accessToken = ''
let cookieJar = ''

function log(step, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`[${mark}] ${step}${detail ? ` — ${detail}` : ''}`)
}

async function parse(res) {
  const text = await res.text()
  try {
    return { json: JSON.parse(text), text }
  } catch {
    return { json: null, text }
  }
}

function authHeaders(extra = {}) {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json', ...extra }
  if (accessToken) h.Authorization = `Bearer ${accessToken}`
  return h
}

async function request(method, path, { body, useCookie = false } = {}) {
  const headers = authHeaders()
  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)
  if (useCookie && cookieJar) opts.headers.Cookie = cookieJar

  const res = await fetch(`${BASE}${PREFIX}${path}`, opts)
  const setCookie = res.headers.getSetCookie?.() || []
  if (setCookie.length) cookieJar = setCookie.map((c) => c.split(';')[0]).join('; ')

  const { json, text } = await parse(res)
  return { res, json, text }
}

async function main() {
  console.log(`\n=== Golden path API test @ ${BASE}${PREFIX} ===\n`)

  // 1. Login
  const login = await request('POST', '/auth/login', {
    body: { email: EMAIL, password: PASSWORD },
    useCookie: true,
  })
  if (!login.res.ok || !login.json?.data?.accessToken) {
    log('POST /auth/login', false, `${login.res.status} ${login.text?.slice(0, 200)}`)
    process.exit(1)
  }
  accessToken = login.json.data.accessToken
  log('POST /auth/login', true, `requestId=${login.json.requestId}`)

  // 2. Me
  const me = await request('GET', '/auth/me')
  log('GET /auth/me', me.res.ok && !!me.json?.data?.id, me.json?.requestId)

  // 3. Models
  const models = await request('GET', '/models')
  const modelId = models.json?.data?.[0]?.id
  log('GET /v1/models', models.res.ok && !!modelId, modelId || 'no models')

  // 4. Create KB
  const kbName = `e2e-kb-${Date.now()}`
  const createKb = await request('POST', '/knowledge-bases', {
    body: {
      name: kbName,
      description: 'golden path test',
      embeddingModelId: modelId || 'multilingual-embedding',
      scope: 'personal',
      visibility: 'private',
    },
  })
  const kbId = createKb.json?.data?.id
  if (!createKb.res.ok || !kbId) {
    log('POST /knowledge-bases', false, createKb.text?.slice(0, 300))
    process.exit(1)
  }
  log('POST /knowledge-bases', true, `kbId=${kbId}`)

  // 5. KB detail + index-stats
  const kbDetail = await request('GET', `/knowledge-bases/${kbId}`)
  log('GET /knowledge-bases/{id}', kbDetail.res.ok, kbDetail.json?.requestId)

  const stats = await request('GET', `/knowledge-bases/${kbId}/index-stats`)
  log('GET /knowledge-bases/{id}/index-stats', stats.res.ok, stats.json?.data?.status)

  // 6. List KB files (empty ok)
  const files = await request('GET', `/knowledge-bases/${kbId}/files?page=1&pageSize=10`)
  log('GET /knowledge-bases/{id}/files', files.res.ok, `total=${files.json?.pagination?.total ?? 0}`)

  // 7. Conversations
  const conv = await request('POST', '/conversations', {
    body: { title: 'Golden path chat', folder: null, pinned: false },
  })
  const convId = conv.json?.data?.id
  if (!conv.res.ok || !convId) {
    log('POST /conversations', false, conv.text?.slice(0, 300))
    process.exit(1)
  }
  log('POST /conversations', true, `convId=${convId}`)

  // 8. Send message (non-streaming)
  const msg = await request('POST', `/conversations/${convId}/messages`, {
    body: { content: 'Hello from golden path test', modelId: modelId || 'gpt-5' },
  })
  const assistantId = msg.json?.data?.assistantMessage?.id
  log(
    'POST /conversations/{id}/messages',
    msg.res.ok && !!assistantId,
    assistantId ? `assistant=${assistantId}` : msg.text?.slice(0, 200),
  )

  // 9. List messages
  const msgs = await request('GET', `/conversations/${convId}/messages?page=1&pageSize=50`)
  log('GET /conversations/{id}/messages', msgs.res.ok, `count=${msgs.json?.data?.length ?? 0}`)

  // 10. SSE stream (short probe)
  if (process.env.SKIP_SSE !== '1') {
    try {
      const streamRes = await fetch(`${BASE}${PREFIX}/conversations/${convId}/messages:stream`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          content: 'SSE probe',
          modelId: modelId || 'gpt-5',
          knowledgeBaseIds: [kbId],
        }),
      })
      const okStream = streamRes.ok
      const reader = streamRes.body?.getReader()
      let chunks = ''
      if (reader) {
        const { value } = await reader.read()
        if (value) chunks = new TextDecoder().decode(value)
        reader.cancel().catch(() => {})
      }
      log(
        'POST /conversations/{id}/messages:stream',
        okStream,
        okStream ? `firstBytes=${chunks.slice(0, 80).replace(/\n/g, ' ')}` : `status=${streamRes.status}`,
      )
    } catch (e) {
      log('POST /conversations/{id}/messages:stream', false, String(e.message))
    }
  }

  // 11. Logout
  const logout = await request('POST', '/auth/logout', { body: {}, useCookie: true })
  log('POST /auth/logout', logout.res.ok, logout.json?.requestId)

  console.log('\n=== Done ===\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
