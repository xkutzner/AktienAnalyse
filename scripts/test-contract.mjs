import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker/index.js';
import {ANALYSIS_CONTRACT as contract,scenarioCapital,candidateStatus,watchlistStatus,simulationReturnMetrics} from '../worker/contract.js';
import {simulateTrade} from '../worker/simulation.js';
const json=async(path,options,env={})=>(await worker.fetch(new Request('https://test.local'+path,options),env)).json();
assert.deepEqual(await json('/api/contract'),contract);
assert.equal(contract.horizon,20);assert.equal(contract.entryDay,1);assert.equal(contract.currency,'USD');assert.equal(contract.side,'long');assert.equal(contract.leverage,1);assert.equal(contract.validatedPurchaseReleased,false);
assert.deepEqual(Object.values(contract.resultTypes),['Historischer Vergleich','Retrospektives Kostenszenario','Experimentelle Schätzung','Auf zeitlich getrennten Daten geprüft']);
const page=await (await worker.fetch(new Request('https://test.local/'),{})).text();
const uiContract=JSON.parse(page.match(/const UI_ANALYSIS_CONTRACT=(.*);/)[1]);assert.deepEqual(uiContract,contract,'API and served UI use identical product definitions');assert.ok(!page.includes('__ANALYSIS_CONTRACT_JSON__'));
assert.ok(page.includes('id="scenario-capital"'));assert.ok(page.includes('kein Depotkapital'));
assert.equal(scenarioCapital(),10000);assert.equal(scenarioCapital(2500.25),2500.25);
for(const amount of [0,-1,NaN,Infinity,null,'1000',.001,.015])assert.throws(()=>scenarioCapital(amount));
assert.equal(candidateStatus({expectedReturn:null}),'unknown');assert.equal(candidateStatus({expectedReturn:-.02}),'notSuitable');assert.equal(candidateStatus({expectedReturn:.02}),'experimental');
assert.equal(watchlistStatus([]),'unknown');assert.equal(watchlistStatus([{analysisStatus:'notSuitable'},{analysisStatus:'unknown'}]),'unknown');assert.equal(watchlistStatus([{analysisStatus:'notSuitable'}]),'cash');assert.equal(watchlistStatus([{analysisStatus:'experimental'}]),'experimental');
for(const body of [{capital:0},{capital:.001},{capital:'1000'},{currency:'EUR'},{horizon:19},{side:'short'},{leverage:2}]){
 const response=await worker.fetch(new Request('https://test.local/api/simulation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),{});assert.equal(response.status,400);
}
for(const query of ['currency=EUR','horizon=19','side=short','leverage=2','capital=0','capital=','capital=.001']){
 const response=await worker.fetch(new Request('https://test.local/api/stocks?symbols=AAPL&'+query),{TWELVEDATA_API_KEY:'fixture'});assert.equal(response.status,400);
}
// End-to-end blocked scenario still echoes amount/currency and unknown return metrics.
const ids=['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333'];
const records=[{provenance:{source:'Twelve Data /time_series',parameters:{symbol:'SYNTHETIC',adjust:'none'}},payload:{meta:{currency:'USD',mic_code:'XNAS',exchange_timezone:'America/New_York'},values:['2026-09-28','2026-09-29','2026-09-30'].map(datetime=>({datetime,open:100,high:104,low:99,close:100}))}},{provenance:{source:'Twelve Data /splits',parameters:{symbol:'SYNTHETIC'}},payload:{splits:[]}},{provenance:{source:'Twelve Data /dividends',parameters:{symbol:'SYNTHETIC',adjust:false}},payload:{dividends:[]}}];
const result=await json('/api/simulation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawId:ids[0],splitId:ids[1],dividendId:ids[2],capital:2500.25})},{BUCKET:{get:async key=>({text:async()=>JSON.stringify(records[ids.indexOf(key.slice(10,-5))])})}});
assert.equal(result.scenario.capital,2500.25);assert.equal(result.scenario.currency,'USD');assert.equal(result.scenario.portfolioCapital,false);assert.equal(result.analysisStatus,'unknown');assert.equal(result.resultLabel,contract.resultTypes.costScenario);assert.deepEqual(result.returnMetrics,{stockAt20:null,strategyNet:null,capitalWindowNet:null});assert.equal(result.expectedNetReturn,null);
// Fixed fees change capital return; early exit and full window remain distinct fields.
const bars=Array.from({length:21},(_,i)=>({date:String(i).padStart(4,'0'),open:100,high:i===1?106:104,low:99,close:100}));
const actions={coverageVerified:true,pointInTimeVerified:true,splits:[],dividends:[]};
const costs={entryFeeBps:0,exitFeeBps:0,entryFixedFee:1,exitFixedFee:1,entrySlippageBps:0,exitSlippageBps:0};
const small=simulateTrade(bars,0,actions,{capital:1000,costs}),large=simulateTrade(bars,0,actions,{capital:10000,costs});
assert.ok(small.netReturn<large.netReturn);assert.equal(small.holdingSessions,1);assert.equal(small.daily.length,21);
const metrics=simulationReturnMetrics(small,1000);assert.equal(metrics.stockAt20,null);assert.equal(metrics.strategyNet,small.netReturn);assert.equal(metrics.capitalWindowNet,small.daily.at(-1).equity/1000-1);
assert.equal(simulationReturnMetrics({...small,status:'blocked'},1000).capitalWindowNet,null);
console.log('Analysis contract: shared API/UI, result labels/states, USD amount validation, fixed fees and separate return bases passed.');
