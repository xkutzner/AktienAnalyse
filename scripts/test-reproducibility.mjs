import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {session,lastCompleted} from '../worker/data.js';
import {digest,RESEARCH_GRID,EVALUATION_PROTOCOL} from '../worker/reproducibility.js';
// Read generated commit; tests do not fabricate source identity.
const source=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
const sha=JSON.parse(source.match(/const SOURCE_COMMIT=(.*);/)[1]);
const worker=(await import('../worker/index.js')).default;
const storage=new Map();let collision=false;
const env={TWELVEDATA_API_KEY:'secret-test',BUCKET:{async put(key,text,options){if(options?.onlyIf?.etagDoesNotMatch==='*'&&(collision||storage.has(key)))return null;storage.set(key,text);return {etag:'test'}},async get(key){return storage.has(key)?{text:async()=>storage.get(key)}:null}}};
const dates=[];for(let d=new Date(RESEARCH_GRID.anchor+'T12:00:00Z');d.toISOString().slice(0,10)<=lastCompleted(new Date(),'XNAS').date;d.setUTCDate(d.getUTCDate()+1)){const day=d.toISOString().slice(0,10);if(session(day,'XNAS')?.open)dates.push(day)}
const payload=symbol=>({meta:{currency:'USD',mic_code:'XNAS',exchange_timezone:'America/New_York'},values:dates.slice(-1300).map((datetime,i)=>{const close=100*Math.exp((symbol==='SPY'?.0001:.0005)*dates.indexOf(datetime));return {datetime,open:close,high:close*1.01,low:close*.99,close}})});
const originalFetch=globalThis.fetch;let providerCalls=0;
globalThis.fetch=async url=>{providerCalls++;return Response.json(payload(new URL(url).searchParams.get('symbol')))};
try{
 const query='https://test.local/api/stocks?symbols=AAPL&capital=12345';
 const result=await (await worker.fetch(new Request(query),env)).json();
 assert.equal(result.manifest.sourceCommit,sha);
 assert.equal(providerCalls,2,'08a must not add provider calls to standard research');
 assert.equal(result.riskModel.version,'risk-prefix-v1');
 assert.equal(result.riskModel.rankingChanged,false);
 assert.equal(result.stocks[0].risk.averageDailyTradedValue.value,null);
 assert.equal(result.stocks[0].risk.downsideMeasure.basis,'provider-adjusted-price-return-proxy');
 assert.equal(result.stocks[0].risk.thresholdsApplied,false);
 assert.equal(result.manifest.historicalVintageStatus,'unknown');
 assert.equal(result.manifest.times[0].availableAt,null);
 assert.equal(result.manifest.times[0].publicationTime,null);
 assert.ok(result.manifest.times[0].retrievedAt&&result.manifest.times[0].normalizationAt);
 assert.equal(result.manifest.parameters.scenario.capital,12345);
 assert.equal(result.manifest.protocol.existingExperimentsPreregistered,false);
 assert.equal(EVALUATION_PROTOCOL.purgeOutcomeSessions,20);
 const id=result.manifest.analysisId,originalStored=storage.get('analyses/'+id+'.json');
 assert.ok(originalStored,'also save analyses with unknown commit');
 assert.ok(result.backtest.decisions.every(row=>dates.indexOf(row.decisionDate)%20===0),'fixed calendar phase despite truncated provider prefix');
 assert.ok(result.backtest.decisions.filter(row=>dates.indexOf(row.decisionDate)<dates.length-1300).every(row=>row.universe.length===0&&row.outcomeStatus==='unknown'&&row.realizedReturn===null),'missing prefix is visible, never manufactured');
 globalThis.fetch=async()=>{throw Error('replay must never fetch changed provider')};
 const replay=await worker.fetch(new Request('https://test.local/api/replay?id='+id),env);
 if(sha){
  assert.equal(replay.status,200);const restored=await replay.json();assert.equal(restored.status,'identical');
  const {manifest,reproducibility,...baseline}=result;assert.deepEqual(restored.result,baseline);
  assert.equal(await digest(restored.result),manifest.resultHash);
  const snapshotKey='snapshots/'+manifest.snapshotHashes[0].id+'.json',before=storage.get(snapshotKey);
  const broken=JSON.parse(before);broken.payload.values[20].close=1;storage.set(snapshotKey,JSON.stringify(broken));
  assert.equal((await worker.fetch(new Request('https://test.local/api/replay?id='+id),env)).status,409);
  storage.set(snapshotKey,before);storage.delete(snapshotKey);
  assert.equal((await worker.fetch(new Request('https://test.local/api/replay?id='+id),env)).status,409);storage.set(snapshotKey,before);
  const post=async input=>worker.fetch(new Request('https://test.local/api/experiment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)}),env);
  const registration=await (await post({status:'registered',model:'features-v2',parameters:{horizon:20},reason:'planned comparison'})).json();
  assert.ok(registration.eventId);
  const rejected=await (await post({status:'rejected',registeredId:registration.eventId,model:'features-v2',parameters:{horizon:20},reason:'no incremental benefit'})).json();
  assert.equal(rejected.registeredId,registration.eventId);
  assert.equal(JSON.parse(storage.get('experiments/'+registration.eventId+'.json')).status,'registered');
  assert.equal((await post({status:'completed',registeredId:registration.eventId,model:'features-v2',parameters:{horizon:10},reason:'changed'})).status,409);
 }else{assert.equal(replay.status,409);assert.equal(result.reproducibility.status,'unknown')}
 if(sha){
  const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
  for(let i=0;i<3;i++)storage.set('snapshots/'+ids[i]+'.json',JSON.stringify({snapshotId:ids[i],provenance:{source:'Twelve Data /'+['time_series','splits','dividends'][i],parameters:{symbol:'AAPL',adjust:i===2?false:i===0?'none':undefined},retrievedAt:new Date().toISOString(),publicationTime:null,historicalVintage:null},payload:i===0?payload('AAPL'):i===1?{splits:[]}:{dividends:[]},error:null}));
  const simulated=await (await worker.fetch(new Request('https://test.local/api/simulation',{method:'POST',body:JSON.stringify({rawId:ids[0],splitId:ids[1],dividendId:ids[2],capital:54321})}),env,{waitUntil(){}})).json();
  assert.equal(simulated.manifest.model.version,'execution-v4');
  assert.equal(simulated.manifest.archiveStatus,'saved');
  const simulationReplay=await worker.fetch(new Request('https://test.local/api/replay?id='+simulated.manifest.analysisId),env);
  assert.equal(simulationReplay.status,200);assert.equal((await simulationReplay.json()).status,'identical');
 }
 assert.equal(providerCalls,2);
 assert.equal(storage.get('analyses/'+id+'.json'),originalStored,'replay never overwrites decision');
 globalThis.fetch=async url=>Response.json(payload(new URL(url).searchParams.get('symbol')));
 const second=await (await worker.fetch(new Request(query),env)).json();assert.notEqual(second.manifest.analysisId,id);
 assert.equal(storage.get('analyses/'+id+'.json'),originalStored);
 collision=true;const rejectedSave=await (await worker.fetch(new Request(query),env)).json();assert.equal(rejectedSave.manifest.archiveStatus,'unknown');collision=false;
 if(sha){
  for(const defect of ['duplicate','provider-error','invalid-values','SPY-blocked']){
   globalThis.fetch=async url=>{
    const symbol=new URL(url).searchParams.get('symbol');
    if(defect==='provider-error'&&symbol==='AAPL')return Response.json({status:'error',code:429,message:'limit'}, {status:429});
    const data=payload(symbol);
    if(defect==='duplicate'&&symbol==='AAPL')data.values.push({...data.values[20]});
    if(defect==='invalid-values'&&symbol==='AAPL')data.values={invalid:true};
    if(defect==='SPY-blocked'&&symbol==='SPY')data.values.at(-1).low=-1;
    return Response.json(data);
   };
   const blocked=await (await worker.fetch(new Request(query),env)).json();
   globalThis.fetch=async()=>{throw Error('no provider access in error replay')};
   const replayed=await worker.fetch(new Request('https://test.local/api/replay?id='+blocked.manifest.analysisId),env);
   assert.equal(replayed.status,200,defect);assert.equal((await replayed.json()).status,'identical',defect);
  }
 }
 globalThis.fetch=async url=>Response.json(payload(new URL(url).searchParams.get('symbol')));
 const noArchive=await (await worker.fetch(new Request(query),{TWELVEDATA_API_KEY:'secret-test'})).json();assert.equal(noArchive.reproducibility.status,'unknown');
 assert.equal(session('2020-12-31','XNAS'),null);assert.equal(session('2028-01-03','XNAS'),null);
 // Advancing/truncating the spine never changes shared sample dates: anchor is index zero.
 const core='const HORIZON=20,TARGET=.05,MIN_ANALOGS=12;\n'+(await readFile(new URL('../worker/index.template.js',import.meta.url),'utf8')).split('function featureAt(')[1].split('\nasync function calendar(')[0];
 const model=await import('data:text/javascript;base64,'+Buffer.from(core.replace('const HORIZON=20,TARGET=.05,MIN_ANALOGS=12;\n','const HORIZON=20,TARGET=.05,MIN_ANALOGS=12;\nfunction featureAt(')+'\nexport {walkForward};').toString('base64'));
 const spine=dates.slice(0,700),bars=spine.map(date=>({date,open:100,close:100,high:101,low:99}));
 const run=(ds,bs)=>model.walkForward([],{},bs,[],ds).decisions.map(row=>row.decisionDate);
 assert.deepEqual(run([...spine,...dates.slice(700,721)],[...bars,...bars.slice(0,21)]).filter(date=>run(spine,bars).includes(date)),run(spine,bars));
 let auditCalls=0;
 globalThis.fetch=async url=>{auditCalls++;const u=new URL(url);if(u.pathname==='/splits')return Response.json({splits:[]});if(u.pathname==='/dividends')return Response.json({dividends:[]});const data=payload('AAPL');data.values=data.values.map(r=>({...r,volume:200}));return Response.json(data)};
 const audited=await (await worker.fetch(new Request('https://test.local/api/data?symbol=AAPL'),env)).json();
 assert.equal(auditCalls,4,'risk audit reuses existing four downloads');
 assert.equal(audited.rawRisk.averageDailyTradedValue.status,'known');
 assert.equal(audited.rawRisk.averageDailyTradedValue.method,'close-times-volume-proxy-not-VWAP');
 const expectedAuditValue=payload('AAPL').values.slice(-20).reduce((sum,r)=>sum+r.close*200,0)/20;
 assert.equal(audited.rawRisk.averageDailyTradedValue.value,expectedAuditValue);
 assert.equal(audited.rawRisk.openingGaps.value,null,'empty provider ledger never qualifies action absence');
 assert.equal(audited.rawRisk.downsideMeasure.value,null);
 assert.ok(Object.values(audited.dataCapabilities.gates).every(g=>g.status==='blocked'));
 globalThis.fetch=async url=>{const u=new URL(url);if(u.pathname==='/splits')return Response.json({splits:[]});if(u.pathname==='/dividends')return Response.json({dividends:[]});const data=payload('AAPL');data.values.push({...data.values.at(-1),volume:200});return Response.json(data)};
 const blockedAudit=await (await worker.fetch(new Request('https://test.local/api/data?symbol=AAPL'),env)).json();
 assert.equal(blockedAudit.rawRisk.averageDailyTradedValue.value,null,'unusable raw series cannot claim audit liquidity');
 console.log('Reproducibility: immutable archives, commit gate, fixed grid, unknown availability/vintages, provider-free replay, integrity, experiment events passed'+(sha?' (exact commit replay exercised).':' (commit unavailable; replay explicitly blocked).'));
}finally{globalThis.fetch=originalFetch}
