import assert from 'node:assert/strict';
import worker from '../worker/index.js';
const original=globalThis.fetch;
const date=new Date(Date.now()+86400000).toISOString().slice(0,10);
globalThis.fetch=async url=>String(url).includes('bls.gov')?new Response('BEGIN:VEVENT\nDTSTART:'+date.replaceAll('-','')+'T083000\nSUMMARY:Consumer Price Index\nEND:VEVENT'):Response.json({status:'ok',earnings:{[date]:[{symbol:'NVDA',time:'After Market Close'}]}});
try{
 const request=new Request('https://test.local/api/calendar?symbols=NVDA,AAPL');
 const data=await (await worker.fetch(request,{TWELVEDATA_API_KEY:'test-secret'})).json();
 assert.equal(data.events.filter(e=>e.symbol==='NVDA').length,1);
 assert.equal(data.events.filter(e=>e.title==='Consumer Price Index').length,1);
 assert.equal(data.risks[0].knownPoints,Math.min(100,data.risks[1].knownPoints+60));
 assert.ok(!JSON.stringify(data).includes('test-secret'));
 globalThis.fetch=async()=>{throw Error('offline')};
 const missing=await (await worker.fetch(request,{})).json();
 assert.ok(missing.risks.every(r=>r.score===null));
 assert.equal((await worker.fetch(new Request('https://test.local/api/calendar?symbols=bad!'),{})).status,400);
 globalThis.fetch=async url=>String(url).includes('bls.gov')?new Response('<html>Denied</html>',{status:403}):Response.json({status:'error',code:429,message:'API credits exhausted'});
 const limited=await (await worker.fetch(request,{TWELVEDATA_API_KEY:'test-secret'})).json();
 assert.ok(limited.sources.find(s=>s.name==='Twelve Data').message.includes('Kreditlimit'));
 assert.ok(limited.sources.find(s=>s.name==='BLS').message.includes('HTTP 403'));
 assert.ok(limited.events.some(e=>e.title.includes('Ersatzdatenstand')));
 assert.ok(limited.risks.every(r=>r.score===null));
 globalThis.fetch=async()=>new Response('<html>Gateway failed</html>',{status:502});
 const malformed=await (await worker.fetch(request,{TWELVEDATA_API_KEY:'test-secret'})).json();
 assert.ok(malformed.sources.find(s=>s.name==='Twelve Data').message.includes('JSON'));
 assert.equal((await worker.fetch(new Request('https://test.local/api/calendar?symbols=AAPL',{method:'POST'}),{})).status,405);
 console.log('Calendar checks passed: source parsing, ticker relevance, missing coverage, secret handling.');
}finally{globalThis.fetch=original}
