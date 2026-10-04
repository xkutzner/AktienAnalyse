// data-v4: preserve volume; prefix-only experimental risk with explicit price/volume bases.
export const DATA_VERSION='data-v4';
const SUPPORTED=new Set(['XNAS','XNGS','XNMS','XNCM','XNYS','ARCX','XASE']);
const CALENDAR_SOURCE='https://www.nyse.com/trade/hours-calendars';
export function localParts(now,zone='America/New_York'){
 return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
}
const iso=d=>d.toISOString().slice(0,10);
const date=(y,m,d)=>new Date(Date.UTC(y,m-1,d));
function nth(y,m,weekday,n){const d=date(y,m,1);d.setUTCDate(1+(weekday-d.getUTCDay()+7)%7+7*(n-1));return iso(d)}
function last(y,m,weekday){const d=date(y,m+1,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()-weekday+7)%7);return iso(d)}
function observed(y,m,d){const t=date(y,m,d);if(t.getUTCDay()===6)t.setUTCDate(d-1);if(t.getUTCDay()===0)t.setUTCDate(d+1);return iso(t)}
function goodFriday(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;const t=date(y,month,day);t.setUTCDate(day-2);return iso(t)}
export function session(day,mic){
 if(!SUPPORTED.has(mic)||!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
 const y=Number(day.slice(0,4));if(y<2021||y>2027)return null;
 const d=new Date(day+'T12:00:00Z');if(iso(d)!==day)return null;
 const holidays=[nth(y,1,1,3),nth(y,2,1,3),goodFriday(y),last(y,5,1),observed(y,7,4),nth(y,9,1,1),nth(y,11,4,4),observed(y,12,25)];
 // NYSE does not observe a Saturday New Year's Day on preceding Friday.
 if(date(y,1,1).getUTCDay()!==6)holidays.push(observed(y,1,1));
 if(y>=2022)holidays.push(observed(y,6,19));
 if(y===2025)holidays.push('2025-01-09');
 if(d.getUTCDay()===0||d.getUTCDay()===6||holidays.includes(day))return {date:day,open:false};
 const early={2021:['2021-11-26'],2022:['2022-11-25'],2023:['2023-07-03','2023-11-24'],2024:['2024-07-03','2024-11-29','2024-12-24'],2025:['2025-07-03','2025-11-28','2025-12-24'],2026:['2026-11-27','2026-12-24'],2027:['2027-11-26']};
 return {date:day,open:true,closeLocal:early[y].includes(day)?'13:00:00':'16:00:00',timezone:'America/New_York',source:CALENDAR_SOURCE,calendarVersion:'us-core-2021-2027-20261004',historicallyVerified:y>=2025};
}
export function lastCompleted(now,mic){
 const p=localParts(now),today=p.year+'-'+p.month+'-'+p.day,clock=p.hour+':'+p.minute+':'+p.second;
 let day=new Date(today+'T12:00:00Z');
 for(let i=0;i<14;i++,day.setUTCDate(day.getUTCDate()-1)){
  const s=session(iso(day),mic);if(!s)return null;
  if(s.open&&(s.date!==today||clock>=s.closeLocal))return s;
 }
 return null;
}
export function adaptPrices(payload,adjust,now=new Date()){
 const meta=payload.meta||{},mic=meta.mic_code,cutoff=lastCompleted(now,mic),issues=[];
 if(!cutoff||meta.exchange_timezone!=='America/New_York'||meta.currency!=='USD')return {bars:[],sessionBars:[],usable:false,issues:['Börse, Zeitzone oder Währung nicht unterstützt bzw. nicht bestätigt.'],meta,expectedLastSession:cutoff?.date||null};
 const map=new Map(),seen=new Set(),acceptedDays=[];let duplicates=0,invalid=0,unclosed=0,nonSessions=0;
 for(const row of payload.values||[]){
  const day=String(row.datetime||'').slice(0,10),s=session(day,mic);
  if(!s){invalid++;continue}if(!s.open){nonSessions++;continue}if(day>cutoff.date){unclosed++;continue}
  acceptedDays.push(day);
  // Count duplicates before OHLC validation; never let a later row restore a day.
  const duplicate=seen.has(day);seen.add(day);
  if(duplicate){duplicates++;map.set(day,null);}
  const bar={date:day,open:Number(row.open),high:Number(row.high),low:Number(row.low),close:Number(row.close),volume:row.volume!==null&&row.volume!==undefined&&String(row.volume).trim()!==''&&Number.isFinite(Number(row.volume))&&Number(row.volume)>=0?Number(row.volume):null,halted:row.halted===true?true:null};
  if(![bar.open,bar.high,bar.low,bar.close].every(v=>Number.isFinite(v)&&v>0)||bar.high<Math.max(bar.open,bar.close,bar.low)||bar.low>Math.min(bar.open,bar.close,bar.high)){invalid++;continue}
  if(!duplicate)map.set(day,bar);
 }
 const bars=[...map.values()].filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
 const missing=[],sessionBars=[];if(acceptedDays.length){let day=new Date(acceptedDays.sort()[0]+'T12:00:00Z');while(iso(day)<=cutoff.date){const value=iso(day);if(session(value,mic)?.open){const bar=map.get(value);if(!bar)missing.push(value);sessionBars.push(bar||{date:value,missing:true});}day.setUTCDate(day.getUTCDate()+1)}}
 const stale=bars.at(-1)?.date!==cutoff.date;
 if(duplicates)issues.push(duplicates+' doppelte Tagesdatensätze ausgeschlossen');if(invalid)issues.push(invalid+' ungültige Datensätze ausgeschlossen');if(nonSessions)issues.push(nonSessions+' Kurse an Nicht-Handelstagen ausgeschlossen');if(missing.length)issues.push(missing.length+' fehlende Handelstage');if(stale)issues.push('Veraltet: letzter Kurs entspricht nicht dem letzten abgeschlossenen Handelstag');
 const jumps=[];for(let i=1;i<bars.length;i++)if(Math.abs(bars[i].close/bars[i-1].close-1)>.5)jumps.push(bars[i].date);
 if(jumps.length)issues.push(jumps.length+' Kurssprünge über 50 %: Kapitalmaßnahmenprüfung nötig');
 return {bars,sessionBars,meta,adjust,usable:!stale&&invalid===0&&duplicates===0&&nonSessions===0&&missing.length===0&&(adjust==='none'||jumps.length===0),issues,expectedLastSession:cutoff.date,lastSession:bars.at(-1)?.date||null,missingSessions:missing,invalid,duplicates,excludedUnclosed:unclosed,jumps,calendar:cutoff};
}
// Research and execution use the same normalization and qualification rules.
export function validatePrices(payload,adjust,now=new Date()){
 return adaptPrices(payload,adjust,now);
}
export function adaptRawSnapshot(payload,now=new Date()){
 // An archived scenario need not end today. Never accept an unfinished session.
 const dates=(payload?.values||[]).map(row=>String(row.datetime||'').slice(0,10)).filter(day=>session(day,payload?.meta?.mic_code)?.open).sort();
 const last=dates.at(-1),archiveEnd=last?new Date(last+'T23:00:00Z'):now;
 return adaptPrices(payload||{},'none',archiveEnd<now?archiveEnd:now);
}
// Retrospective prefix check, not proof of historical publication availability.
export function validatePricePrefix(payload,adjust,decisionDate){
 return validatePrices({...payload,values:(payload.values||[]).filter(row=>String(row.datetime||'').slice(0,10)<=decisionDate)},adjust,new Date(decisionDate+'T23:00:00Z'));
}
export async function providerData(endpoint,parameters,env){
 if(!env.TWELVEDATA_API_KEY)return {payload:null,error:'Credentials fehlen: Zugang nicht geprüft',accessStatus:'not-checked',snapshotId:null,archived:false,provenance:{source:'Twelve Data /'+endpoint,parameters,retrievedAt:null,publicationTime:null,availableAt:null,historicalVintage:null,httpStatus:null,period:{from:parameters.start_date||null,to:parameters.end_date||null}}};
 const retrievedAt=new Date().toISOString(),url=new URL('https://api.twelvedata.com/'+endpoint);
 for(const [k,v] of Object.entries(parameters))url.searchParams.set(k,String(v));url.searchParams.set('apikey',env.TWELVEDATA_API_KEY);
 let payload=null,error=null,status=null;
 try{const response=await fetch(url,{signal:AbortSignal.timeout(12000)});status=response.status;payload=await response.json();if(!response.ok||payload.status==='error'){const message=String(payload.message||'');error=Number(payload.code)===429||status===429?'Kreditlimit erreicht':/plan|subscription|upgrade|permission/i.test(message)?'Im Tarif nicht freigeschaltet':'Anbieterfehler HTTP '+status;payload=null}}catch{error='Verbindung, Zeitlimit oder Antwortformat fehlgeschlagen'}
 if(payload&&env.TWELVEDATA_API_KEY)payload=JSON.parse(JSON.stringify(payload).split(env.TWELVEDATA_API_KEY).join('[REDACTED]'));
 const provenance={source:'Twelve Data /'+endpoint,parameters,requestedAt:retrievedAt,retrievedAt:new Date().toISOString(),publicationTime:null,availableAt:null,historicalVintage:null,pointInTimeVerified:false,httpStatus:status,period:{from:parameters.start_date||null,to:parameters.end_date||null},unknownFields:['Veröffentlichungszeit','historischer Datenstand']};
 const snapshotId=crypto.randomUUID();let archived=false;
 if(payload){const rows=payload.values||payload.splits||payload.dividends||[];const days=(Array.isArray(rows)?rows:[]).map(r=>r.datetime?.slice(0,10)||r.date||r.ex_date).filter(Boolean).sort();if(days.length)provenance.period={from:days[0],to:days.at(-1)};}
 try{if(env.BUCKET){const stored=await env.BUCKET.put('snapshots/'+snapshotId+'.json',JSON.stringify({dataVersion:DATA_VERSION,snapshotId,provenance,payload,error}),{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});archived=stored!==null}}catch{archived=false}
 return {payload,error,provenance,snapshotId,archived};
}
export async function loadPrices(symbol,env,adjust='all'){
 const record=await providerData('time_series',{symbol,interval:'1day',outputsize:1300,adjust},env);
 if(record.error||!Array.isArray(record.payload?.values))return {symbol,normalizationAt:new Date().toISOString(),error:{symbol,message:record.error||'Keine Kursreihe'},provenance:record.provenance,snapshotId:record.snapshotId,archived:record.archived};
 const normalizationAt=new Date().toISOString();
 const quality=validatePrices(record.payload,adjust,new Date(normalizationAt));
 return {symbol,normalizationAt,bars:quality.bars,pricePayload:record.payload,quality,provenance:record.provenance,snapshotId:record.snapshotId,archived:record.archived,currency:record.payload.meta?.currency};
}
export function normalizeActions(splitRecord,dividendRecord){
 const issues=[],splits=[],dividends=[];
 if(splitRecord.error||!Array.isArray(splitRecord.payload?.splits))issues.push('Splitdaten fehlen');else for(const row of splitRecord.payload.splits){const priceFactor=Number(row.ratio);if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!Number.isFinite(priceFactor)||priceFactor<=0){issues.push('Ungültiger Split');continue}splits.push({effectiveDate:row.date,priceFactor,shareFactor:1/priceFactor,publicationTime:null,knownAt:null});}
 if(dividendRecord.error||!Array.isArray(dividendRecord.payload?.dividends))issues.push('Dividendendaten fehlen');else for(const row of dividendRecord.payload.dividends){const amount=Number(row.amount);if(!/^\d{4}-\d{2}-\d{2}$/.test(row.ex_date)||!Number.isFinite(amount)||amount<0){issues.push('Ungültige Dividende');continue}dividends.push({exDate:row.ex_date,amount,paymentDate:null,publicationTime:null,knownAt:null});}
 for(const rows of [splits,dividends]){const keys=rows.map(r=>r.effectiveDate||r.exDate);if(new Set(keys).size!==keys.length)issues.push('Doppelte Kapitalmaßnahmen: manuelle Klärung erforderlich');}
 return {splits,dividends,otherActions:{status:'unknown',events:null},coverageVerified:false,pointInTimeVerified:false,issues};
}
export function simulateRaw(bars,decisionIndex,actions,{strict=true,horizon=20,target=.05}={}){
 if(!actions?.coverageVerified)return {status:'blocked',reason:'Kapitalmaßnahmenabdeckung nicht bestätigt'};
 if(strict&&!actions.pointInTimeVerified)return {status:'blocked',reason:'Historische Veröffentlichungsstände fehlen'};
 const first=decisionIndex+1,last=decisionIndex+horizon,entry=bars[first]?.open;if(!entry||!bars[last])return {status:'blocked',reason:'Ausführungskurse fehlen'};
 let shares=1,receivable=0,lowest=entry,exit=null,targetHit=false;const ledger=[];
 for(let i=first;i<=last;i++){
  const bar=bars[i];if(!bar)return {status:'blocked',reason:'Handelstag fehlt'};
  // Enter at open: same-day split is already reflected in entry; ex-day buyers are not entitled.
  if(i>first){for(const split of actions.splits.filter(s=>s.effectiveDate===bar.date)){shares*=split.shareFactor;ledger.push({date:bar.date,type:'split',shares});}
   for(const dividend of actions.dividends.filter(d=>d.exDate===bar.date)){receivable+=shares*dividend.amount;ledger.push({date:bar.date,type:'dividend-receivable',amount:shares*dividend.amount,paymentDate:dividend.paymentDate});}}
  // Price target excludes dividends. Dividends contribute separately to total return.
  const limit=entry*(1+target)/shares;
  if(bar.high>=limit){exit=Math.max(bar.open,limit)*shares;targetHit=true;break}
  lowest=Math.min(lowest,bar.low*shares+receivable);
  if(i===last)exit=bar.close*shares;
 }
 return {status:strict?'verified':'retrospective',priceReturn:exit/entry-1,dividendReturn:receivable/entry,tradeReturn:(exit+receivable)/entry-1,targetHit,adverseMove:lowest/entry-1,ledger,cashDividendStatus:'Anspruch am Ex-Tag; kein erfundener Zahlungstermin',model:'raw-execution-v1'};
}


