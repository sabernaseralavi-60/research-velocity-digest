// Downloads the latest database snapshot that the daily GitHub Action publishes and swaps it in atomically.
//   node scripts/sync_db.mjs            (exit 0 also when offline, if a local copy already exists)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const repo = process.env.SNAPSHOT_REPO || 'sabernaseralavi-60/research-velocity-digest';
const url = `https://github.com/${repo}/releases/download/data-latest/research_velocity.db.gz`;
const target = path.resolve(process.env.SQLITE_PATH || 'output/research_velocity.db');
const tmp = `${target}.download`;

fs.mkdirSync(path.dirname(target), { recursive: true });
try {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120_000) });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} (the first daily run may not have finished yet)`);
  await pipeline(Readable.fromWeb(res.body), zlib.createGunzip(), fs.createWriteStream(tmp));
  fs.renameSync(tmp, target);
  console.log(`database updated: ${target} (${(fs.statSync(target).size / 1e6).toFixed(1)} MB)`);
} catch (err) {
  fs.rmSync(tmp, { force: true });
  const have = fs.existsSync(target);
  console.error(`sync failed: ${err.message}. ${have ? 'Keeping the existing local copy.' : 'No local database yet.'}`);
  process.exit(have ? 0 : 1);
}
