import assert from 'node:assert/strict';
import {createTradePlan} from '../worker/data.js';
import {simulateTrade,executionLabel} from '../worker/simulation.js';
import {tradePriceLevels,analysisCardPolicy} from '../worker/contract.js';
const input={decisionDate:'2026-11-27',asOf:'2026-11-27T18:01:00Z',closeAvailableAt:'2026-11-27T18:00:30Z',mic:'XNAS',priceBasis:'raw',referenceClose:100};
const plan=createTradePlan(input);assert.equal(plan.status,'experimental');assert.equal(plan.validEntryDate,'2026-11-30');assert.equal(plan.regularSessions.length,20);assert.equal(plan.plannedEndDate,'2026-12-28');
for(const patch of [{asOf:'2026-11-27T17:59:00Z'},{closeAvailableAt:null},{mic:'UNKNOWN'},{priceBasis:'adjusted'},{asOf:null},{referenceClose:NaN}])assert.equal(createTradePlan({...input,...patch}).status,'unknown');
assert.equal(createTradePlan({...input,decisionDate:'2026-03-09',asOf:'2026-03-09T20:01:00Z',closeAvailableAt:'2026-03-09T20:00:00Z'}).status,'experimental');
const make=()=>[input.decisionDate,...plan.regularSessions].map(date=>({date,open:100,high:104,low:99,close:100}));
const actions={coverageVerified:true,pointInTimeVerified:true,splits:[],dividends:[]};
const costs={entryFeeBps:0,exitFeeBps:0,entryFixedFee:0,exitFixedFee:0,entrySlippageBps:0,exitSlippageBps:0};
const options={tradePlan:plan,costs,priceBasis:'raw',knownAtIndex:20};
let bars=make();Object.assign(bars[2],{open:80,high:106,low:79,close:100});let r=simulateTrade(bars,0,actions,options);assert.equal(r.exitReason,'stop-open-gap');assert.equal(r.exitPrice,80);assert.ok(r.netReturn<-.19);assert.equal(r.exitCategory,'stop');
bars=make();Object.assign(bars[1],{high:106,low:90});r=simulateTrade(bars,0,actions,options);assert.equal(r.exitReason,'stop-intraday-assumed');assert.deepEqual(r.exitPriceBounds,[95,105]);assert.equal(r.mae,null);assert.equal(r.exitExecutionProven,false);
assert.deepEqual(executionLabel(bars,0,actions,options).execution,r);
bars=make();bars[20].halted=true;r=simulateTrade(bars,0,actions,options);assert.equal(r.status,'blocked');assert.match(r.reason,/Tag 20/);assert.equal(r.partial,true);
bars=make();bars[1].open=102;bars[1].high=104;r=simulateTrade(bars,0,actions,options);assert.equal(r.entryDisposition,'abstain-or-reevaluate');assert.equal(r.daily.length,0);
bars=make();r=simulateTrade(bars,0,actions,options);assert.equal(r.exitCategory,'time');assert.equal(r.exitDate,plan.plannedEndDate);assert.equal(r.plannedEndDate,plan.plannedEndDate);
bars[2].high=106;r=simulateTrade(bars,0,actions,options);assert.equal(r.exitCategory,'target');assert.equal(r.exitPrice,105);
bars=make();r=simulateTrade(bars,0,actions,{...options,thesisInvalidations:[{date:bars[2].date,availableAt:bars[2].date+'T13:00:00Z',phase:'before-open'}]});assert.equal(r.exitCategory,'thesis');
assert.equal(simulateTrade(bars,0,actions,{...options,tradePlan:{...plan,plannedEndDate:'2026-12-29'}}).status,'blocked');
assert.equal(simulateTrade(make(),0,{...actions,coverageVerified:false},options).status,'blocked');
assert.equal(simulateTrade(make(),0,actions,{costs}).noStopLoss,true);
const {default:worker}=await import('../worker/index.js');
assert.equal((await worker.fetch(new Request('https://test/api/tradeplan'),{})).status,405);
const response=await worker.fetch(new Request('https://test/api/tradeplan',{method:'POST',body:JSON.stringify(input)}),{});assert.deepEqual(await response.json(),plan);
console.log('Tradeplan acceptance: calendar/DST/availability, exact entry/end, stop gap/both-hit, halt, separate exits and label parity passed.');

for(const patch of [{asOf:'2026-11-27T17:00:00Z'},{referenceClose:90},{entryRange:{min:1,max:999}},{regularSessions:{}}])assert.equal(simulateTrade(make(),0,actions,{...options,tradePlan:{...plan,...patch}}).status,'blocked');
bars=make();bars[2].high=106;const dividendActions={...actions,dividends:[{exDate:bars[2].date,amount:1,paymentDate:bars[4].date}]};r=simulateTrade(bars,0,dividendActions,{...options,costs:{...costs,exitSpreadBps:2,exitSlippageBps:3}});assert.ok(Number.isFinite(r.executionConcessions.exitSpread));assert.ok(Number.isFinite(r.executionConcessions.exitSlippage));

