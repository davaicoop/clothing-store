import { readdir, readFile } from 'node:fs/promises';
import { execute, query, transaction, closeDatabase } from '../src/db.js';
import { pathToFileURL } from 'node:url';

export async function migrate() {
  await execute('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const files = (await readdir(new URL('../migrations/', import.meta.url))).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    if ((await query('SELECT version FROM schema_migrations WHERE version=$1', [file])).rows.length) continue;
    const sql = await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8');
    await transaction(async client => {
      // pg and PGlite both accept the migration as a multi-statement batch.
      if (client.exec) await client.exec(sql); else await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [file]);
    });
    console.log(`Applied migration ${file}`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await migrate();
  await closeDatabase();
}
