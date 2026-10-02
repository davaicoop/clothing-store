import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function files(directory) {
  const entries=await readdir(directory,{withFileTypes:true});
  const groups=await Promise.all(entries.map(e=>e.isDirectory()?files(`${directory}/${e.name}`):[`${directory}/${e.name}`]));
  return groups.flat();
}
for(const file of (await files('apps/api')).filter(f=>f.endsWith('.js'))) {
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status){console.error(result.stderr);process.exit(result.status);}
}
console.log('All backend modules pass syntax checks.');