assert.equal(createTradePlan({...input,asOf:'2026-11-30T15:00:00Z'}).status,'unknown');
assert.equal(simulateTrade(make(),0,actions,{...options,tradePlan:false}).status,'blocked');
assert.equal(createTradePlan({...input,asOf:'2026-11-30T14:29:00Z'}).status,'experimental');

// One price-anchor rule: close 100, open/fill 101, then split-adjusted triggers.
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
bars=make();for(const b of bars.slice(1))Object.assign(b,{open:101,high:104,low:99,close:101});
r=simulateTrade(bars,0,actions,options);assert.equal(r.entryPrice,101);near(r.initialPriceLevels.stop,95.95);near(r.initialPriceLevels.target,106.05);
assert.equal(r.exitCategory,'time');assert.deepEqual(r.ledger[0].priceLevels,r.initialPriceLevels);
const card=analysisCardPolicy({rawTradePlan:plan,asOf:input.asOf,evidence:{data:'qualified'},entryFill:{price:r.entryPrice,basis:'modeled'}});
assert.deepEqual(card.priceLevels,r.initialPriceLevels);
// Spread and slippage enter the fill once. Fixed/notional fees only affect cash/returns.
bars=make();const entryCosts={...costs,entrySpreadBps:40,entrySlippageBps:60,entryFixedFee:7,entryFeeBps:10};
r=simulateTrade(bars,0,actions,{...options,costs:entryCosts});assert.equal(r.entryPrice,101);near(r.priceLevels.target,106.05);near(r.priceLevels.stop,95.95);
const withoutFees=simulateTrade(bars,0,actions,{...options,costs:{...entryCosts,entryFixedFee:0,entryFeeBps:0}});
assert.deepEqual(r.priceLevels,withoutFees.priceLevels);assert.notEqual(r.netReturn,withoutFees.netReturn);assert.match(r.priceLevels.costBasis,/ohne Ordergebühren/);
// Entry-day split is already reflected in the raw opening price: don't apply it twice.
const entrySplit={...actions,splits:[{effectiveDate:bars[1].date,shareFactor:2}]};
r=simulateTrade(bars,0,entrySplit,options);assert.equal(r.priceLevels.shareFactor,1);assert.equal(r.ledger.some(e=>e.type==='split'),false);
// Forward and reverse splits on held days change shares/marks, not normalized risk.
bars=make();for(const b of bars.slice(2))Object.assign(b,{open:50,high:52,low:49,close:50});
for(const b of bars.slice(3))Object.assign(b,{open:200,high:208,low:196,close:200});
const splitActions={...actions,splits:[{effectiveDate:bars[2].date,shareFactor:2},{effectiveDate:bars[3].date,shareFactor:.25}]};
r=simulateTrade(bars,0,splitActions,options);assert.equal(r.exitCategory,'time');near(r.netReturn,0);
const splits=r.ledger.filter(e=>e.type==='split');near(splits[0].priceLevels.stop,47.5);near(splits[0].priceLevels.target,52.5);
assert.equal(r.priceLevels.shareFactor,.5);near(r.priceLevels.stop,190);near(r.priceLevels.target,210);
assert.deepEqual(r.priceLevels,tradePriceLevels({referenceClose:100,fillPrice:100,shareFactor:.5,stopFraction:.05}));
// No-plan target-only path keeps the old no-stop semantics with the same helper.
const noPlan=simulateTrade(bars,0,splitActions,{costs});assert.equal(noPlan.noStopLoss,true);assert.equal(noPlan.priceLevels.stop,null);near(noPlan.priceLevels.target,210);
assert.equal(noPlan.exitCategory,'time');
// Exits retain their original priority and pessimistic both-hit / gap behavior.
bars=make();Object.assign(bars[2],{open:110,high:112,low:109,close:110});r=simulateTrade(bars,0,actions,options);assert.equal(r.exitReason,'target-open-gap');assert.equal(r.exitPrice,110);
bars=make();Object.assign(bars[2],{open:90,high:104,low:89,close:100});r=simulateTrade(bars,0,actions,{...options,costs:{...costs,exitSpreadBps:40,exitSlippageBps:60}});assert.equal(r.exitReason,'stop-open-gap');near(r.exitPrice,89.1);
console.log('V02 price anchors: provisional/fill parity, gap, spread/slippage vs fees, entry-day/forward/reverse splits and unchanged exit semantics passed; synthetic only.');
