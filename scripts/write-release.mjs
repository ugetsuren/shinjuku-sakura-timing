import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const files = [];
async function visit(dir) {
  for (const item of await readdir(dir, {withFileTypes:true})) {
    const name = path.join(dir, item.name);
    if (item.isDirectory()) await visit(name);
    else if (item.name !== 'release.json') files.push(name);
  }
}
await visit('dist');
const assets = Object.fromEntries(await Promise.all(files.sort().map(async file => [
  path.relative('dist',file).replaceAll('\\','/'),
  createHash('sha256').update(await readFile(file)).digest('hex'),
])));
const commit = process.env.GITHUB_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await writeFile('dist/release.json', JSON.stringify({commit,version:'4.0.0',assets},null,2)+'\n');
