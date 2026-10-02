import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { config } from './config.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const embeddedPath = process.env.EMBEDDED_DB_PATH || '.local/postgres';
if (config.embedded && embeddedPath !== 'memory://') mkdirSync(dirname(embeddedPath), { recursive: true });

const database = config.embedded
  ? new PGlite(embeddedPath)
  : new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    });

// PGlite runs real PostgreSQL in-process for local setup and tests.
// Serialize all access to its single connection; production uses the pg pool.
let queued = Promise.resolve();
async function serialized(fn) {
  const previous = queued;
  let release;
  queued = new Promise(resolve => { release = resolve; });
  await previous;
  try { return await fn(); } finally { release(); }
}
export const query = (sql, params = []) => config.embedded
  ? serialized(() => database.query(sql, params))
  : database.query(sql, params);
export const execute = sql => config.embedded
  ? serialized(() => database.exec(sql))
  : database.query(sql);

export async function transaction(fn) {
  if (config.embedded) return serialized(() => database.transaction(fn));
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
export const closeDatabase = () => config.embedded ? database.close() : database.end();
