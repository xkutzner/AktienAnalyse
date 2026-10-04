import {CAPABILITY_VERSION, dataCapabilities} from "./capabilities.js";
import {REPRO_VERSION, RESEARCH_GRID, EVALUATION_PROTOCOL, digest, saveAnalysis} from "./reproducibility.js";
const SOURCE_COMMIT=__SOURCE_COMMIT__;
import {ANALYSIS_CONTRACT, scenarioCapital, analysisContext, candidateStatus, watchlistStatus, simulationReturnMetrics} from "./contract.js";
import {riskAt, RISK_VERSION, createTradePlan,  loadPrices, providerData, normalizeActions, session, validatePricePrefix, adaptRawSnapshot, validatePrices, DATA_VERSION } from "./data.js";
import {simulateTrade, executionLabel, DEFAULT_COSTS, SIMULATION_VERSION, validateCosts, BROKER_PROFILES} from "./simulation.js";
import {estimateFeatures, ANALOGUE_VERSION, ANALOGUE_PARAMETERS} from "./analogues.js";
const page = __APP_PAGE_HTML__;
const HORIZON = 20;
const TARGET = 0.05;
const HISTORY_SIZE = 1300;
const MIN_ANALOGS = 12;

const worker = {
  async fetch(request, env, ctx, replayMode=null) {
    const url = new URL(request.url);
    if(url.pathname==="/api/contract")return request.method==="GET"?json(ANALYSIS_CONTRACT):json({message:"Nur GET erlaubt"},405);
    if(url.pathname==='/api/protocol')return request.method==='GET'?json(EVALUATION_PROTOCOL):json({message:'Nur GET erlaubt'},405);
    if(url.pathname==='/api/capabilities')return request.method==='GET'?json(dataCapabilities(),200,{'cache-control':'no-store'}):json({message:'Nur GET erlaubt'},405);
    if(url.pathname==='/api/collection'){
     if(!env.BUCKET)return json({status:'not-checked',message:'Archiv fehlt'},503);
     if(request.method==='GET'){
      const id=url.searchParams.get('id')||'';
      if(!/^[a-f0-9-]{36}$/.test(id))return json({message:'Ungültige Sammlung-ID'},400);
      try{
       const object=await env.BUCKET.get('collections/'+id+'.json');if(!object)return json({message:'Sammlung fehlt'},404);
       const record=JSON.parse(await object.text()),{recordHash,...body}=record;
       if(await digest(body)!==recordHash)return json({message:'Sammlungsintegrität verletzt'},409);
       for(const snapshot of record.snapshots){const saved=await env.BUCKET.get('snapshots/'+snapshot.id+'.json');if(!saved||await digest(JSON.parse(await saved.text()))!==snapshot.hash)return json({message:'Snapshotintegrität verletzt'},409)}
       return json(record,200,{'cache-control':'no-store'});
      }catch{return json({message:'Sammlung nicht lesbar'},409)}
     }
     if(request.method!=='POST')return json({message:'Nur GET/POST erlaubt'},405);
     if(!env.TWELVEDATA_API_KEY)return json({status:'not-checked',message:'Credentials fehlen: Sammlung nicht gestartet',capabilities:dataCapabilities()},503);
     try{
      const input=await request.json(),symbol=String(input.symbol||'').toUpperCase();
      if(!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol))return json({message:'Ein gültiges Symbol erforderlich'},400);
      const period={symbol,start_date:'2021-01-01',end_date:new Date().toISOString().slice(0,10)};
      const records=await Promise.all([loadPrices(symbol,env,'all'),loadPrices(symbol,env,'none'),providerData('splits',period,env),providerData('dividends',{...period,adjust:false},env)]);
      const snapshots=[];
      for(const row of records){const stored=row.archived&&await env.BUCKET.get('snapshots/'+row.snapshotId+'.json');if(!stored)return json({status:'incomplete',message:'Nicht alle Abrufe archiviert',capabilities:dataCapabilities(records)},409);snapshots.push({id:row.snapshotId,hash:await digest(JSON.parse(await stored.text()))})}
      const record={version:CAPABILITY_VERSION,collectionId:crypto.randomUUID(),recordedAt:new Date().toISOString(),sourceCommit:SOURCE_COMMIT,symbol,snapshots,capabilities:dataCapabilities(records),purpose:'prospective-retrieval-observation',historicalVintageStatus:'unknown',decisionBeforeNextOpenStatus:'not-evaluated'};
      const saved=await env.BUCKET.put('collections/'+record.collectionId+'.json',JSON.stringify({...record,recordHash:await digest(record)}),{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
      return saved===null?json({message:'Sammlung nicht gespeichert'},409):json(record,201,{'cache-control':'no-store'});
     }catch{return json({status:'unknown',message:'Sammlung fehlgeschlagen'},400)}
    }
    if(url.pathname==='/api/experiment'){
     if(!env.BUCKET)return json({status:'unknown',message:'Archiv fehlt'},503);
     if(request.method==='GET'){
      const id=url.searchParams.get('id')||'';
      if(!/^[a-f0-9-]{36}$/.test(id))return json({message:'Ungültige Ereignis-ID'},400);
      const object=await env.BUCKET.get('experiments/'+id+'.json');
      return object?new Response(await object.text(),{headers:{'content-type':'application/json','cache-control':'no-store'}}):json({message:'Ereignis fehlt'},404);
     }
     if(request.method!=='POST')return json({message:'Nur GET/POST erlaubt'},405);
     try{
      if(!SOURCE_COMMIT)return json({status:'unknown',message:'Quellcommit fehlt'},409);
      const input=await request.json();
      if(!['registered','completed','rejected','failed'].includes(input.status)||typeof input.model!=='string'||input.model.length>100||!input.parameters||typeof input.parameters!=='object'||Array.isArray(input.parameters)||typeof input.reason!=='string'||input.reason.length>2000)return json({message:'Status, Modell, Parameter und Begründung erforderlich'},400);
      let parent=null;
      if(input.status!=='registered'){
       if(!/^[a-f0-9-]{36}$/.test(input.registeredId||''))return json({message:'Registrierung erforderlich'},400);
       const object=await env.BUCKET.get('experiments/'+input.registeredId+'.json');
       if(!object)return json({message:'Registrierung fehlt'},404);
       parent=JSON.parse(await object.text());
       if(parent.status!=='registered'||await digest(parent.parameters)!==await digest(input.parameters)||parent.model!==input.model)return json({message:'Modell oder Parameter weichen von Registrierung ab'},409);
      }
      const event={eventId:crypto.randomUUID(),registeredId:parent?.eventId||null,recordedAt:new Date().toISOString(),sourceCommit:SOURCE_COMMIT,protocol:EVALUATION_PROTOCOL,status:input.status,model:input.model,parameters:input.parameters,reason:input.reason,resultAnalysisId:input.analysisId||null};
      if(event.resultAnalysisId){
       if(!/^[a-f0-9-]{36}$/.test(event.resultAnalysisId)||!await env.BUCKET.get('analyses/'+event.resultAnalysisId+'.json'))return json({message:'Ergebnisanalyse fehlt'},400);
      }
      const saved=await env.BUCKET.put('experiments/'+event.eventId+'.json',JSON.stringify(event),{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
      return saved===null?json({message:'Unveränderliches Ereignis existiert'},409):json(event,201,{'cache-control':'no-store'});
     }catch{return json({message:'Versuchsereignis nicht speicherbar'},400)}
    }
    if(url.pathname==='/api/analysis'||url.pathname==='/api/replay'){
      if(request.method!=='GET')return json({message:'Nur GET erlaubt'},405);
      const id=url.searchParams.get('id')||'';
      if(!/^[a-f0-9-]{36}$/.test(id))return json({message:'Ungültige Analyse-ID'},400);
      if(!env.BUCKET)return json({status:'unknown',message:'Archiv nicht verfügbar'},503);
      try{
       const object=await env.BUCKET.get('analyses/'+id+'.json');
       if(!object)return json({status:'unknown',message:'Analyse fehlt'},404);
       const record=JSON.parse(await object.text());
       if(await digest({manifest:record.manifest,input:record.input,result:record.result})!==record.recordHash||await digest(record.result)!==record.manifest.resultHash)return json({status:'unknown',message:'Analyseintegrität verletzt'},409);
       if(url.pathname==='/api/analysis')return json(record,200,{'cache-control':'no-store'});
       if(!SOURCE_COMMIT||record.manifest.sourceCommit!==SOURCE_COMMIT||record.manifest.version!==REPRO_VERSION)return json({status:'unknown',message:'Replay benötigt exakt den archivierten Quellcommit'},409);
       const downloads=[];
       for(const item of record.input.downloads){
        const snapshot=await env.BUCKET.get('snapshots/'+item.snapshotId+'.json');
        if(!snapshot)return json({status:'unknown',message:'Snapshot fehlt'},409);
        const saved=JSON.parse(await snapshot.text());
        if(await digest(saved)!==record.manifest.snapshotHashes.find(entry=>entry.id===item.snapshotId)?.hash)return json({status:'unknown',message:'Snapshotintegrität verletzt'},409);
        if(record.input.kind==='simulation')continue;
        const quality=Array.isArray(saved.payload?.values)?validatePrices(saved.payload,'all',new Date(item.normalizationAt)):null;
        const error=saved.error?{symbol:item.symbol,message:saved.error}:!quality?{symbol:item.symbol,message:'Keine Kursreihe'}:!quality.usable?{symbol:item.symbol,message:quality.issues.join(' · ')||'Datenstand unbekannt'}:null;
        const row={symbol:item.symbol,normalizationAt:item.normalizationAt,snapshotId:item.snapshotId,archived:true,provenance:saved.provenance,...(quality?{bars:quality.bars,pricePayload:saved.payload,quality,currency:saved.payload.meta?.currency}:{}),...(error?{error}:{} )};
        downloads.push(row);
       }
       const response=record.input.kind==='simulation'?await worker.fetch(new Request('https://archive.local/api/simulation',{method:'POST',body:JSON.stringify(record.input.request),headers:{'content-type':'application/json'}}),env,undefined,{normalizationAt:record.input.normalizationAt}):await getResearch(new URL('https://archive.local/api/stocks'+record.input.query),{},downloads);
       const result=await response.json(),hash=await digest(result);
       return json({status:hash===record.manifest.resultHash?'identical':'mismatch',analysisId:id,resultHash:hash,manifest:record.manifest,result},hash===record.manifest.resultHash?200:409,{'cache-control':'no-store'});
      }catch{return json({status:'unknown',message:'Archiv nicht lesbar'},409)}
    }
    if(url.pathname==='/api/tradeplan'){
      if(request.method!=='POST')return json({message:'Nur POST erlaubt'},405);
      try{return json(createTradePlan(await request.json()),200,{'cache-control':'no-store'})}catch{return json({message:'Ungültige Eingabe'},400)}
    }
    if (url.pathname === "/api/simulation") {
      if(request.method!=="POST")return json({message:"Nur POST erlaubt"},405);
      try {
        const input=await request.json(),costs=validateCosts(input.costs||{}),capital=scenarioCapital(input.capital);
        if((input.currency!==undefined&&input.currency!==ANALYSIS_CONTRACT.currency)||(input.horizon!==undefined&&input.horizon!==ANALYSIS_CONTRACT.horizon)||(input.side!==undefined&&input.side!=='long')||(input.leverage!==undefined&&input.leverage!==1))return json({message:'Analysevertrag unterstützt nur Long ohne Hebel, USD und 20 Handelstage'},400);
        const context=analysisContext(capital,costs);
        if(!env.BUCKET)return json({message:"Datenarchiv nicht verfügbar"},503);
        const ids=[input.rawId,input.splitId,input.dividendId];
        if(ids.some(id=>!(/^[a-f0-9-]{36}$/).test(id)))return json({message:"Drei gültige Snapshot-IDs erforderlich"},400);
        const objects=await Promise.all(ids.map(id=>env.BUCKET.get('snapshots/'+id+'.json')));
        if(objects.some(object=>!object))return json({message:"Snapshot fehlt"},404);
        const records=await Promise.all(objects.map(async object=>JSON.parse(await object.text())));
        const [raw,splits,dividends]=records;
        if(raw.provenance.source!=='Twelve Data /time_series'||raw.provenance.parameters.adjust!=='none'||splits.provenance.source!=='Twelve Data /splits'||dividends.provenance.source!=='Twelve Data /dividends'||dividends.provenance.parameters.adjust!==false)return json({message:"Ausführung erfordert passende Rohkurse und unbereinigte Kapitalmaßnahmen"},400);
        if(records.some(record=>record.provenance.parameters.symbol!==raw.provenance.parameters.symbol))return json({message:"Snapshots gehören nicht zur selben Aktie"},400);
        const actions=normalizeActions(splits,dividends);
        // Adapter cannot assert historical vintages or full action coverage. No client override.
        const normalizationAt=replayMode?.normalizationAt||new Date().toISOString();
        const quality=adaptRawSnapshot(raw.payload,new Date(normalizationAt));
        const finishSimulation=async output=>{const result={...output,dataCapabilities:dataCapabilities(records.map(record=>({...record,archived:true})))};return json(replayMode?result:await saveAnalysis(result,url,records.map(record=>({symbol:record.provenance.parameters.symbol,snapshotId:record.snapshotId,provenance:record.provenance,archived:true,normalizationAt})),env,SOURCE_COMMIT,{kind:'simulation',request:input,normalizationAt}),200,{'cache-control':'no-store'});};
        const {bars:normalized,sessionBars,...dataQuality}=quality;
        if(!quality.usable)return finishSimulation({...context,resultType:'costScenario',resultLabel:ANALYSIS_CONTRACT.resultTypes.costScenario,analysisStatus:'unknown',returnMetrics:{stockAt20:null,strategyNet:null,capitalWindowNet:null},version:SIMULATION_VERSION,status:'blocked',reason:'Rohdatenprüfung gesperrt: '+quality.issues.join(' · '),dataQuality,costs,grossReturn:null,netReturn:null,maxDrawdown:null,daily:[],actionsIssues:actions.issues},200,{'cache-control':'no-store'});
        const bars=sessionBars;
        const index=input.decisionDate?bars.findIndex(bar=>bar.date===input.decisionDate):Math.max(0,bars.length-21);
        const result=simulateTrade(bars,index,actions,{costs,capital,horizon:ANALYSIS_CONTRACT.horizon,strict:true,priceBasis:'raw',currency:ANALYSIS_CONTRACT.currency,brokerProfile:input.brokerProfile,tradePlan:input.tradePlan,thesisInvalidations:input.thesisInvalidations});
        return finishSimulation({...context,...result,resultType:'costScenario',resultLabel:ANALYSIS_CONTRACT.resultTypes.costScenario,analysisStatus:result.status==='blocked'?'unknown':'experimental',returnMetrics:simulationReturnMetrics(result,capital),dataQuality,dayConvention:'Einstiegstag = Handelstag 1; Zeitausstieg zum regulären Schluss von Tag 20',actionsIssues:actions.issues,decisionDate:bars[index]?.date||null},200,{'cache-control':'no-store'});
      } catch {return json({message:"Ungültige Eingabe oder Archiv nicht lesbar"},400)}
    }
    if (url.pathname === "/api/data") {
      if(request.method!=="GET") return json({message:"Nur GET erlaubt"},405);
      const symbol=(url.searchParams.get('symbol')||'').toUpperCase();
      if(!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol))return json({message:"Ungültiges Symbol"},400);
      if(!env.TWELVEDATA_API_KEY)return json({status:'not-checked',message:"Credentials fehlen: Zugang nicht geprüft",dataCapabilities:dataCapabilities()},503);
      // Separate explicit audit avoids silently multiplying watchlist requests/credits.
      const period={symbol,start_date:'2021-01-01',end_date:new Date().toISOString().slice(0,10)};
      const [indicators,execution,splits,dividends]=await Promise.all([loadPrices(symbol,env,'all'),loadPrices(symbol,env,'none'),providerData('splits',period,env),providerData('dividends',{...period,adjust:false},env)]);
      const actions=normalizeActions(splits,dividends);
      const riskBars=execution.quality?.usable?execution.quality.sessionBars:[];
      const rawRisk=riskAt(riskBars,riskBars.length-1,{priceBasis:'raw',volumeBasis:'raw',currency:execution.currency,mic:execution.quality?.meta?.mic_code,asOf:execution.normalizationAt,actions});
      return json({symbol,rawRisk,dataCapabilities:dataCapabilities([indicators,execution,splits,dividends]),dataVersion:DATA_VERSION,indicators,execution,actions,sources:{splits,dividends},strictBacktest:{status:'blocked',reason:'Keine belegten historischen Veröffentlichungsstände und vollständigen Kapitalmaßnahmendaten'},archiveStatus:[indicators,execution,splits,dividends].every(r=>r.archived)?'saved':'unavailable'},200,{'cache-control':'no-store'});
    }
    if (url.pathname === "/api/snapshot") {
      const id=url.searchParams.get('id')||'';
      if(!/^[a-f0-9-]{36}$/.test(id))return json({message:'Ungültige Snapshot-ID'},400);
      if(!env.BUCKET)return json({message:'Archiv nicht verfügbar'},503);
      const object=await env.BUCKET.get('snapshots/'+id+'.json');
      if(!object)return json({message:'Snapshot nicht gefunden'},404);
      return new Response(await object.text(),{headers:{'content-type':'application/json','cache-control':'no-store'}});
    }
    if (url.pathname === "/api/calendar") {
      if(request.method !== "GET") return json({message:"Nur GET ist erlaubt."},405);
      try { return await calendar(url, env); } catch { return json({message:"Kalenderdienst konnte die Anfrage nicht abschließen. Bitte erneut versuchen."},502); }
    }
    if (url.pathname === "/api/stocks") {
      if (request.method !== "GET") return json({ error: "method_not_allowed", message: "Nur GET ist erlaubt." }, 405);
      return getResearch(url, env);
    }
    if (url.pathname !== "/") return new Response("Nicht gefunden", { status: 404 });
    return new Response(page, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
      },
    });
  },
};

