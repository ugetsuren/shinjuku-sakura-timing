import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeTypes } from '../app/lib/community-summary.ts';
const row=(classification,count,averageDay=83)=>({classification,count,averageDay,minimumDay:80,maximumDay:86});
test('empty data is a valid empty summary',()=>assert.deepEqual(summarizeTypes([]),{total:0,topType:null,typeCounts:[]}));
test('summary adds all counts and selects the most common type',()=>{
 const result=summarizeTypes([row('早期開花型',2),row('平年近傍型',5),row('晩期開花型',0)]);
 assert.equal(result.total,7);assert.equal(result.topType.classification,'平年近傍型');assert.equal(result.typeCounts.length,2);
});
test('ties have deterministic ordering and do not mutate source data',()=>{
 const original=[row('晩期開花型',2),row('平年近傍型',2)];
 assert.deepEqual(summarizeTypes(original),summarizeTypes([...original].reverse()));
 assert.equal(original[0].classification,'晩期開花型');
});