// Decision-time plan only: never consumes a future bar or wall-clock default.
export const TRADE_PLAN_VERSION='trade-plan-v1';
export function createTradePlan(input={}){
 const unknown=reason=>({version:TRADE_PLAN_VERSION,status:'unknown',reason,netApproved:false});
 const {decisionDate,asOf,closeAvailableAt,mic,referenceClose,priceBasis}=input;
 if(!asOf||!closeAvailableAt||!Number.isFinite(Date.parse(asOf))||!Number.isFinite(Date.parse(closeAvailableAt)))return unknown('Belegte Schlussverfügbarkeit und Entscheidungszeit fehlen');
 const decision=session(decisionDate,mic),completed=lastCompleted(new Date(asOf),mic),availableCompleted=lastCompleted(new Date(closeAvailableAt),mic);
 if(!decision?.open||completed?.date!==decisionDate||!availableCompleted||availableCompleted.date<decisionDate||Date.parse(closeAvailableAt)>Date.parse(asOf))return unknown('Entscheidung benötigt verfügbaren regulären Schluss und bekannten Kalender');
 if(priceBasis!=='raw'||!Number.isFinite(referenceClose)||referenceClose<=0)return unknown('Rohschluss als Einstiegspreisanker fehlt');
 const entryTolerance=input.entryTolerance??.01,stopFraction=input.stopFraction??.05;
 if(!Number.isFinite(entryTolerance)||entryTolerance<0||entryTolerance>.1||!Number.isFinite(stopFraction)||stopFraction<=0||stopFraction>=1)return unknown('Ungültige experimentelle Einstieg-/Stopannahme');
 const window=createEventWindow({decisionDate,asOf,mic});if(window.status==='unknown')return unknown(window.reason);
 const regularSessions=window.regularSessions;
 return {version:TRADE_PLAN_VERSION,status:'experimental',netApproved:false,decisionDate,asOf,closeAvailableAt,mic,priceBasis,referenceClose,entryTolerance,validEntryDate:regularSessions[0],validAt:'next-regular-open-only',entryRange:{min:referenceClose*(1-entryTolerance),max:referenceClose*(1+entryTolerance),basis:'modeled-fill-price'},outsideEntry:'abstain-or-new-decision',targetFraction:.05,stopFraction,stopRule:'experimental-market-stop',plannedEndDate:regularSessions[19],regularSessions,calendarVersion:decision.calendarVersion,assumptions:[`${entryTolerance*100}% Einstiegstoleranz und ${stopFraction*100}% Stop sind experimentelle Szenarioannahmen, keine Nutzer-Risikopräferenzen.`,'Keine Ausführung zum Stoppreis garantiert; Ziel bleibt +5%.']};
}