export default worker;

async function getResearch(url, env, replayDownloads=null) {
  const apiKey = env.TWELVEDATA_API_KEY;
  if (!apiKey && !replayDownloads) {
    return json({ error: "api_key_missing", message: "Das Site-Secret TWELVEDATA_API_KEY ist nicht gesetzt." }, 503);
  }

  const symbols = [...new Set((url.searchParams.get("symbols") || "")
    .split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))];
  if (!symbols.length || symbols.length > 7 || symbols.includes("SPY") ||
      symbols.some((symbol) => !/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol))) {
    return json({ error: "invalid_symbols", message: "Bitte 1 bis 7 US-Aktien-Symbole eingeben. SPY wird als Marktvergleich automatisch geladen." }, 400);
  }

  if((url.searchParams.has('currency')&&url.searchParams.get('currency')!=='USD')||(url.searchParams.has('horizon')&&url.searchParams.get('horizon')!=='20')||(url.searchParams.has('side')&&url.searchParams.get('side')!=='long')||(url.searchParams.has('leverage')&&url.searchParams.get('leverage')!=='1'))return json({message:'Analysevertrag unterstützt nur Long ohne Hebel, USD und 20 Handelstage'},400);
  let context;
  try{context=analysisContext(url.searchParams.has('capital')?Number(url.searchParams.get('capital')):undefined,DEFAULT_COSTS)}catch(error){return json({message:error.message},400)}
  const requested = [...symbols, "SPY"];
  const downloads = replayDownloads || await Promise.all(requested.map((symbol) => fetchHistory(symbol, env)));
  const finish=async (output,status=200)=>{const result={...output,dataCapabilities:dataCapabilities(downloads)};return json(replayDownloads?result:await saveAnalysis(result,url,downloads,env,SOURCE_COMMIT),status,{"cache-control":"no-store"});};
  const bySymbol = Object.fromEntries(downloads.filter((item) => item.bars).map((item) => [item.symbol, item]));
  const errors = downloads.filter((item) => item.error).map((item) => item.error);
  const backtest = historicalBacktest(downloads, symbols);
  const benchmark = bySymbol.SPY;
  if (!benchmark || !benchmark.quality?.usable || benchmark.bars.length < 100) {
    return finish({ ...context,analysisStatus:"unknown",error: "benchmark_unavailable", message: "SPY fehlt oder ist veraltet: keine belastbare Analyse.", errors, backtest, dataQuality:downloads.map(item=>{const {bars,sessionBars,...quality}=item.quality||{};return {symbol:item.symbol,quality,provenance:item.provenance,archived:item.archived}}) }, 502);
  }

  // Expected exchange sessions form the spine: missing SPY rows must not compress time.
  const dates=[];const cursor=new Date('2021-01-04T12:00:00Z');
  while(cursor.toISOString().slice(0,10)<=benchmark.quality.expectedLastSession){const day=cursor.toISOString().slice(0,10);if(session(day,benchmark.quality.meta.mic_code)?.open)dates.push(day);cursor.setUTCDate(cursor.getUTCDate()+1)}
  const marketMap=new Map(benchmark.bars.map(bar=>[bar.date,bar]));
  const marketBars=dates.map(day=>marketMap.get(day)||null);
  const marketFeatures = dates.map((_, index) => featureAt(marketBars, marketBars, index));
  const series = [];
  for (const symbol of symbols) {
    const downloaded = bySymbol[symbol];
    if (!downloaded || !downloaded.quality?.usable) continue;
    const map = new Map(downloaded.bars.map((bar) => [bar.date, bar]));
    const aligned = dates.map((date) => map.get(date) || null);
    const current = featureAt(aligned, marketBars, aligned.length - 1);
    if (!current) {
      errors.push({ symbol, message: "Zu wenig zusammenhängende Kursgeschichte für das 20-Tage-Modell." });
      continue;
    }
    series.push({ symbol, bars: aligned, current,mic:downloaded.quality.meta.mic_code,qualityUsable:downloaded.quality?.usable });
  }
  if (!series.length) return finish({ ...context,analysisStatus:"unknown",provider: "Twelve Data", stocks: [], errors, backtest, dataQuality:downloads.map(item=>({symbol:item.symbol,quality:item.quality,provenance:item.provenance,archived:item.archived})) }, 200);

  const currentIndex = dates.length - 1;
  const records = Object.fromEntries(series.map((stock) => [stock.symbol, buildRecords(stock.bars, marketBars, marketFeatures)]));
  const currentForecasts = series.map((stock) => {
    const forecast = estimate(stock.current, records[stock.symbol], marketFeatures[currentIndex]?.r20 >= 0, currentIndex);
    const featureRecords=[];
    for(let index=80;index+20<stock.bars.length;index+=20){const features=featureAt(stock.bars,marketBars,index),outcome=simulateTarget(stock.bars,index);if(features&&outcome)featureRecords.push({index,features,marketUp:marketFeatures[index]?.r20>=0,proxyReturn:outcome.tradeReturn,...executionLabel(null,index,null,{priceBasis:'adjusted'})});}
    const options={marketUp:marketFeatures[currentIndex]?.r20>=0};
    const newAnalogs={proxy:estimateFeatures(stock.current,featureRecords,currentIndex,{...options,basis:'proxy'}),net:estimateFeatures(stock.current,featureRecords,currentIndex,{...options,basis:'net'})};
    return { ...stock.current, symbol: stock.symbol, close: stock.bars[currentIndex]?.close,
      risk: riskAt(stock.bars,currentIndex,{priceBasis:'adjusted',volumeBasis:'unknown',mic:stock.mic}), asOf: dates[currentIndex], qualityUsable:stock.qualityUsable, newAnalogs, ...forecast, analysisStatus:candidateStatus(forecast),resultType:'historical',expectedNetReturn:null,returnMetrics:{historicalStrategyMean:forecast.expectedReturn,stockAt20:null,strategyNet:null,capitalWindowNet:null}, historyBars: stock.bars.filter(Boolean).length };
  });
  currentForecasts.sort((a, b) =>
    (b.expectedReturn ?? -Infinity) - (a.expectedReturn ?? -Infinity) ||
    (b.probabilityTarget ?? -Infinity) - (a.probabilityTarget ?? -Infinity) ||
    b.score - a.score);

  const marketNow = marketFeatures[currentIndex] || {};
  return finish({
    ...context,analysisStatus:watchlistStatus(symbols.map(symbol=>currentForecasts.find(stock=>stock.symbol===symbol)||{analysisStatus:"unknown"})),
    provider: "Twelve Data",
    asOf: dates[currentIndex],
    benchmark: { symbol: "SPY", close: marketBars[currentIndex]?.close, r20: marketNow.r20, r60: marketNow.r60 },
    riskModel:{version:RISK_VERSION,status:'experimental',thresholdsApplied:false,rankingChanged:false},
    comparisonModel:{version:ANALOGUE_VERSION,parameters:ANALOGUE_PARAMETERS,rankingChanged:false,outOfSampleVerified:false},
    model: { version: "reference-v1", target: TARGET, horizon: HORIZON, minAnalogs: MIN_ANALOGS,
      factors: ["20-Tage-Momentum", "60-Tage-Momentum", "relative Stärke gegen SPY", "Abstand zum 50-Tage-Mittel", "Volatilität"] },
    stocks: currentForecasts,
    best: currentForecasts.find((stock) => stock.qualityUsable && stock.sampleCount >= MIN_ANALOGS && stock.expectedReturn > 0) || null,
    backtest: {...backtest, validationStatus:"selection-v2-retrospective-only", pointInTimeVerified:false,
      warning:"Präfixbasierte Auswahl (selection-v2) auf heute abgerufener bereinigter Historie; keine belegte damalige Verfügbarkeit, keine handelbaren Rohkursausführungen. Nicht als validierter Backtest verwenden."},
    automaticSimulation:{status:"blocked",reason:"Vollständige Kapitalmaßnahmen und historische Datenstände fehlen",costs:DEFAULT_COSTS,version:SIMULATION_VERSION,grossReturn:null,netReturn:null,maxDrawdown:null,daily:[],dayConvention:"Einstiegstag = Handelstag 1; maximal 20 Handelstage, kein Stop-Loss",automatic:true,scenario:context.scenario,resultType:"costScenario",analysisStatus:"unknown"},
    executionModel:{version:SIMULATION_VERSION,horizon:20,target:0.05,entryDayCounts:true,noStopLoss:true,costs:DEFAULT_COSTS,costAssumptions:true},
    strictBacktest:{status:"blocked",reason:"Historische Veröffentlichungsstände und vollständige Kapitalmaßnahmenabdeckung fehlen"},
    dataVersion:DATA_VERSION,
    dataQuality:downloads.map(item=>{const {bars,sessionBars,...quality}=item.quality||{};return {symbol:item.symbol,quality,provenance:item.provenance,snapshotId:item.snapshotId,archived:item.archived,error:item.error||null}}),
    errors,
  }, 200, { "cache-control": "private, max-age=180" });
}

