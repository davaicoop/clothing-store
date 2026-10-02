import { app } from './app.js';
import { config } from './config.js';
import { migrate } from '../scripts/migrate.js';
import { seed } from '../scripts/seed.js';
import { closeDatabase } from './db.js';

if(process.env.AUTO_MIGRATE!=='false') await migrate();
await seed();
const server=app.listen(config.port,'0.0.0.0',()=>console.log(`Clothing Store listening on port ${config.port}`));
let closing=false;
async function shutdown() {
  if(closing) return; closing=true;
  const timeout=setTimeout(()=>process.exit(1),10000);timeout.unref();
  server.close(async()=>{await closeDatabase();clearTimeout(timeout);process.exit(0);});
}
process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);