export function regularSessionOpenUtc(day,mic){
 if(!session(day,mic)?.open)return null;
 const noon=new Date(day+'T12:00:00Z'),hour=Number(localParts(noon).hour);
 return new Date(Date.parse(day+'T00:00:00Z')+(9.5+12-hour)*3600000).toISOString();
}
export function validateTradePlan(plan,decisionBar){
 if(!plan||plan.referenceClose!==decisionBar?.close||plan.decisionDate!==decisionBar?.date)return false;
 const canonical=createTradePlan(plan);
 return canonical.status==='experimental'&&Object.keys(canonical).every(key=>JSON.stringify(canonical[key])===JSON.stringify(plan[key]))&&Object.keys(plan).every(key=>Object.hasOwn(canonical,key));
}

// This audit is a retrospective known-prefix calculation, not provider PIT qualification.
export const RISK_VERSION='risk-prefix-v1';
export function riskAt(bars,decisionIndex,{priceBasis='adjusted',volumeBasis='unknown',currency='USD',mic=null,actions=null,asOf=null,lookback=20}={}){
 const unknown=reason=>({status:'unknown',value:null,reason});
 const result={version:RISK_VERSION,status:'experimental',thresholdsApplied:false,netApproved:false,pointInTimeVerified:false,decisionDate:bars[decisionIndex]?.date||null,priceBasis,volumeBasis,lookback,
  averageDailyTradedValue:unknown('Rohpreis und Rohvolumen derselben Sitzung erforderlich'),openingGaps:unknown('Unzureichendes bekanntes Präfix'),downsideMeasure:unknown('Unzureichendes bekanntes Präfix')};
 if(!Number.isInteger(decisionIndex)||decisionIndex<lookback||!Number.isInteger(lookback)||lookback<2||lookback>1000||!['raw','adjusted'].includes(priceBasis))return result;
 const prefix=bars.slice(decisionIndex-lookback,decisionIndex+1);
 if(prefix.length!==lookback+1||prefix.some(b=>!b||b.missing||!session(b.date,mic)?.open||![b.open,b.close].every(v=>Number.isFinite(v)&&v>0)))return result;
 for(let i=1;i<prefix.length;i++){let cursor=new Date(prefix[i-1].date+'T12:00:00Z');cursor.setUTCDate(cursor.getUTCDate()+1);while(session(iso(cursor),mic)?.open===false)cursor.setUTCDate(cursor.getUTCDate()+1);if(!session(iso(cursor),mic)?.open||iso(cursor)!==prefix[i].date)return result;}
 const window=prefix.slice(1),start=prefix[0].date,end=prefix.at(-1).date;
 if(priceBasis==='raw'&&(!Number.isFinite(Date.parse(asOf))||!(lastCompleted(new Date(asOf),mic)?.date>=end)))return result;
 if(priceBasis==='raw'&&volumeBasis==='raw'&&currency==='USD'&&window.every(b=>Number.isFinite(b.volume)&&b.volume>=0&&Number.isFinite(b.close*b.volume))&&Number.isFinite(window.reduce((sum,b)=>sum+b.close*b.volume,0)))result.averageDailyTradedValue={status:'known',value:window.reduce((sum,b)=>sum+b.close*b.volume,0)/lookback,currency:'USD',basis:'raw-close-times-raw-volume',method:'close-times-volume-proxy-not-VWAP',sessions:lookback};
 // An empty ledger is never evidence of absence. Coverage must cover the whole prefix
 // and have been available by the supplied decision time; all relevant actions too.
 const coverage=actions?.coverage;
 const qualified=currency==='USD'&&actions?.coverageVerified===true&&actions?.pointInTimeVerified===true&&Array.isArray(actions.splits)&&Array.isArray(actions.dividends)&&actions.otherActions?.status==='confirmed-none'&&session(coverage?.from,mic)?.open&&session(coverage?.to,mic)?.open&&coverage.from<=start&&coverage.to>=end&&Number.isFinite(Date.parse(asOf))&&lastCompleted(new Date(asOf),mic)?.date>=end&&Number.isFinite(Date.parse(coverage.availableAt))&&Date.parse(coverage.availableAt)<=Date.parse(asOf);
 const relevant=(rows,key)=>rows.filter(a=>a[key]>=start&&a[key]<=end);
 const splits=qualified?relevant(actions.splits,'effectiveDate'):[],dividends=qualified?relevant(actions.dividends,'exDate'):[];
 const validActions=qualified&&actions.splits.every(a=>session(a.effectiveDate,mic)?.open&&Number.isFinite(a.priceFactor)&&a.priceFactor>0)&&actions.dividends.every(a=>session(a.exDate,mic)?.open&&a.currency===currency&&Number.isFinite(a.amount)&&a.amount>=0)&&splits.every(a=>Number.isFinite(a.priceFactor)&&a.priceFactor>0&&Number.isFinite(Date.parse(a.knownAt))&&Date.parse(a.knownAt)<=Date.parse(asOf))&&dividends.every(a=>Number.isFinite(a.amount)&&a.amount>=0&&Number.isFinite(Date.parse(a.knownAt))&&Date.parse(a.knownAt)<=Date.parse(asOf));
 if(priceBasis==='raw'&&!validActions){result.openingGaps=unknown('Qualifizierte verfügbare Kapitalmaßnahmenabdeckung fehlt');result.downsideMeasure=unknown('Rohkursverlust ohne Maßnahmenabdeckung nicht wirtschaftlich interpretierbar');return result;}
 const gaps=[],returns=[];
 for(let i=1;i<prefix.length;i++){
  const bar=prefix[i],previous=prefix[i-1];
  const factor=priceBasis==='raw'?splits.filter(a=>a.effectiveDate===bar.date).reduce((f,a)=>f*a.priceFactor,1):1;
  const dividend=priceBasis==='raw'?dividends.filter(a=>a.exDate===bar.date).reduce((sum,a)=>sum+a.amount,0):0;
  const denominator=previous.close*factor-dividend;
  if(!(denominator>0))return result;
  gaps.push(bar.open/denominator-1);returns.push(bar.close/denominator-1);
 }
 if([...gaps,...returns].some(v=>!Number.isFinite(v))||!Number.isFinite(returns.reduce((sum,r)=>sum+Math.min(r,0)**2,0)))return result;
 const basis=priceBasis==='raw'?'action-normalized-raw-price-return':'provider-adjusted-price-return-proxy';
 result.openingGaps={status:'known',value:Math.min(...gaps),mean:gaps.reduce((a,b)=>a+b,0)/lookback,observations:gaps,sessions:lookback,basis,method:'minimum-opening-gap'};
 result.downsideMeasure={status:'known',value:Math.sqrt(returns.reduce((sum,r)=>sum+Math.min(r,0)**2,0)/lookback),sessions:lookback,basis,method:'daily-downside-deviation-zero-target',annualized:false};
 return result;
}

