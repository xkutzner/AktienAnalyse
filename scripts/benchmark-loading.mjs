// Synthetic CPU benchmark; no network, credentials, purchased data or release.
// Reconstructs the pre-A calendar/benchmark path, compares every result field.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {session} from '../worker/data.js';
const data=await readFile(new URL('../worker/data.js',import.meta.url),'utf8');
const legacyData=data.replace(/const SESSION_CACHE=new Map\(\);[\s\S]*?function calendarSession\(day,mic\)\{/, 'export function session(day,mic){');
const dataURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const template=await readFile(new URL('../worker/index.template.js',import.meta.url),'utf8');
const core=template.slice(template.indexOf('function historicalBacktest('),template.indexOf('\nasync function calendar('));
const load=async(code,moduleURL)=>import(dataURL('import {session,validatePricePrefix} from '+JSON.stringify(moduleURL)+';\nconst HORIZON=20,TARGET=.05,MIN_ANALOGS=12;\n'+code+'\nexport {historicalBacktest};'));
const baseline=await load(core.replace('&&benchmarkUsable(index)',"&&validatePricePrefix(benchmark.pricePayload,'all',dates[index]).usable"),dataURL(legacyData));
const optimized=await load(core,new URL('../worker/data.js',import.meta.url).href);
const dates=[];for(const c=new Date('2021-01-04T12:00:00Z');dates.length<1300;c.setUTCDate(c.getUTCDate()+1)){const day=c.toISOString().slice(0,10);if(session(day,'XNAS')?.open)dates.push(day)}
const symbols=['AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA'];
const meta={mic_code:'XNAS',exchange_timezone:'America/New_York',currency:'USD'};
const downloads=[...symbols,'SPY'].map((symbol,j)=>{const bars=dates.map((date,i)=>{const close=100*Math.exp(.0002*i)*(1+.02*Math.sin(i/9+j));return {date,datetime:date,open:close,close,high:close*1.01,low:close*.99}});return {symbol,bars,quality:{expectedLastSession:dates.at(-1),meta},pricePayload:{meta,values:bars}}});
const before=performance.now(),old=baseline.historicalBacktest(downloads,symbols),baselineMs=performance.now()-before;
const after=performance.now(),current=optimized.historicalBacktest(downloads,symbols),optimizedMs=performance.now()-after;
assert.deepEqual(current,old,'all decisions, qualification and unknown outcomes stay identical');
console.log(JSON.stringify({fixture:'synthetic-only-1300-bars-7-stocks-SPY',baselineMs:Math.round(baselineMs),optimizedMs:Math.round(optimizedMs),decisions:current.decisions.length,fullOutputParity:true}));
