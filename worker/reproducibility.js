// Immutable research records. An archive reproduces retrievals, never historical vintages.
export const REPRO_VERSION='analysis-archive-v1';
export const RESEARCH_GRID={anchor:'2021-01-04',calendarVersion:'us-core-2021-2027-20261004',stride:20,trainingStartIndex:80,testStartIndex:260};
export const EVALUATION_PROTOCOL={version:'evaluation-protocol-v2',status:'fixed-for-future-experiments-not-evaluated',appliesFrom:'analysis-archive-v1',existingExperimentsPreregistered:false,baselines:['cash','SPY-same-exit','SPY-buy-and-hold','watchlist-equal-weight','watchlist-momentum20'],baselineRules:{cash:'USD cash, 0 nominal interest, 20-session capital window',spySameExit:'Next regular open; +5% price target or session20 close; same execution/cost path',spyBuyAndHold:'Next regular open through session20 close; no target',watchlistEqualWeight:'Equal initial capital across eligible watchlist; next open through session20 close; individual order costs',watchlistMomentum20:'Highest known close-to-close 20-session return; nonpositive => cash; next open through session20 close; no target'},periods:{training:['2021-01-04','2023-12-29'],validation:['2024-01-02','2025-12-31'],exploratoryDiagnostic:['2026-01-02','2026-12-31'],outerProspectiveTest:['2027-01-04','2027-11-30'],prospectiveFrom:'2027-01-04'},purgeOutcomeSessions:20,costs:{currency:'USD',capital:10000,entryFeeBps:10,exitFeeBps:10,entryFixedFee:0,exitFixedFee:0,entrySlippageBps:5,exitSlippageBps:5,stressMultiplier:2,fx:'unsupported',entrySpreadBps:0,exitSpreadBps:0,spreadStatus:'zero-scenario-assumption-unverified; real historical spread unknown',executionVersion:'execution-v4'},primaryMetrics:['capital-window-net-excess-vs-SPY-same-exit','daily-net-max-drawdown'],secondaryMetrics:['loss-severity','turnover','cash-fraction','unknown-outcomes','forecast-error','interval-coverage'],selectionRule:'Parameters selected on training/validation only; outer test untouched. Report rejected variants and uncertainty.',limitations:['2026 diagnostic is retrospective, never an untouched outer test','Calendar ends 2027-12-31; decisions without 20 covered outcome sessions remain unknown; no 2028 calendar inferred','Qualified historical vintages, action coverage and unified execution required before evaluation']};
export function stableJSON(value){
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(v=>stableJSON(v===undefined?null:v)).join(',')+']';
 return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stableJSON(value[k])).join(',')+'}';
}
export async function digest(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stableJSON(value)));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function saveAnalysis(result,url,downloads,env,sourceCommit,options={}){
 const analysisId=crypto.randomUUID(),createdAt=new Date().toISOString();
 const snapshotHashes=await Promise.all(downloads.map(async item=>{
  try{
   const object=env.BUCKET&&item.archived&&/^[a-f0-9-]{36}$/.test(item.snapshotId||'')?await env.BUCKET.get('snapshots/'+item.snapshotId+'.json'):null;
   return {id:item.snapshotId||null,hash:object?await digest(JSON.parse(await object.text())):null};
  }catch{return {id:item.snapshotId||null,hash:null}}
 }));
 const manifest={version:REPRO_VERSION,analysisId,createdAt,sourceCommit,sourceCommitStatus:sourceCommit?'build-provided':'unknown',model:result.model||{version:result.version||'reference-v1'},comparisonModel:result.comparisonModel||null,parameters:{horizon:20,target:.05,minAnalogs:12,scenario:result.scenario||null,costs:result.executionModel?.costs||result.costs||null},calendar:RESEARCH_GRID,universe:downloads.map(item=>item.symbol),snapshotHashes,protocol:EVALUATION_PROTOCOL,times:downloads.map(item=>({symbol:item.symbol,eventPeriod:item.provenance?.period||null,availableAt:item.provenance?.availableAt||null,publicationTime:item.provenance?.publicationTime||null,retrievedAt:item.provenance?.retrievedAt||null,normalizationAt:item.normalizationAt||null,historicalVintage:item.provenance?.historicalVintage||null})),resultHash:await digest(result),historicalVintageStatus:'unknown',archiveStatus:'unknown'};
 const input={kind:options.kind||'research',request:options.request||null,normalizationAt:options.normalizationAt||null,query:url.search,downloads:downloads.map(item=>({symbol:item.symbol,snapshotId:item.snapshotId,normalizationAt:item.normalizationAt}))};
 let archived=false;
 if(env.BUCKET&&downloads.every(item=>item.archived&&item.normalizationAt)&&snapshotHashes.every(item=>item.hash)){
  try{
   // UUID namespace; conditional create prevents replacing an earlier decision.
   manifest.archiveStatus='saved';
   const put=await env.BUCKET.put('analyses/'+analysisId+'.json',JSON.stringify({manifest,input,result,recordHash:await digest({manifest,input,result})}),{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
   archived=put!==null;
  }catch{archived=false}
 }
 if(!archived)manifest.archiveStatus='unknown';
 return {...result,manifest,reproducibility:{status:archived&&sourceCommit?'archived':'unknown',reason:archived&&sourceCommit?null:'Commit, Archiv oder Snapshots nicht vollständig belegt; keine Replayfreigabe'}};
}
