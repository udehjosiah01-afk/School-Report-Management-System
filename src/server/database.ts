import { getDatabase } from '@netlify/database'
import { drizzle } from 'drizzle-orm/netlify-db'
import type { ServerlessDrizzleClient } from 'drizzle-orm/netlify-db'

type NeonHttpClient = ServerlessDrizzleClient['httpClient']
type NeonHttpQueryOptions = Parameters<NeonHttpClient['query']>[2]
type NeonHttpQueryParameters = Parameters<NeonHttpClient['query']>[1]
type NeonHttpQueryResult = ReturnType<NeonHttpClient['query']>
type CompatibleNeonHttpClient = NeonHttpClient & {
  (query: string, params?: NeonHttpQueryParameters, options?: NeonHttpQueryOptions): NeonHttpQueryResult
}

export function createCompatibleHttpClient(client: NeonHttpClient): CompatibleNeonHttpClient {
  function compatibleQuery(strings: TemplateStringsArray, ...values: any[]): NeonHttpQueryResult
  function compatibleQuery(
    query: string,
    params?: NeonHttpQueryParameters,
    options?: NeonHttpQueryOptions,
  ): NeonHttpQueryResult
  function compatibleQuery(
    strings: TemplateStringsArray | string,
    ...values: any[]
  ): NeonHttpQueryResult {
    if (typeof strings === 'string') {
      return client.query(strings, values[0], values[1])
    }
    return client(strings, ...values)
  }

  return Object.assign(compatibleQuery, {
    query: client.query.bind(client),
    transaction: client.transaction.bind(client),
    unsafe: client.unsafe.bind(client),
  })
}

export function getDb() {
  const database = getDatabase()
  return database.driver === 'serverless'
    ? drizzle({
        client: {
          ...database,
          httpClient: createCompatibleHttpClient(database.httpClient),
        },
      })
    : drizzle({
        client: {
          driver: 'server',
          pool: database.pool,
          connectionString: database.connectionString,
        },
      })
}
