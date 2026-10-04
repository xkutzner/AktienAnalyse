// Provider-free preparation only. No caller-controlled qualification flag authorizes an empirical run.
import {EVALUATION_PROTOCOL,RESEARCH_GRID,digest} from './reproducibility.js';
import {simulateTrade,dailyDrawdown,validateCosts} from './simulation.js';
import {session,createTradePlan,regularSessionOpenUtc} from './data.js';
export const COMPARISON_VERSION='comparison-preparation-v1';
export const EXIT_POLICY_VERSION='comparison-exit-policy-v1';
const strategies=['model',...EVALUATION_PROTOCOL.baselines];
const unknown=reason=>({status:'unknown',reason,capitalWindowNetReturn:null,daily:[],forecastError:null,intervalCovered:null});
export function partitionDecision(calendar,index){
 const date=calendar[index],last=calendar[index+20];
 for(const [period,range] of Object.entries(EVALUATION_PROTOCOL.periods)){
  if(!Array.isArray(range)||!date||date<range[0]||date>range[1])continue;
  if(period==='outerProspectiveTest')return {period,status:'frozen-untouched'};
  return {period,status:last&&last<=range[1]?'included':'purged-boundary-or-missing-20-sessions'};
 }
 return {period:null,status:'outside-protocol'};
}
function calendarValid(calendar){
 if(!Array.isArray(calendar)||!calendar.length)return false;
 for(let i=0;i<calendar.length;i++){
  if(!session(calendar[i],'XNYS')?.open||(i&&calendar[i]<=calendar[i-1]))return false;
  if(i){let d=new Date(calendar[i-1]+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);while(d.toISOString().slice(0,10)<calendar[i]){if(session(d.toISOString().slice(0,10),'XNYS')?.open)return false;d.setUTCDate(d.getUTCDate()+1)}}
 }
 return true;
}
export async function blockedComparison({sourceCommit=null,input=null,parameters={}}={}){
 if(sourceCommit!==null&&!/^[a-f0-9]{40}$/.test(sourceCommit))throw new Error('sourceCommit must be null or a full build-provided SHA');
 return {version:COMPARISON_VERSION,status:'blocked',evidence:'unavailable',empiricalEvaluation:false,higherNetReturnClaim:false,sourceCommit,sourceCommitStatus:sourceCommit?'build-provided':'unknown',exitPolicyVersion:EXIT_POLICY_VERSION,protocol:structuredClone(EVALUATION_PROTOCOL),parameters,costStress:{status:'not-run',rule:'Repeat with every separate fee/spread/slippage assumption multiplied by 2; same decisions and capital windows'},inputHashes:input===null?[]:[await digest(input)],outerTest:{status:'frozen-untouched',accessed:false,parameterAndPerformanceAccessed:false},hashScope:'Entire supplied input is hashed for fixture identity; hashing is not an empirical outer-test evaluation',strategies:strategies.map(strategy=>({strategy,status:'blocked',rows:[],metrics:null})),negativeFindings:[{code:'qualified-dataset-unavailable',detail:'Qualified historical vintages, raw prices, action coverage, availability evidence and historically qualified calendar are absent. Client PIT/coverage flags cannot qualify a dataset.'},{code:'outer-test-not-evaluated',detail:'No qualified prospective dataset supplied; outer test remains untouched.'}],unsupportedCases:['Public JSON qualification claims','Today-adjusted history as historical vintage','EUR/FX execution without evidence','Historical reference selection bug as performance baseline','Historical quantiles as calibrated predictive intervals'],parameterSelection:{status:'not-performed',allowedPeriods:['training','validation'],outerUsed:false},qualificationAdapter:{status:'not-installed',requiredEvidence:['immutable snapshot hashes','historical availability times','raw/action ledger coverage','qualified session calendar','independent source entitlement and provenance']}};
}
function summarize(rows){
 const known=rows.filter(r=>r.status==='synthetic-known'),values=known.map(r=>r.capitalWindowNetReturn);
 return {knownOutcomes:known.length,unknownOutcomes:rows.length-known.length,meanCapitalWindowNetReturn:values.length&&known.length===rows.length?values.reduce((a,b)=>a+b,0)/values.length:null,worstCapitalWindowLoss:values.length&&known.length===rows.length?Math.min(0,...values):null,meanTurnover:known.length&&known.length===rows.length?known.reduce((s,r)=>s+r.turnover,0)/known.length:null,meanCashFraction:known.length&&known.length===rows.length?known.reduce((s,r)=>s+r.cashFraction,0)/known.length:null,forecastKnownCount:known.filter(r=>Number.isFinite(r.forecastError)).length,intervalKnownCount:known.filter(r=>typeof r.intervalCovered==='boolean').length,pairedKnownExcessOutcomes:known.filter(r=>Number.isFinite(r.netExcessVsSpySameExit)).length,meanNetExcessVsSpySameExit:known.length&&known.length===rows.length&&known.every(r=>Number.isFinite(r.netExcessVsSpySameExit))?known.reduce((s,r)=>s+r.netExcessVsSpySameExit,0)/known.length:null,forecastMAE:known.some(r=>Number.isFinite(r.forecastError))?known.filter(r=>Number.isFinite(r.forecastError)).reduce((s,r)=>s+Math.abs(r.forecastError),0)/known.filter(r=>Number.isFinite(r.forecastError)).length:null,intervalCoverage:known.some(r=>typeof r.intervalCovered==='boolean')?known.filter(r=>typeof r.intervalCovered==='boolean').filter(r=>r.intervalCovered).length/known.filter(r=>typeof r.intervalCovered==='boolean').length:null,maxDailyDrawdown:known.length&&known.length===rows.length?Math.min(...known.map(r=>r.maxDailyDrawdown)):null,aggregation:'per nonoverlapping 20-session window; no compounding through unknown windows'};
}
// Explicit fixture API, never verified. model sees only frozen prefixes and completed training labels.
export async function runSyntheticComparison(dataset,{model,parameters={},costs=EVALUATION_PROTOCOL.costs,capital=10000,currency='USD',sourceCommit=null}={}){
 const report=await blockedComparison({sourceCommit,input:dataset,parameters});
 report.status='synthetic-software-test';report.evidence='synthetic-only';report.negativeFindings.push({code:'synthetic-not-empirical',detail:'Fixture performance proves software behavior only; no forecast or economic superiority evidence.'});
 report.executionPolicies={model:'target-or-time (optional trade-plan-v1)',cash:'uninvested USD','SPY-same-exit':'target-or-time (same model trade plan when supplied)','SPY-buy-and-hold':'time-only','watchlist-equal-weight':'time-only','watchlist-momentum20':'time-only'};
 const costKeys=['entryFeeBps','exitFeeBps','entryFixedFee','exitFixedFee','entrySlippageBps','exitSlippageBps','entrySpreadBps','exitSpreadBps'];
 const commonCosts=validateCosts(Object.fromEntries(costKeys.map(k=>[k,costs[k]??0])));
 report.parameters={...parameters,capital,currency,costs:commonCosts,horizon:20};
 const calendar=dataset?.calendar,assets=dataset?.assets||{},watchlist=[...new Set(dataset?.watchlist||[])].filter(s=>s!=='SPY');
 report.strategies=strategies.map(strategy=>({strategy,status:'synthetic-software-test',rows:[],metrics:null}));report.partitions=[];
 if(!calendarValid(calendar)||currency!=='USD'||!Number.isFinite(capital)||capital<=0){report.negativeFindings.push({code:'unsupported-calendar-capital-or-fx',detail:'No valid common capital/session window.'});return report}
 const indices=dataset.decisionIndices||[];
 if(indices.some((i,j)=>!Number.isInteger(i)||i<20||(j&&i-indices[j-1]<20))){report.negativeFindings.push({code:'invalid-or-overlapping-decisions',detail:'Ascending nonoverlapping 20-session windows required.'});return report}
 const prefixes=i=>Object.fromEntries(watchlist.map(s=>[s,structuredClone((assets[s]?.features||[]).slice(0,i+1))]));
 for(const i of indices){
  const partition=partitionDecision(calendar,i);report.partitions.push({index:i,date:calendar[i],...partition});if(partition.status!=='included')continue;
  const features=prefixes(i),eligible=watchlist.filter(s=>features[s].length===i+1&&features[s][i]?.date===calendar[i]&&Number.isFinite(features[s][i]?.close));
  const trainLabels=(dataset.trainingLabels||[]).filter(l=>Number.isInteger(l.knownAtIndex)&&l.knownAtIndex<=i&&partitionDecision(calendar,l.index).period==='training'&&partitionDecision(calendar,l.index).status==='included'&&l.knownAtIndex>=l.index+20);
  const timing=dataset.decisionTimes?.[i],asOf=timing?.asOf;
  const timingPlan=createTradePlan({decisionDate:calendar[i],asOf,closeAvailableAt:timing?.closeAvailableAt,mic:'XNYS',referenceClose:1,priceBasis:'raw'});
  const timeValid=timingPlan.status!=='unknown'&&Date.parse(asOf)<Date.parse(regularSessionOpenUtc(calendar[i+1],'XNYS'));
  const choice=model&&timeValid?model(structuredClone({date:calendar[i],asOf,index:i,features,trainingLabels:trainLabels,parameters})):null;
  const momentum=eligible.map(symbol=>{const a=features[symbol].slice(i-20,i+1);return {symbol,score:a.length===21&&a.every((b,j)=>b?.date===calendar[i-20+j]&&Number.isFinite(b.close)&&b.close>0)?a[20].close/a[0].close-1:null}}).filter(v=>v.score!==null).sort((a,b)=>b.score-a.score||a.symbol.localeCompare(b.symbol));
  const selections={cash:[],model:choice?.status==='cash'?[]:choice?.status==='selected'&&eligible.includes(choice.symbol)?[choice.symbol]:null,'SPY-same-exit':['SPY'],'SPY-buy-and-hold':['SPY'],'watchlist-equal-weight':eligible.length===watchlist.length&&eligible.length?eligible:null,'watchlist-momentum20':momentum.length===watchlist.length&&momentum.length?momentum[0].score>0?[momentum[0].symbol]:[]:null};
  for(const output of report.strategies){
   const selected=selections[output.strategy],base={index:i,date:calendar[i],period:partition.period,selected};let row;
   if(selected===null)row=unknown('Unknown decision/score; not a cash outcome');
   else if(!selected.length)row={status:'synthetic-known',capitalWindowNetReturn:0,daily:calendar.slice(i,i+21).map(date=>({date,equity:capital,cash:capital,positionValue:0,dividendReceivable:0})),turnover:0,cashFraction:1,totalFees:0,forecastError:null,intervalCovered:null};
   else{
    const allocation=capital/selected.length,allocationRemainder=capital-allocation*selected.length;
    const trades=selected.map(s=>{const asset=assets[s];if(!asset||asset.raw?.slice(i,i+21).some((b,j)=>b?.date!==calendar[i+j])||asset.raw?.slice(i,i+21).length!==21)return {status:'blocked',reason:'Missing common calendar raw outcome'};const plan=output.strategy==='SPY-same-exit'&&choice?.tradePlan?createTradePlan({decisionDate:calendar[i],asOf,closeAvailableAt:asset.closeAvailableAt?.[i]||timing?.closeAvailableAt,mic:asset.mic||'XNYS',referenceClose:asset.raw[i]?.close,priceBasis:'raw',entryTolerance:choice.tradePlan.entryTolerance,stopFraction:choice.tradePlan.stopFraction}):output.strategy==='model'?choice?.tradePlan:null;return simulateTrade(asset.raw,i,asset.actions,{capital:allocation,costs:commonCosts,currency,priceBasis:'raw',exitPolicy:['model','SPY-same-exit'].includes(output.strategy)?'target-or-time':'time-only',...(plan?{tradePlan:plan}:{}),strict:true})});
    if(trades.some(t=>t.status==='blocked'))row={...unknown('Unknown execution outcome; not zero/cash'),outcomes:trades};
    else{
     const daily=calendar.slice(i,i+21).map((date,j)=>Object.fromEntries(['equity','cash','positionValue','dividendReceivable'].map(key=>[key,trades.reduce((s,t)=>s+t.daily[j][key],key==='equity'||key==='cash'?allocationRemainder:0)]).concat([['date',date]])));
     const net=daily.at(-1).equity/capital-1;
     // Only explicit ex ante prediction timestamps; quantile summaries do not qualify as intervals.
     const prediction=output.strategy==='model'&&choice?.prediction,validPrediction=timeValid&&prediction&&prediction.target==='capital-window-net'&&Number.isFinite(Date.parse(prediction.availableAt))&&Date.parse(prediction.availableAt)<=Date.parse(asOf);
     row={status:'synthetic-known',capitalWindowNetReturn:net,daily,outcomes:trades,allocationRemainder,totalFees:trades.reduce((s,t)=>s+t.totalFees,0),turnover:trades.reduce((s,t)=>s+t.ledger.filter(e=>e.type==='entry'||e.type==='exit').reduce((a,e)=>a+e.price*e.shares,0),0)/capital,cashFraction:daily.slice(1).reduce((s,d)=>s+d.cash/d.equity,0)/20,forecastError:validPrediction&&Number.isFinite(prediction.mean)?net-prediction.mean:null,intervalCovered:validPrediction&&prediction.kind==='ex-ante-predictive-interval'&&Number.isFinite(prediction.lower)&&Number.isFinite(prediction.upper)&&prediction.lower<=prediction.upper?net>=prediction.lower&&net<=prediction.upper:null};
    }
   }
   output.rows.push({...base,...row,maxDailyDrawdown:row.status==='synthetic-known'?dailyDrawdown(row.daily):null});
  }
 }
 const spy=report.strategies.find(s=>s.strategy==='SPY-same-exit');
 for(const output of report.strategies){for(const row of output.rows){const benchmark=spy.rows.find(b=>b.index===row.index);row.netExcessVsSpySameExit=row.status==='synthetic-known'&&benchmark?.status==='synthetic-known'?row.capitalWindowNetReturn-benchmark.capitalWindowNetReturn:null}output.metrics=summarize(output.rows);output.metricsByPeriod=Object.fromEntries(['training','validation','exploratoryDiagnostic'].map(period=>[period,summarize(output.rows.filter(r=>r.period===period))]))}
 return report;
}