async function fetchHistory(symbol, env) {
  const result=await loadPrices(symbol,env,'all');
  if(result.quality && (result.quality.usable!==true || !result.quality.lastSession || result.quality.lastSession!==result.quality.expectedLastSession))return {...result,error:{symbol,message:result.quality.issues.join(' · ')||'Datenstand unbekannt'}};
  return result;
}

function historicalBacktest(downloads, symbols){
 const benchmark=downloads.find(item=>item.symbol==='SPY');
 if(!benchmark?.bars?.length||!benchmark.quality?.expectedLastSession)return null;
 const dates=[],cursor=new Date('2021-01-04T12:00:00Z');
 while(cursor.toISOString().slice(0,10)<=benchmark.quality.expectedLastSession){const day=cursor.toISOString().slice(0,10);if(session(day,benchmark.quality.meta.mic_code)?.open)dates.push(day);cursor.setUTCDate(cursor.getUTCDate()+1)}
 const align=bars=>{const map=new Map(bars.map(bar=>[bar.date,bar]));return dates.map(day=>map.get(day)||null)};
 const marketBars=align(benchmark.bars),marketFeatures=dates.map((_,i)=>featureAt(marketBars,marketBars,i));
 const series=downloads.filter(item=>symbols.includes(item.symbol)&&item.bars?.length).map(item=>({symbol:item.symbol,bars:align(item.bars),historicalQuality:index=>validatePricePrefix(item.pricePayload,'all',dates[index]).usable&&validatePricePrefix(benchmark.pricePayload,'all',dates[index]).usable}));
 const records=Object.fromEntries(series.map(stock=>[stock.symbol,buildRecords(stock.bars,marketBars,marketFeatures)]));
 return {...walkForward(series,records,marketBars,marketFeatures,dates),validationStatus:'selection-v2-retrospective-only',pointInTimeVerified:false,warning:'Präfixbasierte Auswahl auf heute abgerufener bereinigter Historie; historische Verfügbarkeit und Rohkursausführung nicht belegt. Keine geprüfte Prognosegüte.'};
}

