import assert from 'node:assert/strict';
import {simulateTrade,simulatePortfolio,dailyDrawdown,validateCosts} from '../worker/simulation.js';
const zero={entryFeeBps:0,exitFeeBps:0,entryFixedFee:0,exitFixedFee:0,entrySlippageBps:0,exitSlippageBps:0};
const actions={coverageVerified:true,pointInTimeVerified:true,splits:[],dividends:[]};
const make=()=>Array.from({length:41},(_,i)=>({date:String(i).padStart(4,'0'),open:100,high:104,low:99,close:100}));
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
let bars=make();bars[1].high=106;bars[2].low=1;bars[2].high=1000;
let r=simulateTrade(bars,0,actions,{costs:zero});assert.equal(r.holdingSessions,1);assert.equal(r.exitDate,'0001');assert.equal(r.exitReason,'target-intraday-assumed');approx(r.netReturn,.05);assert.equal(r.mae,null);assert.ok(r.maeBounds[0]>-.02);approx(r.mfe,.05);assert.equal(r.daily[2].positionValue,0);assert.equal(r.exitExecutionProven,false);
bars=make();r=simulateTrade(bars,0,actions,{costs:zero});assert.equal(r.holdingSessions,20);assert.equal(r.exitDate,'0020');assert.equal(r.exitReason,'time-close');approx(r.netReturn,0);
bars=make();bars[1]={...bars[1],open:110,high:120,low:100,close:110};r=simulateTrade(bars,0,actions,{costs:zero});assert.equal(r.entryPrice,110);assert.equal(r.exitDate,'0001'); // intraday target uses entry110, not yesterday100.
bars=make();bars[2]={...bars[2],open:110,high:150,low:80,close:110};r=simulateTrade(bars,0,actions,{costs:zero});assert.equal(r.exitReason,'target-open-gap');assert.equal(r.exitPrice,110);approx(r.mfe,.1);approx(r.mae,-.01);
bars=make();bars[20].close=95;bars[20].low=94;r=simulateTrade(bars,0,actions,{costs:{...zero,entryFeeBps:10,exitFeeBps:10,entrySlippageBps:5,exitSlippageBps:5}});assert.ok(r.grossReturn>r.netReturn);assert.ok(r.totalFees>0);assert.equal(r.daily[20].positionValue,0);
bars=make();bars[1]=null;assert.equal(simulateTrade(bars,0,actions,{costs:zero}).status,'blocked');bars=make();bars[5]=null;assert.equal(simulateTrade(bars,0,actions,{costs:zero}).status,'blocked');
bars=make();bars[1].halted=true;assert.equal(simulateTrade(bars,0,actions,{costs:zero}).status,'blocked');bars=make();bars[20].halted=true;assert.equal(simulateTrade(bars,0,actions,{costs:zero}).status,'blocked');
bars=make();bars[2].halted=true;bars[2].high=110;r=simulateTrade(bars,0,actions,{costs:zero});assert.equal(r.exitReason,'time-close');
bars=make();for(let i=2;i<bars.length;i++)Object.assign(bars[i],{open:25,high:26,low:24,close:25});const split={...actions,splits:[{effectiveDate:'0002',shareFactor:4}]};r=simulateTrade(bars,0,split,{costs:zero});approx(r.netReturn,0);assert.equal(r.ledger.find(e=>e.type==='split').shares,400);
bars=make();for(let i=2;i<bars.length;i++)Object.assign(bars[i],{open:400,high:416,low:396,close:400});r=simulateTrade(bars,0,{...actions,splits:[{effectiveDate:'0002',shareFactor:.25}]},{costs:zero});approx(r.netReturn,0);
bars=make();const dividend={...actions,dividends:[{exDate:'0002',amount:1,paymentDate:'0004'}]};r=simulateTrade(bars,0,dividend,{costs:zero});approx(r.netReturn,.01);assert.equal(r.daily[2].dividendReceivable,100);assert.equal(r.daily[4].dividendReceivable,0);assert.equal(r.daily[4].cash,100);
r=simulateTrade(bars,0,{...actions,dividends:[{exDate:'0001',amount:1,paymentDate:'0004'}]},{costs:zero});approx(r.netReturn,0);
bars=make();bars[3].high=110;r=simulateTrade(bars,0,dividend,{costs:zero});assert.equal(r.exitDate,'0003');assert.equal(r.daily[3].dividendReceivable,100);assert.equal(r.daily[4].dividendReceivable,0);approx(r.netReturn,.06);
bars=make();bars[1].high=105;r=simulateTrade(bars,0,actions,{costs:{...zero,exitSlippageBps:5}});assert.equal(r.exitReason,'time-close');assert.ok(r.assumptions.some(a=>a.includes('nur berührt')));
assert.equal(simulateTrade(make(),0,{...actions,coverageVerified:false}).status,'blocked');assert.equal(simulateTrade(make(),0,{...actions,pointInTimeVerified:false}).status,'blocked');
assert.throws(()=>validateCosts({entryFeeBps:-1}));assert.throws(()=>validateCosts({newCost:1}));
approx(dailyDrawdown([{equity:100},{equity:80},{equity:120}]),-.2);assert.equal(dailyDrawdown([{equity:null}]),null);
bars=make();bars[2].close=80;bars[2].low=79;const p=simulatePortfolio(bars,[0,20],actions,{costs:zero});assert.equal(p.status,'modeled-assumed');approx(p.maxDrawdown,-.2);assert.equal(p.curve.length,41);approx(p.netReturn,0);approx(p.grossReturn,0);
const unpaid=simulatePortfolio(make(),[0],{...actions,dividends:[{exDate:'0002',amount:1,paymentDate:null}]},{costs:zero});assert.equal(unpaid.status,'blocked');
console.log('Simulation checks passed: day1/day20, early fills, gaps, limits/costs, missing/halted sessions, splits/dividends, excursions and daily portfolio drawdown.');
// Server rejects client-side attempts to bypass historical-data qualification.
const {default:worker}=await import('../worker/index.js');
const {readFile}=await import('node:fs/promises');
const ids=['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333'];
const records=[{provenance:{source:'Twelve Data /time_series',parameters:{symbol:'SYNTHETIC',adjust:'none'}},payload:{meta:{mic_code:'XNAS'},values:[]}},{provenance:{source:'Twelve Data /splits',parameters:{symbol:'SYNTHETIC'}},payload:{splits:[]}},{provenance:{source:'Twelve Data /dividends',parameters:{symbol:'SYNTHETIC',adjust:false}},payload:{dividends:[]}}];
const env={BUCKET:{get:async id=>({text:async()=>JSON.stringify(records[ids.indexOf(id.slice(10,-5))])})}};
const response=await worker.fetch(new Request('https://test.local/api/simulation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawId:ids[0],splitId:ids[1],dividendId:ids[2],costs:zero,strict:false,coverageVerified:true})}),env);
assert.equal(response.status,200);const denied=await response.json();assert.equal(denied.status,'blocked');assert.equal(denied.netReturn,null);
assert.equal((await worker.fetch(new Request('https://test.local/api/simulation'),env)).status,405);
const html=await readFile(new URL('../app/index.html',import.meta.url),'utf8');
const renderSource=html.slice(html.indexOf('    function renderSimulation('),html.indexOf("    async function refreshSimulation()"));
const {ANALYSIS_CONTRACT}=await import('../worker/contract.js');
const render=new Function('safe','pct','usd','currentScenarioCapital','UI_ANALYSIS_CONTRACT',renderSource+';return renderSimulation')(v=>String(v??''),v=>String(v),v=>String(v),()=>10000,ANALYSIS_CONTRACT);
assert.ok(render(denied).includes('unbekannt'));
const fixture=simulateTrade(make(),0,actions,{costs:zero});const output=render(fixture);assert.ok(output.includes('Brutto'));assert.ok(output.includes('Nettowert'));assert.ok(output.includes('Dividendenforderung'));assert.ok(output.includes('0020'));
console.log('Server/UI checks passed: cost API, no qualification override, unknown results and daily valuation table.');

// Paket 02: known opening gap belongs to the upper MAE bound.
bars=make();bars[2]={date:'0002',open:90,low:85,high:106,close:100};
r=simulateTrade(bars,0,actions,{costs:zero});assert.equal(r.exitReason,'target-intraday-assumed');assert.equal(r.mae,null);approx(r.maeBounds[0],-.15);approx(r.maeBounds[1],-.10);
// The same economic gap after a 4:1 split must have the same bounds.
bars=make();bars[2]={date:'0002',open:22.5,low:21.25,high:26.5,close:25};
r=simulateTrade(bars,0,{...actions,splits:[{effectiveDate:'0002',shareFactor:4}]},{costs:zero});approx(r.maeBounds[0],-.15);approx(r.maeBounds[1],-.10);
bars=make();bars[1]={date:'0001',open:100,low:85,high:106,close:100};
r=simulateTrade(bars,0,actions,{costs:zero});approx(r.maeBounds[0],-.15);approx(r.maeBounds[1],0);
bars=make();bars[2]={date:'0002',open:106,low:85,high:110,close:100};
r=simulateTrade(bars,0,actions,{costs:zero});assert.equal(r.exitReason,'target-open-gap');approx(r.maeBounds[0],-.01);approx(r.maeBounds[1],-.01);
// Archived snapshots must pass the common raw adapter before action qualification.
const rawMeta={mic_code:'XNAS',currency:'USD',exchange_timezone:'America/New_York'};
const rawRows=['2026-09-28','2026-09-29','2026-09-30'].map(datetime=>({datetime,open:'100',high:'104',low:'99',close:'100'}));
const requestSimulation=async payload=>{
 records[0].payload=payload;
 return (await worker.fetch(new Request('https://test.local/api/simulation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawId:ids[0],splitId:ids[1],dividendId:ids[2],costs:zero,strict:false,coverageVerified:true,pointInTimeVerified:true})}),env)).json();
};
const qualifiedPrices=await requestSimulation({meta:rawMeta,values:rawRows});
assert.equal(qualifiedPrices.status,'blocked');assert.ok(qualifiedPrices.reason.includes('Kapitalmaßnahmenabdeckung'));assert.equal(qualifiedPrices.dataQuality.usable,true);
for(const values of [
 [...rawRows,{...rawRows[1]}],
 [...rawRows,{...rawRows[1],low:'-1'}],
 [...rawRows,{...rawRows[1]},{...rawRows[1]}],
 ]){
 const duplicate=await requestSimulation({meta:rawMeta,values});assert.equal(duplicate.status,'blocked');assert.equal(duplicate.dataQuality.usable,false);assert.ok(duplicate.dataQuality.duplicates>=1);assert.ok(duplicate.reason.includes('doppelte'));assert.equal(duplicate.netReturn,null);
}
for(const meta of [{...rawMeta,currency:'EUR'},{...rawMeta,mic_code:'XLON'},{...rawMeta,exchange_timezone:'UTC'}]){
 const blocked=await requestSimulation({meta,values:rawRows});assert.equal(blocked.status,'blocked');assert.equal(blocked.dataQuality.usable,false);
}
const gap=await requestSimulation({meta:rawMeta,values:[rawRows[0],rawRows[2]]});assert.equal(gap.status,'blocked');assert.deepEqual(gap.dataQuality.missingSessions,['2026-09-29']);
console.log('Paket 02: MAE −15%/−10%, split/entry/open-exit cases, shared raw API checks and non-overridable qualification passed.');
