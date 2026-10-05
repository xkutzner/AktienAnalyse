// event-registry-v1: immutable observations, never a client-authorized release.
import {digest} from './reproducibility.js';
export const EVENT_VERSION='event-registry-v1';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function eventRevisionId(id){return typeof id==='string'&&UUID.test(id)}
const timestamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;
export async function createEventRevision(input,observedAt,previous=null,verifyEvidence=null){
 const observed=timestamp(observedAt),asserted=timestamp(input.knownAt);
 if(!observed||!asserted||!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate)||new Date(input.effectiveDate+'T12:00:00Z').toISOString().slice(0,10)!==input.effectiveDate)throw Error('Datum/Verfügbarkeit fehlen');
 if(!['earnings','split','dividend','capital-action'].includes(input.kind)||!/^[A-Z][A-Z0-9.-]{0,9}$/.test(input.symbol||''))throw Error('Ereignisart/Symbol ungültig');
 if(input.state!==undefined&&!['cancelled','scheduled'].includes(input.state))throw Error('Status ungültig');
 const source=new URL(input.source);if(source.protocol!=='https:'||source.username||source.password)throw Error('HTTPS-Quelle erforderlich');
 if(typeof input.evidence!=='string'||!input.evidence.trim()||input.evidence.length>10000)throw Error('Quellenbeleg erforderlich');
 if(previous&&(!eventRevisionId(previous.revisionId)||previous.symbol!==input.symbol||previous.kind!==input.kind||observed<previous.observedAt))throw Error('Revisionskette ungültig');
 const record={version:EVENT_VERSION,eventId:previous?.eventId||crypto.randomUUID(),revisionId:crypto.randomUUID(),previousRevisionId:previous?.revisionId||null,previousHash:previous?.recordHash||null,revision:(previous?.revision||0)+1,symbol:input.symbol,kind:input.kind,title:String(input.title||input.kind).slice(0,200),effectiveDate:input.effectiveDate,state:input.state==='cancelled'?'cancelled':'scheduled',source:source.href,evidence:input.evidence,assertedKnownAt:asserted,observedAt:observed,knownAt:[asserted,observed,previous?.knownAt||observed].sort().at(-1),confirmationStatus:'claimed-unverified',evidenceValidation:'not-implemented',coverage:'unknown',time:String(input.time||'Unbekannt').slice(0,100)};
 // Only a server-installed validator can qualify exact evidence. No production validator exists.
 if(typeof verifyEvidence==='function'){
  const evidenceHash=await digest({symbol:record.symbol,kind:record.kind,effectiveDate:record.effectiveDate,source:record.source,evidence:record.evidence,state:record.state});
  const proof=await verifyEvidence(record,evidenceHash);
  if(proof?.status==='verified'&&proof.evidenceHash===evidenceHash&&typeof proof.validatorVersion==='string'&&proof.validatorVersion.length){record.confirmationStatus='confirmed-source-evidence';record.evidenceValidation=proof.validatorVersion;record.evidenceHash=evidenceHash}
 }
 return {...record,recordHash:await digest(record)};
}
export async function readEventChain(bucket,id){
 const rows=[],seen=new Set();
 while(id){
  if(!eventRevisionId(id)||seen.has(id)||rows.length>=100)throw Error('Revisionskette ungültig');seen.add(id);
  const object=await bucket.get('events/'+id+'.json');if(!object)throw Error('Revision fehlt');
  const row=JSON.parse(await object.text()),{recordHash,...body}=row;
  if(row.version!==EVENT_VERSION||row.revisionId!==id||await digest(body)!==recordHash)throw Error('Ereignisintegrität verletzt');
  const newer=rows.at(-1);if(newer&&(newer.previousHash!==recordHash||newer.eventId!==row.eventId||newer.revision!==row.revision+1||newer.observedAt<row.observedAt))throw Error('Revisionsintegrität verletzt');
  rows.push(row);id=row.previousRevisionId;
 }
 if(rows.at(-1)?.revision!==1)throw Error('Kettenanfang fehlt');return rows.reverse();
}
export function projectEvents(revisions,{asOf,start,end,symbols}){
 if(!timestamp(asOf)||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end||!Array.isArray(symbols))throw Error('Ereignisfenster ungültig');
 const latest=new Map();
 for(const row of revisions){
  if(!timestamp(row.knownAt)||!timestamp(row.observedAt))throw Error('Ereignisverfügbarkeit fehlt');
  if(Date.parse(row.knownAt)>Date.parse(asOf)||Date.parse(row.observedAt)>Date.parse(asOf))continue;
  const previous=latest.get(row.eventId);
  if(previous&&previous.revision===row.revision&&previous.recordHash!==row.recordHash)throw Error('Mehrdeutiger Revisionszweig');
  if(!previous||row.revision>previous.revision)latest.set(row.eventId,row);
 }
 return [...latest.values()].filter(row=>symbols.includes(row.symbol)&&row.state!=='cancelled'&&row.effectiveDate>=start&&row.effectiveDate<=end).map(row=>({...row,date:row.effectiveDate,points:row.confirmationStatus==='confirmed-source-evidence'?(row.kind==='earnings'?60:40):0}));
}