function featureAt(stockBars, marketBars, index) {
  if (index < 60 || !stockBars[index] || !marketBars[index]) return null;
  for (let cursor = index - 60; cursor <= index; cursor += 1) {
    if (!stockBars[cursor] || !marketBars[cursor]) return null;
  }
  const close = stockBars[index].close;
  const r20 = close / stockBars[index - 20].close - 1;
  const r60 = close / stockBars[index - 60].close - 1;
  const marketR20 = marketBars[index].close / marketBars[index - 20].close - 1;
  const marketR60 = marketBars[index].close / marketBars[index - 60].close - 1;
  const rel20 = r20 - marketR20;
  let average50 = 0;
  for (let cursor = index - 49; cursor <= index; cursor += 1) average50 += stockBars[cursor].close / 50;
  const trend50 = close / average50 - 1;
  const daily = [];
  for (let cursor = index - 19; cursor <= index; cursor += 1) {
    daily.push(stockBars[cursor].close / stockBars[cursor - 1].close - 1);
  }
  const mean = daily.reduce((sum, value) => sum + value, 0) / daily.length;
  const variance = daily.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (daily.length - 1);
  const vol20 = Math.sqrt(variance * 252);
  const score = 0.25 * scale(r20, 300) + 0.20 * scale(r60, 150) +
    0.25 * scale(rel20, 300) + 0.20 * scale(trend50, 250) +
    0.10 * clamp(100 - vol20 * 80, 0, 100);
  return { r20, r60, rel20, trend50, vol20, score, marketR20, marketR60 };
}

