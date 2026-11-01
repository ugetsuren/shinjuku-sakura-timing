import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
// Strip TypeScript's type-only import to load the unmodified model in Node.
const source=(await readFile(new URL('../app/lib/model.ts',import.meta.url),'utf8')).replace(/^import type .*;\r?\n/m,'');
const {stripTypeScriptTypes}=await import('node:module');
const {forecastBloom}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const baseline={winter:0,february:0,march:0,coldSnap:4,urbanHeat:0.3,microclimate:0};
test('same inputs produce the same distribution and ordered intervals',()=>{
 const a=forecastBloom(baseline),b=forecastBloom(baseline);
 assert.deepEqual(a,b);
 assert.ok(a.outerStart<=a.innerStart && a.innerStart<=a.center && a.center<=a.innerEnd && a.innerEnd<=a.outerEnd);
});
test('warmer March advances flowering; cold snaps delay it',()=>{
 const a=forecastBloom(baseline);
 assert.ok(forecastBloom({...baseline,march:3}).center<a.center);
 assert.ok(forecastBloom({...baseline,coldSnap:14}).center>a.center);
});
test('all extreme input combinations stay finite and retain valid date order',()=>{
 for(let bits=0;bits<64;bits++){
  const a=Object.fromEntries(Object.keys(baseline).map((key,i)=>[key, [[-3,3],[-3,3],[-3,3],[0,14],[0,1.5],[-2,2]][i][(bits>>i)&1]]));
  const f=forecastBloom(a);
  assert.ok(Number.isFinite(f.centerDayOfYear));
  assert.ok(f.innerStartDayOfYear<=f.centerDayOfYear && f.centerDayOfYear<=f.innerEndDayOfYear);
  assert.ok(f.centerDayOfYear>=55 && f.centerDayOfYear<=125);
 }
});