// Whole-source snapshots preserve removals and revisions; absence never proves coverage.
export const MACRO_SNAPSHOT_VERSION='macro-calendar-snapshot-v1';
export function macroSnapshotId(id){return typeof id==='string'&&/^[a-f0-9]{64}$/.test(id)}
export function parseBlsCalendar(text){
 const events=[];text=text.replace(/\r?\n[ \t]/g,'');
 for(const block of text.split('BEGIN:VEVENT').slice(1)){
  const title=block.match(/(?:^|\n)SUMMARY:([^\r\n]+)/)?.[1],raw=block.match(/(?:^|\n)DTSTART([^:]*):(\d{8})(?:T(\d{6})(Z)?)?(?:\r?\n|$)/);
  if(!title||!raw)throw Error('Unlesbarer Kalendereintrag');
  if(/(?:^|\n)STATUS:CANCELLED(?:\r?\n|$)/.test(block))continue;
  if(raw[3]&&(Number(raw[3].slice(0,2))>23||Number(raw[3].slice(2,4))>59||Number(raw[3].slice(4,6))>59))throw Error('Ungültige Uhrzeit');
  const y=raw[2].slice(0,4),m=raw[2].slice(4,6),d=raw[2].slice(6,8);
  let date=y+'-'+m+'-'+d,time='Unbekannt';
  if(!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Ungültiger Termin');
  if(raw[3]){
   if(raw[4]){const dt=new Date(date+'T'+raw[3].slice(0,2)+':'+raw[3].slice(2,4)+':'+raw[3].slice(4,6)+'Z');if(!Number.isFinite(dt.getTime()))continue;date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(dt);time=raw[3].slice(0,2)+':'+raw[3].slice(2,4)+' UTC';}
   else {if(raw[1]&&!/TZID=(?:America\/New_York|US\/Eastern|US-Eastern)/.test(raw[1]))throw Error('Unbekannte Kalenderzeitzone');time=raw[3].slice(0,2)+':'+raw[3].slice(2,4)+' US Eastern';}
  }
  if(new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Ungültiger Termin');
  const points=/Consumer Price Index|Employment Situation/i.test(title)?35:/Producer Price Index|Employment Cost Index|Job Openings/i.test(title)?20:0;
  events.push({date,title,symbol:null,points,time,source:'https://www.bls.gov/schedule/news_release/bls.ics'});
 }
 if(!events.length&&!/BEGIN:VCALENDAR[\s\S]*END:VCALENDAR/.test(text))throw Error('Antwort enthält keinen lesbaren Kalender');
 return events;
}
export async function createMacroSnapshot(text,observedAt){
 const body={version:MACRO_SNAPSHOT_VERSION,source:'https://www.bls.gov/schedule/news_release/bls.ics',observedAt:timestamp(observedAt),events:parseBlsCalendar(text)};
 if(!body.observedAt)throw Error('Beobachtungszeit fehlt');return {...body,snapshotId:await digest(body)};
}
export async function readMacroSnapshot(bucket,id){
 if(!macroSnapshotId(id))throw Error('Ungültige Snapshot-ID');const object=await bucket.get('macro/bls/'+id+'.json');if(!object)throw Error('Snapshot fehlt');
 const row=JSON.parse(await object.text()),{snapshotId,...body}=row;
 if(snapshotId!==id||row.version!==MACRO_SNAPSHOT_VERSION||!timestamp(row.observedAt)||await digest(body)!==id)throw Error('Snapshotintegrität verletzt');return row;
}
export function projectMacroSnapshots(rows,asOf,start,end){
 const eligible=rows.filter(r=>Date.parse(r.observedAt)<=Date.parse(asOf)).sort((a,b)=>a.observedAt.localeCompare(b.observedAt));
 const latest=eligible.at(-1);if(!latest)return [];
 if(eligible.some(r=>r.observedAt===latest.observedAt&&r.snapshotId!==latest.snapshotId))throw Error('Mehrdeutiger Quellenstand');
 return latest.events.filter(e=>e.points&&e.date>=start&&e.date<=end).map(e=>({...e,knownAt:latest.observedAt,observedAt:latest.observedAt,snapshotId:latest.snapshotId,confirmationStatus:'source-observation-unqualified',availabilityQualification:'server-observed-not-historical-publication',evidenceValidation:'calendar-parser; no-PIT-qualification'}));
}
