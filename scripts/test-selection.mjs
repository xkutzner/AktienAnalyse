import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {session,validatePricePrefix,validatePrices} from '../worker/data.js';
const source=await readFile(new URL('../worker/index.template.js',import.meta.url),'utf8');
const core='const HORIZON=20,TARGET=.05,MIN_ANALOGS=12;\n'+source.slice(source.indexOf('function featureAt('),source.indexOf('\nasync function calendar('))+'\nexport {featureAt,buildRecords,estimate,walkForward};';
const model=await import('data:text/javascript;base64,'+Buffer.from(core).toString('base64'));
const dates=[];
for(const cursor=new Date('2021-01-04T12:00:00Z');dates.length<900;cursor.setUTCDate(cursor.getUTCDate()+1)){
 const day=cursor.toISOString().slice(0,10);if(session(day,'XNAS')?.open)dates.push(day);
}
const makeBars=rate=>dates.map((date,i)=>{const close=100*Math.exp(rate*i);return {date,open:close,close,high:close*1.006,low:close*.994};});
const stocks=[{symbol:'A',bars:makeBars(.001)},{symbol:'B',bars:makeBars(.0005)}],spy=makeBars(.0002);
const controlled=Object.fromEntries(stocks.map((stock,i)=>[stock.symbol,Array.from({length:12},(_,j)=>({index:j*20,score:55,marketUp:true,tradeReturn:i?.02:.04,targetHit:false,adverseMove:-.01}))]));
const run=(series,market,records=controlled)=>model.walkForward(series,records,market,market.map((_,i)=>model.featureAt(market,market,i)),dates);
const baseline=run(stocks,spy),first=baseline.decisions[0],t=dates.indexOf(first.decisionDate);
assert.equal(first.symbol,'A');
const decision=row=>({decisionDate:row.decisionDate,universe:row.universe,candidates:row.candidates,symbol:row.symbol,expectedReturn:row.expectedReturn,expectedTargetProbability:row.expectedTargetProbability});
for(const [name,change] of [
 ['missing A entry open',(series)=>{series[0].bars[t+1].open=null;}],
 ['missing A future session',(series)=>{series[0].bars[t+10]=null;}],
 ['invalid future OHLC',(series)=>{series[0].bars[t+7].low=-1;}],
 ['missing SPY future session',(_,market)=>{market[t+1]=null;}],
 ['arbitrary later prices',(series,market)=>{for(let i=t+1;i<dates.length;i++){series[0].bars[i]={...series[0].bars[i],open:1,close:1,high:2,low:.5};market[i]=null;}}],
 ]){
 const series=structuredClone(stocks),market=structuredClone(spy);change(series,market);
 const changed=run(series,market);
 assert.deepEqual(decision(changed.decisions[0]),decision(first),name+' leaves decision unchanged');
 if(name!=='missing SPY future session'){
  const selected=changed.decisions[0];
  if(name!=='arbitrary later prices'){assert.equal(selected.outcomeStatus,'unknown');assert.equal(selected.realizedReturn,null);assert.equal(selected.targetHit,null);assert.equal(selected.symbol,'A');assert.ok(changed.unknownOutcomeCount>0);assert.equal(changed.maxDrawdown,null);}
 }
 if(name==='missing SPY future session'){assert.equal(changed.decisions[0].benchmarkReturn,null);assert.equal(changed.decisions[0].symbol,'A');assert.equal(changed.decisions[0].outcomeStatus,'known');assert.ok(changed.unknownBenchmarkCount>0);}
}
// Rebuild actual records after future changes: maturity filtering protects fit too.
const fitRun=(series,market)=>{const features=market.map((_,i)=>model.featureAt(market,market,i));const records=Object.fromEntries(series.map(stock=>[stock.symbol,model.buildRecords(stock.bars,market,features)]));return run(series,market,records);};
const fitted=fitRun(stocks,spy),changedStocks=structuredClone(stocks),changedSpy=structuredClone(spy);
for(let i=t+1;i<dates.length;i++){changedStocks[0].bars[i]=null;changedSpy[i]=null;}
assert.deepEqual(decision(fitRun(changedStocks,changedSpy).decisions[0]),decision(fitted.decisions[0]),'rebuilt features and fit use only mature prefix records');
const negative=Object.fromEntries(Object.entries(controlled).map(([key,rows])=>[key,rows.map(row=>({...row,tradeReturn:-.01}))]));
const cash=run(stocks,spy,negative);assert.ok(cash.decisions.every(row=>row.outcomeStatus==='cash'&&row.symbol===null&&row.realizedReturn===0));assert.equal(cash.unknownOutcomeCount,0);
const meta={currency:'USD',mic_code:'XNAS',exchange_timezone:'America/New_York'};
const payload={meta,values:stocks[0].bars.map(bar=>({...bar,datetime:bar.date}))};
const prefix=validatePricePrefix(payload,'all',dates[t]);assert.equal(prefix.usable,true);
const future=structuredClone(payload);future.values.push({...future.values[t+5]});future.values[t+6].low=-1;
assert.deepEqual(validatePricePrefix(future,'all',dates[t]),prefix,'future raw defects do not affect historical quality');
assert.equal(validatePrices(future,'all',new Date(dates.at(-1)+'T23:00:00Z')).usable,false,'current strict quality still rejects defects');
const past=structuredClone(payload);past.values.push({...past.values[t]});assert.equal(validatePricePrefix(past,'all',dates[t]).usable,false,'known duplicate blocks decision');
console.log('Selection-v2: A/B, unknown outcomes, SPY independence, rebuilt fit, cash and raw prefix quality passed.');