function buildRecords(stockBars, marketBars, marketFeatures) {
  const records = [];
  for (let index = 80; index + HORIZON < stockBars.length; index += HORIZON) {
    const features = featureAt(stockBars, marketBars, index);
    const outcome = simulateTarget(stockBars, index);
    if (features && outcome) records.push({ index, score: features.score,
      marketUp: (marketFeatures[index]?.r20 ?? 0) >= 0, ...outcome });
  }
  return records;
}

function simulateTarget(bars, decisionIndex) {
  const entryIndex = decisionIndex + 1;
  const exitIndex = decisionIndex + HORIZON;
  const entry = bars[entryIndex]?.open;
  if (!entry || !bars[exitIndex]) return null;
  let targetHit = false;
  let lowest = entry;
  for (let index = entryIndex; index <= exitIndex; index += 1) {
    if (!validHistoricalBar(bars[index])) return null;
    if (bars[index].high >= entry * (1 + TARGET)) targetHit = true;
    lowest = Math.min(lowest, bars[index].low);
  }
  const exitReturn = targetHit ? TARGET : bars[exitIndex].close / entry - 1;
  return { tradeReturn: exitReturn, targetHit, adverseMove: lowest / entry - 1 };
}

function estimate(features, records, marketUp, currentIndex) {
  const mature = records.filter((record) => record.index + HORIZON <= currentIndex);
  const sameRegime = mature.filter((record) => record.marketUp === marketUp);
  const pool = sameRegime.length >= MIN_ANALOGS ? sameRegime : mature;
  const analogs = pool.sort((a, b) => Math.abs(a.score - features.score) - Math.abs(b.score - features.score)).slice(0, 30);
  if (analogs.length < MIN_ANALOGS) return { sampleCount: analogs.length, expectedReturn: null, probabilityTarget: null,
    p10: null, p90: null, probabilityLow: null, probabilityHigh: null, averageAdverseMove: null };
  const returns = analogs.map((record) => record.tradeReturn).sort((a, b) => a - b);
  const hits = analogs.filter((record) => record.targetHit).length;
  return {
    sampleCount: analogs.length,
    expectedReturn: returns.reduce((sum, value) => sum + value, 0) / returns.length,
    probabilityTarget: hits / analogs.length,
    probabilityLow: wilson(hits, analogs.length)[0],
    probabilityHigh: wilson(hits, analogs.length)[1],
    p10: quantile(returns, 0.10),
    p90: quantile(returns, 0.90),
    averageAdverseMove: analogs.reduce((sum, record) => sum + record.adverseMove, 0) / analogs.length,
  };
}

