import { getDatabase } from '@netlify/database'
import { drizzle } from 'drizzle-orm/netlify-db'

export function getDb() {
  const database = getDatabase()
  return database.driver === 'serverless'
    ? drizzle({ client: database })
    : drizzle({
        client: {
          driver: 'server',
          pool: database.pool,
          connectionString: database.connectionString,
        },
      })
}
