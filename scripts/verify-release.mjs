import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const base = process.env.SITE_URL || 'https://shinjukugyoensimulate.web.app';
const expected = JSON.parse(await readFile('dist/release.json','utf8'));
let error;
for (let attempt=0; attempt<6; attempt++) {
  try {
    const result = await fetch(`${base}/release.json?commit=${expected.commit}`,{cache:'no-store'});
    if (!result.ok) throw new Error(`release.json: ${result.status}`);
    const actual = await result.json();
    if (actual.commit !== expected.commit) throw new Error('The deployed commit does not match.');
    for (const [file,hash] of Object.entries(expected.assets)) {
      const response = await fetch(`${base}/${file}`,{cache:'no-store'});
      if (!response.ok) throw new Error(`${file}: ${response.status}`);
      const digest = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
      if (digest !== hash) throw new Error(`Checksum mismatch: ${file}`);
    }
    console.log(`Verified ${actual.commit}: ${Object.keys(expected.assets).length} deployed files.`);
    process.exit(0);
  } catch (cause) { error=cause; if (attempt<5) await new Promise(resolve=>setTimeout(resolve,5000)); }
}
throw error;
