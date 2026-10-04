import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as frozen from '../reference/v1/model.mjs';
const params=JSON.parse(await readFile(new URL('../reference/v1/parameters.json',import.meta.url)));
const frozenText=await readFile(new URL('../reference/v1/model.mjs',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(frozenText).digest('hex'),params.coreSha256);
const source=await readFile(new URL('../worker/index.template.js',import.meta.url),'utf8');
for(const [name,value] of [['HORIZON',20],['TARGET',0.05],['HISTORY_SIZE',1300],['MIN_ANALOGS',12]]){const actual=source.match(new RegExp('const '+name+' = ([0-9.]+);'));assert.equal(Number(actual?.[1]),value,'active reference parameter '+name);}
const text='const HORIZON=20,TARGET=.05,MIN_ANALOGS=12;\n'+source.slice(source.indexOf('function featureAt('),source.indexOf('\nasync function calendar('))+'\nexport {featureAt,buildRecords,simulateTarget,estimate,walkForward};';
const active=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
function series(offset){let previous=100+offset*20;return Array.from({length:1300},(_,i)=>{const open=previous*(1+.0003*Math.sin(i+offset));const close=open*Math.exp(.0004+.005*Math.sin((i+offset*11)/37)+.003*Math.cos(i/7+offset));previous=close;return{date:String(i).padStart(4,'0'),open,close,high:Math.max(open,close)*1.006,low:Math.min(open,close)*.994}})}
const stock=series(1),spy=series(0),dates=spy.map(b=>b.date);
function run(m){const market=spy.map((_,i)=>m.featureAt(spy,spy,i)),records=m.buildRecords(stock,spy,market),features=m.featureAt(stock,spy,1299);return{features,forecast:m.estimate(features,records,market[1299].r20>=0,1299),backtest:m.walkForward([{symbol:'SYNTHETIC',bars:stock}],{SYNTHETIC:records},spy,market,dates)}}
const result=run(frozen);assert.deepEqual(run(active),result);
const flat=Array.from({length:61},()=>({open:100,high:100,low:100,close:100}));
assert.equal(active.featureAt(flat,flat,60).score,55);assert.equal(active.featureAt(flat,flat,60).vol20,0);
const growth=Array.from({length:61},(_,i)=>({close:100*1.01**i}));
assert.ok(Math.abs(active.featureAt(growth,growth,60).r20-(1.01**20-1))<1e-12);
assert.equal(active.featureAt(flat,flat,59),null);
const bars=Array.from({length:21},()=>({open:100,high:104,low:99,close:98}));
assert.ok(Math.abs(active.simulateTarget(bars,0).tradeReturn+.02)<1e-12);
bars[1].high=105;assert.equal(active.simulateTarget(bars,0).tradeReturn,.05);
const records=Array.from({length:12},(_,i)=>({index:i*20,score:55,marketUp:true,tradeReturn:.01,targetHit:false,adverseMove:-.02}));
assert.equal(active.estimate({score:55},records,true,239).expectedReturn,null);
assert.equal(active.estimate({score:55},records,true,240).sampleCount,12);
const golden=new URL('../reference/v1/expected.json',import.meta.url);
if(process.argv.includes('--initialize'))await writeFile(golden,JSON.stringify(result,null,2)+'\n');
assert.deepEqual(result,JSON.parse(await readFile(golden)));
const html=await readFile(new URL('../app/index.html',import.meta.url),'utf8');
new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
for(const id of ['analysis','details','settings']){assert.ok(html.includes('id="view-'+id+'"'));assert.ok(html.includes('aria-controls="view-'+id+'"'))}
assert.ok(html.includes('reference-v1'));
console.log('Reference verified: hash, formulas, exits, maturity, fixed synthetic regression and UI structure/syntax.');
