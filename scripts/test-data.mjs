import assert from 'node:assert/strict';
import {session,lastCompleted,validatePrices,normalizeActions,simulateRaw,providerData} from '../worker/data.js';
assert.equal(lastCompleted(new Date('2026-10-02T19:59:59Z'),'XNAS').date,'2026-10-01');
assert.equal(lastCompleted(new Date('2026-10-02T20:00:00Z'),'XNAS').date,'2026-10-02');
assert.equal(lastCompleted(new Date('2026-11-27T18:00:00Z'),'XNYS').date,'2026-11-27');
assert.equal(lastCompleted(new Date('2026-11-27T17:59:59Z'),'XNYS').date,'2026-11-25');
assert.equal(lastCompleted(new Date('2026-03-09T20:00:00Z'),'XNAS').date,'2026-03-09');
assert.equal(lastCompleted(new Date('2026-03-06T20:30:00Z'),'XNAS').date,'2026-03-05');
assert.equal(lastCompleted(new Date('2026-04-03T21:00:00Z'),'XNYS').date,'2026-04-02');
assert.equal(session('2025-01-09','XNAS').open,false);
assert.equal(session('2021-12-31','XNYS').open,true);
assert.equal(lastCompleted(new Date('2026-10-04'),'XETR'),null);
const meta={mic_code:'XNAS',exchange_timezone:'America/New_York',currency:'USD'};
const rows=['2026-09-30','2026-10-01','2026-10-02'].map(datetime=>({datetime,open:100,close:100,low:99,high:101}));
const now=new Date('2026-10-02T20:05:00Z');
assert.equal(validatePrices({meta,values:rows},'none',now).usable,true);
assert.equal(validatePrices({meta,values:[rows[0],rows[2]]},'all',now).missingSessions[0],'2026-10-01');
assert.equal(validatePrices({meta,values:rows.slice(0,2)},'all',now).usable,false);
assert.equal(validatePrices({meta,values:[...rows,rows[1]]},'all',now).duplicates,1);
assert.equal(validatePrices({meta,values:[...rows,{...rows[1],high:80}]},'all',now).invalid,1);
assert.equal(validatePrices({meta:{...meta,currency:'EUR'},values:rows},'all',now).usable,false);
const actions=normalizeActions({payload:{splits:[{date:'2026-10-02',ratio:.25,from_factor:4,to_factor:1}]}},{payload:{dividends:[{ex_date:'2026-10-02',amount:1}]}});
assert.equal(actions.splits[0].shareFactor,4);
assert.equal(simulateRaw(rows,0,actions).status,'blocked');
// Explicit synthetic fully covered fixture: split reduces price to25, increases shares to4.
const covered={...actions,coverageVerified:true,pointInTimeVerified:true};
const bars=[{date:'2026-09-30',open:100,high:100,low:100,close:100},{date:'2026-10-01',open:100,high:100,low:100,close:100},{date:'2026-10-02',open:25,high:25,low:25,close:25}];
const outcome=simulateRaw(bars,0,covered,{horizon:2});assert.equal(outcome.priceReturn,0);assert.equal(outcome.dividendReturn,.04);assert.ok(Math.abs(outcome.tradeReturn-.04)<1e-12);
const sameDay={...covered,splits:[],dividends:[{exDate:'2026-10-01',amount:1,paymentDate:null}]};assert.equal(simulateRaw(bars.slice(0,2),0,sameDay,{horizon:1}).dividendReturn,0);
const reverse={...covered,splits:[{effectiveDate:'2026-10-02',shareFactor:.25}],dividends:[]};assert.equal(simulateRaw([...bars.slice(0,2),{...bars[2],open:400,high:400,low:400,close:400}],0,reverse,{horizon:2}).tradeReturn,0);
const original=globalThis.fetch,store=new Map();globalThis.fetch=async()=>Response.json({meta,values:rows});
try{const data=await providerData('time_series',{symbol:'SYNTHETIC',adjust:'none'},{TWELVEDATA_API_KEY:'fake-secret',BUCKET:{put:async(k,v)=>store.set(k,v)}});assert.equal(data.archived,true);assert.equal(data.provenance.publicationTime,null);assert.equal(data.provenance.pointInTimeVerified,false);assert.ok(![...store.values()][0].includes('fake-secret'));assert.equal(JSON.parse([...store.values()][0]).payload.values.length,3)}finally{globalThis.fetch=original}
console.log('Data checks passed: holidays/early closes/DST, freshness, gaps/duplicates/OHLC, splits/reverse splits/dividends, PIT block and archival.');

// Shared adapter: malformed duplicate rows must not evade duplicate detection.
const {adaptRawSnapshot}=await import('../worker/data.js');
const archivedMeta={mic_code:'XNAS',currency:'USD',exchange_timezone:'America/New_York'};
const archivedRows=['2026-09-28','2026-09-29','2026-09-30'].map(datetime=>({datetime,open:'100',high:'104',low:'99',close:'100'}));
const archivedNow=new Date('2026-10-02T23:00:00Z');
for(const values of [archivedRows,[archivedRows[0],archivedRows[2]],[...archivedRows,{...archivedRows[1]}],[...archivedRows,{...archivedRows[1],low:'-1'}],[...archivedRows,{...archivedRows[1]},{...archivedRows[1]}]]){
 const payload={meta:archivedMeta,values};
 assert.deepEqual(adaptRawSnapshot(payload,archivedNow),validatePrices(payload,'none',new Date('2026-09-30T23:00:00Z')),'same normalization at same archive cutoff');
}
const triple=adaptRawSnapshot({meta:archivedMeta,values:[...archivedRows,archivedRows[1],archivedRows[1]]},archivedNow);
assert.equal(triple.duplicates,2);assert.ok(!triple.bars.some(bar=>bar.date==='2026-09-29'));assert.equal(triple.sessionBars.find(bar=>bar.date==='2026-09-29').missing,true);
const invalidFirst=adaptRawSnapshot({meta:archivedMeta,values:[{...archivedRows[0],low:'-1'},...archivedRows.slice(1)]},archivedNow);
assert.equal(invalidFirst.sessionBars[0].date,'2026-09-28');assert.equal(invalidFirst.sessionBars[0].missing,true);assert.equal(invalidFirst.usable,false);
const nonSession=adaptRawSnapshot({meta:archivedMeta,values:[...archivedRows,{...archivedRows[0],datetime:'2026-09-27'}]},archivedNow);assert.equal(nonSession.usable,false);
const unfinished=adaptRawSnapshot({meta:archivedMeta,values:archivedRows},new Date('2026-09-30T14:00:00Z'));assert.equal(unfinished.lastSession,'2026-09-29');assert.equal(unfinished.excludedUnclosed,1);assert.ok(!unfinished.sessionBars.some(bar=>bar.date==='2026-09-30'));
console.log('Shared price adapter checked: archive cutoff, duplicate poisoning, invalid first session, non-session and unclosed data.');