function validHistoricalBar(bar){
 return !!bar&&[bar.open,bar.high,bar.low,bar.close].every(value=>Number.isFinite(value)&&value>0)&&bar.high>=Math.max(bar.open,bar.close,bar.low)&&bar.low<=Math.min(bar.open,bar.close,bar.high);
}
function prefixUsable(bars,index){
 for(let i=0;i<=index;i++)if(!validHistoricalBar(bars[i])||(i>0&&Math.abs(bars[i].close/bars[i-1].close-1)>.5))return false;
 return true;
}
function walkForward(series, records, marketBars, marketFeatures, dates) {
  const testStart = 260; // Fixed session-grid anchor; provider window never resets phase.
  const windows = [];
  for (let index = testStart; index + HORIZON < dates.length; index += HORIZON) {
    // Finish the decision before reading any evaluation-window prices.
    const universe=series.filter(stock=>stock.historicalQuality?stock.historicalQuality(index):prefixUsable(stock.bars,index)&&prefixUsable(marketBars,index));
    const ranked = universe.map(stock=>{
      const features=featureAt(stock.bars,marketBars,index);
      if(!features)return null;
      const fit=estimate(features,records[stock.symbol]||[],marketFeatures[index]?.r20>=0,index);
      return {symbol:stock.symbol,features,...fit};
    }).filter(row=>row&&row.sampleCount>=MIN_ANALOGS&&Number.isFinite(row.expectedReturn))
      .sort((a,b)=>b.expectedReturn-a.expectedReturn||b.probabilityTarget-a.probabilityTarget||b.features.score-a.features.score);
    const pick=ranked[0]?.expectedReturn>0?ranked[0]:null;
    const assessable=ranked.length>0;
    const outcome=pick?simulateTarget(series.find(stock=>stock.symbol===pick.symbol).bars,index):null;
    const marketOutcome=simulateTarget(marketBars,index);
    windows.push({decisionDate:dates[index],date:dates[index+1],universe:universe.map(stock=>stock.symbol),candidates:ranked,
      symbol:pick?.symbol||null,expectedReturn:pick?.expectedReturn??null,expectedTargetProbability:pick?.probabilityTarget??null,
      outcomeStatus:pick?(outcome?'known':'unknown'):assessable?'cash':'unknown',realizedReturn:pick?(outcome?.tradeReturn??null):assessable?0:null,
      targetHit:pick?(outcome?.targetHit??null):assessable?false:null,averageAdverseMove:pick?(outcome?.adverseMove??null):assessable?0:null,
      benchmarkStatus:marketOutcome?'known':'unknown',benchmarkReturn:marketOutcome?.tradeReturn??null,benchmarkTargetHit:marketOutcome?.targetHit??null});
  }
  const trades=windows.filter(row=>row.symbol),knownTrades=trades.filter(row=>row.outcomeStatus==='known');
  const knownWindows=windows.filter(row=>Number.isFinite(row.realizedReturn));
  const knownBenchmark=windows.filter(row=>Number.isFinite(row.benchmarkReturn));
  const paired=windows.filter(row=>Number.isFinite(row.realizedReturn)&&Number.isFinite(row.benchmarkReturn));
  const unknownOutcomeCount=trades.length-knownTrades.length;
  return {version:'selection-v2',method:'Walk-forward, präfixbasierte Auswahl vor späterer Auswertung; nicht überlappende 20-Tage-Perioden',
    testFrom:windows[0]?.date||null,testTo:windows.at(-1)?.date||null,windows:windows.length,tradeCount:trades.length,
    knownOutcomeCount:knownTrades.length,unknownOutcomeCount,cashCount:windows.filter(row=>row.outcomeStatus==='cash').length,unknownDecisionCount:windows.filter(row=>!row.symbol&&row.outcomeStatus==='unknown').length,
    knownWindowCount:knownWindows.length,knownBenchmarkCount:knownBenchmark.length,unknownBenchmarkCount:windows.length-knownBenchmark.length,pairedWindowCount:paired.length,
    aggregateBasis:'Mittelwerte nur über bekannte Ergebnisse; Überschuss nur über paarweise bekannte Fenster. Unbekannt ist kein Cash und kein Nullertrag.',target:TARGET,
    averageReturnPerWindow:mean(knownWindows.map(row=>row.realizedReturn)),averageTradeReturn:mean(knownTrades.map(row=>row.realizedReturn)),
    hitRate:knownTrades.length?knownTrades.filter(row=>row.targetHit).length/knownTrades.length:null,
    winRate:knownTrades.length?knownTrades.filter(row=>row.realizedReturn>0).length/knownTrades.length:null,
    averageAdverseMove:mean(knownTrades.map(row=>row.averageAdverseMove)),averageBenchmarkReturn:mean(knownBenchmark.map(row=>row.benchmarkReturn)),
    excessPerWindow:mean(paired.map(row=>row.realizedReturn-row.benchmarkReturn)),
    maxDrawdown:windows.some(row=>row.outcomeStatus==='unknown')?null:maxDrawdown(windows.map(row=>row.realizedReturn)),
    minimumTrades:12,sufficientSample:knownTrades.length>=12,decisions:windows,recent:windows.slice(-10).reverse()};
}

