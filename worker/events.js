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