// Price-free decision window shared with trade plans; includes the decision day and session20.
export function createEventWindow({decisionDate,asOf,mic}={}){
 const unknown=reason=>({status:'unknown',reason});
 if(!asOf||!Number.isFinite(Date.parse(asOf)))return unknown('Entscheidungszeit fehlt');
 const completed=lastCompleted(new Date(asOf),mic),decision=session(decisionDate,mic);
 if(!decision?.open||completed?.date!==decisionDate)return unknown('Entscheidungstag muss letzter abgeschlossener regulärer Schluss sein');
 const regularSessions=[];let cursor=new Date(decisionDate+'T12:00:00Z');
 for(let i=0;i<60&&regularSessions.length<20;i++){cursor.setUTCDate(cursor.getUTCDate()+1);const day=cursor.toISOString().slice(0,10),s=session(day,mic);if(!s)return unknown('Enddatum außerhalb bekannten Kalenders');if(s.open)regularSessions.push(day)}
 if(regularSessions.length!==20)return unknown('20 reguläre Sitzungen nicht bestimmbar');
 if(Date.parse(asOf)>=Date.parse(regularSessionOpenUtc(regularSessions[0],mic)))return unknown('Nächstes reguläres Open bereits vergangen: neu entscheiden, Einstieg nicht verschieben');
 return {status:'experimental',decisionDate,asOf:new Date(asOf).toISOString(),mic,start:decisionDate,end:regularSessions[19],plannedEndDate:regularSessions[19],regularSessions,boundary:'decision-day-through-session20-inclusive',calendarVersion:decision.calendarVersion};
}
