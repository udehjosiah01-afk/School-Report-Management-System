import assert from 'node:assert/strict'
import test from 'node:test'
import type { ServerlessDrizzleClient } from 'drizzle-orm/netlify-db'
import { createCompatibleHttpClient } from './database.ts'

test('Neon HTTP client routes positional SQL calls through query()', async () => {
  const calls: unknown[][] = []
  const nativeClient = Object.assign(
    (_strings: TemplateStringsArray, ..._values: any[]) => Promise.resolve({ rows: [] }),
    {
      query: (query: string, params?: unknown[], options?: unknown) => {
        calls.push([query, params, options])
        return Promise.resolve({ rows: [] })
      },
      transaction: async () => [],
      unsafe: (query: string) => query,
    },
  ) as unknown as ServerlessDrizzleClient['httpClient']
  const client = createCompatibleHttpClient(nativeClient)
  const options = { arrayMode: false, fullResults: true }

  await client('SELECT $1', [42], options)

  assert.deepEqual(calls, [['SELECT $1', [42], options]])
})

test('Neon HTTP client continues to support tagged SQL calls', async () => {
  let taggedCall: unknown[] = []
  const nativeClient = Object.assign(
    (strings: TemplateStringsArray, ...values: any[]) => {
      taggedCall = [strings, ...values]
      return Promise.resolve({ rows: [] })
    },
    {
      query: async () => ({ rows: [] }),
      transaction: async () => [],
      unsafe: (query: string) => query,
    },
  ) as unknown as ServerlessDrizzleClient['httpClient']
  const client = createCompatibleHttpClient(nativeClient)
  const strings = Object.assign(['SELECT ', ''], { raw: ['SELECT ', ''] }) as unknown as TemplateStringsArray

  await client(strings, 42)

  assert.equal(taggedCall[0], strings)
  assert.equal(taggedCall[1], 42)
})