function maxDrawdown(returns) {
  let equity = 1, peak = 1, drawdown = 0;
  for (const value of returns) {
    equity *= 1 + value;
    peak = Math.max(peak, equity);
    drawdown = Math.min(drawdown, equity / peak - 1);
  }
  return drawdown;
}
function mean(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function quantile(sorted, p) { return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))]; }
function wilson(hits, total) {
  const z = 1.96, p = hits / total, denominator = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total) / denominator;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}
function scale(value, sensitivity) { return clamp(50 + value * sensitivity, 0, 100); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff", ...extraHeaders },
  });
}

async function calendar(url,env){
 if(url.searchParams.has('symbols')===false)return json({message:'Symbole fehlen'},400);
 const symbols=[...new Set(url.searchParams.get('symbols').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean))];
 if(!symbols.length||symbols.length>7||symbols.some(s=>!/^[A-Z][A-Z0-9.-]{0,9}$/.test(s)))return json({message:'Bitte 1–7 gültige Symbole eingeben'},400);
 const start=new Date().toISOString().slice(0,10),end=new Date(Date.now()+35*86400000).toISOString().slice(0,10),events=[],sources=[];
 const bls='https://www.bls.gov/schedule/news_release/bls.ics';
 try{
  const response=await fetch(bls,{signal:AbortSignal.timeout(4000)});if(!response.ok)throw Error('HTTP '+response.status);
  const text=(await response.text()).replace(/\r?\n[ \t]/g,'');let parsed=0;
  for(const block of text.split('BEGIN:VEVENT').slice(1)){
   const title=block.match(/(?:^|\n)SUMMARY:([^\r\n]+)/)?.[1],raw=block.match(/(?:^|\n)DTSTART[^:]*:(\d{8})(?:T(\d{6})(Z)?)?/);
   if(!title||!raw)continue;parsed++;
   const date=raw[1].slice(0,4)+'-'+raw[1].slice(4,6)+'-'+raw[1].slice(6,8);
   const points=/Consumer Price Index|Employment Situation/i.test(title)?35:/Producer Price Index|Employment Cost Index|Job Openings/i.test(title)?20:0;
   if(points&&date>=start&&date<=end)events.push({date,title,symbol:null,points,source:bls,time:raw[2]?raw[2].slice(0,2)+':'+raw[2].slice(2,4)+(raw[3]?' UTC':' US Eastern'):'Unbekannt'});
  }
  if(!parsed)throw Error('Antwort enthält keine lesbaren Kalendertermine');sources.push({name:'BLS',ok:true,message:'Live abgerufen · Inflation und Arbeitsmarkt'});
 }catch(error){
 const fallback=[['2026-10-14','Consumer Price Index',35,'08:30'],['2026-10-15','Producer Price Index',20,'08:30'],['2026-10-30','Employment Cost Index',20,'08:30'],['2026-11-03','Job Openings and Labor Turnover Survey',20,'10:00'],['2026-11-06','Employment Situation',35,'08:30']];
 for(const [date,title,points,time] of fallback.filter(r=>r[0]>=start&&r[0]<=end))events.push({date,title:title+' · Ersatzdatenstand 04.10.2026',symbol:null,points,time:time+' US Eastern',source:'https://www.bls.gov/schedule/2026/'+date.slice(5,7)+'_sched.htm'});
 const reason=error.name==='TimeoutError'?'Zeitlimit überschritten':/^HTTP \d+$/.test(error.message)?error.message:'Verbindung oder Kalenderformat fehlgeschlagen';
 sources.push({name:'BLS',ok:false,message:'Live-Abruf: '+reason+' · offiziell geprüfte Ersatztermine vom 04.10.2026, Abdeckung unvollständig'});
 }
 const fed='https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm';
 const fresh=start<='2026-11-04';
 for(const date of ['2026-10-28','2026-12-09','2027-01-27','2027-03-17','2027-04-28','2027-06-09','2027-07-28','2027-09-15','2027-10-27','2027-12-08'].filter(d=>d>=start&&d<=end))events.push({date,title:'FOMC · letzter Sitzungstag',symbol:null,points:35,source:fed,time:'Uhrzeit nicht verifiziert'});
 sources.push({name:'Fed',ok:fresh,message:'Offizieller Terminstand 04.10.2026 · keine Live-Aktualisierung'+(fresh?'':' · veraltet, bitte Quelle prüfen')});
 try{
  if(!env.TWELVEDATA_API_KEY)throw Error();
  const endpoint=new URL('https://api.twelvedata.com/earnings_calendar');
  for(const [k,v] of Object.entries({apikey:env.TWELVEDATA_API_KEY,start_date:start,end_date:end,country:'United States'}))endpoint.searchParams.set(k,v);
  const response=await fetch(endpoint,{signal:AbortSignal.timeout(4000)});
  const text=await response.text();let payload;
  try{payload=JSON.parse(text)}catch{throw Error('format')}
  if(!response.ok||payload.status==='error'){
    const code=Number(payload.code)||response.status;
    const message=String(payload.message||'');
    throw Error(code===429?'limit':/plan|subscription|upgrade|permission|not available.*tier/i.test(message)?'plan':code===401||code===403?'auth':'provider-'+code);
  }
  if(!payload.earnings||typeof payload.earnings!=='object')throw Error('schema');
  const rows=Object.entries(payload.earnings).flatMap(([date,items])=>Array.isArray(items)?items.map(item=>({...item,date})):[]);
  for(const row of rows.filter(r=>symbols.includes(r.symbol)&&r.date>=start&&r.date<=end))events.push({date:row.date,title:row.symbol+' · Quartalszahlen (Providertermin)',symbol:row.symbol,points:60,source:'https://twelvedata.com/fundamentals',time:row.time||'Unbekannt'});
  sources.push({name:'Twelve Data',ok:rows.length<1200,message:rows.length<1200?'Live abgerufen · Termine nicht durch Unternehmen bestätigt; kein Treffer garantiert keine Terminfreiheit':'Ergebnislimit erreicht · Abdeckung unvollständig'});
 }catch(error){
 const reasons={limit:'API-Kreditlimit erreicht',plan:'Endpunkt laut Anbieter im Tarif nicht freigeschaltet',auth:'API-Zugriff abgelehnt (Schlüssel oder Berechtigung)',format:'Anbieter lieferte keine lesbare JSON-Antwort',schema:'Anbieterantwort enthält keinen Earnings-Kalender'};
 const reason=error.name==='TimeoutError'?'Zeitlimit überschritten':reasons[error.message]||(/^provider-\d+$/.test(error.message)?'Anbieterfehler '+error.message.slice(9):'Verbindung fehlgeschlagen');
 sources.push({name:'Twelve Data',ok:false,message:reason+' · Quartalszahlen unbekannt. Endpunkt benötigt 40 Credits.'});
 }
 const complete=sources.every(s=>s.ok);events.sort((a,b)=>a.date.localeCompare(b.date));
 const risks=symbols.map(symbol=>{const relevant=events.filter(e=>!e.symbol||e.symbol===symbol),points=Math.min(100,relevant.reduce((n,e)=>n+e.points,0));return{symbol,score:complete?points:null,knownPoints:points,label:complete?(points>=60?'Hoch':points>=30?'Erhöht':'Niedrig'):'Unbekannt / unvollständig'};});
 return json({start,end,checkedAt:new Date().toISOString(),events,sources,risks},200,{'cache-control':'private, max-age=3600'});
}

