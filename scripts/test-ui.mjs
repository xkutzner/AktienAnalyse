// Full inline-script workflow harness. Explicit synthetic fixtures; no market/provider calls.
import {createTradePlan} from '../worker/data.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const {renderPage}=await import('./render-page.mjs');
const html=process.env.UI_ARTIFACT==='1'
 ? await (await (await import('../dist/server/index.js')).default.fetch(new Request('https://artifact.local/'),{})).text()
 : renderPage(fs.readFileSync('app/index.html','utf8'));
assert.ok(!/__+[A-Z][A-Z0-9_]*__/.test(html),'no unresolved template placeholders in tested page');
const attrs=text=>Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
let active;
class Node {
 constructor(tag,a={}){this.tag=tag;this.attrs=a;this.id=a.id;this.value=a.value||'';this.listeners={};this.style={};this.disabled=false;this.hidden=false;this._text='';this._html='';this.open=false;this.classList={add(){},remove(){}};this.dataset={};}
 set textContent(t){this._text=String(t);this._html=''} get textContent(){return this._text}
 set innerHTML(t){this._html=String(t);this._text='';if(this.tag==='select'){const options=[...this._html.matchAll(/<option(?: value="([^"]*)")?[^>]*>([^<]*)/g)].map(m=>m[1]??m[2]);if(!options.includes(this.value))this.value=options[0]||''}}
 get innerHTML(){return this._html||this._text}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
 async fire(type,e={}){for(const fn of this.listeners[type]||[])await fn({target:this,preventDefault(){},...e})}
 focus(){active=this}
 setAttribute(k,v){this.attrs[k]=String(v)} getAttribute(k){return this.attrs[k]}
 checkValidity(){if(this.tag!=='input'||this.attrs.type!=='number')return true;const v=Number(this.value);return this.value!==''&&Number.isFinite(v)&&v>=Number(this.attrs.min||0)&&(!this.attrs.max||v<=Number(this.attrs.max))}
 querySelectorAll(selector){const key=selector==='[data-remove]'?'remove':selector==='[data-detail]'?'detail':null;if(!key)return [];return [...this.innerHTML.matchAll(new RegExp('<button[^>]*data-'+key+'="([^"]+)"[^>]*>','g'))].map(m=>{const node=new Node('button');node.dataset[key]=m[1];return node})}
 querySelector(){return new Node('summary')}
}
const nodes={};for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="[^>]+)>/g)){const a=attrs(m[2]);assert.ok(!nodes[a.id],'unique id '+a.id);nodes[a.id]=new Node(m[1],a)}
const tabs=['tab-analysis','tab-details','tab-settings'].map(id=>nodes[id]);
const requests=[];const fetch=(url,options={})=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));
const timers=new Map();let timerId=0;const schedule=(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId};
const context=vm.createContext({document:{getElementById:id=>{assert.ok(nodes[id],'DOM id '+id);return nodes[id]},querySelectorAll:s=>s==='[role="tab"]'?tabs:[]},localStorage:{getItem:()=>null,setItem(){}},fetch,AbortController,AbortSignal,Response,Number,JSON,Object,Array,Map,Set,Intl,Date,Math,Error,String,setTimeout:schedule,clearTimeout:id=>timers.delete(id)});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
assert.equal(vm.runInContext('pct(.02)',context),'+2,0 %');assert.equal(vm.runInContext('frequency(.6)',context),'60,0 %');assert.equal(vm.runInContext('pp(.02)',context),'+2,0 Prozentpunkte');
const tick=()=>new Promise(r=>setImmediate(r));
const respond=async(request,body,status=200)=>{request.resolve(Response.json(body,{status}));await tick();await tick()};
const stock=symbol=>({symbol,asOf:'2026-10-02',qualityUsable:true,close:100,r20:.03,r60:.05,rel20:.02,trend50:.01,vol20:.25,marketR20:.01,score:60,expectedReturn:.02,sampleCount:20,probabilityTarget:.6,probabilityLow:.4,probabilityHigh:.8,p10:-.1,p90:.05,averageAdverseMove:-.08,newAnalogs:{proxy:{reason:'Keine belastbare Schätzung',caseCount:0},net:{reason:'historische Datenstände fehlen',expectedNetReturn:null}}});
const quality=symbol=>({symbol,quality:{usable:true,lastSession:'2026-10-02',expectedLastSession:'2026-10-02',issues:[]},provenance:{},archived:false});
const fixture=(symbols=['AAPL','MSFT'])=>({stocks:symbols.map(stock),best:stock(symbols[0]),asOf:'2026-10-02',benchmark:{r20:.01},dataQuality:[...symbols,'SPY'].map(quality),backtest:{tradeCount:15,windows:20,sufficientSample:true,hitRate:.6,averageTradeReturn:.02,averageBenchmarkReturn:.01,excessPerWindow:.01,maxDrawdown:-.1,recent:[]},errors:[]});
assert.equal(nodes['load-button'].disabled,true);assert.match(nodes.empty.textContent,/läuft/);
await respond(requests.shift(),fixture());assert.match(nodes['candidate-cards'].innerHTML,/AAPL/);assert.match(nodes['best-title'].textContent,/Watchlist/);assert.match(nodes['bt-note'].textContent,/nicht belegt/);
// Same quality gate in cards, table, best and details: inconsistent server payload is refused.
const bad=fixture(['AAPL','MSFT']);bad.dataQuality[0].quality.usable=false;context.next=bad;
const load=vm.runInContext('loadResearch()',context);await respond(requests.shift(),bad);await load;
assert.ok(!nodes['candidate-cards'].innerHTML.includes('AAPL'));assert.ok(!nodes.stocks.innerHTML.includes('AAPL'));assert.ok(!nodes['detail-symbol'].innerHTML.includes('AAPL'));assert.ok(!nodes['best-title'].textContent.includes('AAPL'));
// Older response deliberately ignores the AbortSignal; request version must still protect the UI.
nodes.symbols.value='AAPL';const first=vm.runInContext('loadResearch()',context),old=requests.shift();
nodes.symbols.value='MSFT';await nodes.symbols.fire('input');assert.equal(nodes['best-return'].textContent,'—');assert.equal(nodes['bt-return'].textContent,'—');assert.equal(nodes['market-status'].textContent,'Unbekannt');
const second=vm.runInContext('loadResearch()',context),fresh=requests.shift();await respond(fresh,fixture(['MSFT']));await second;await respond(old,fixture(['AAPL']));await first;assert.ok(nodes['candidate-cards'].innerHTML.includes('MSFT'));assert.ok(!nodes['candidate-cards'].innerHTML.includes('AAPL'));
// Keyboard navigation and roving tab focus.
await tabs[0].fire('keydown',{key:'ArrowRight'});assert.equal(active.id,'tab-details');assert.equal(nodes['view-analysis'].hidden,true);assert.equal(nodes['view-details'].hidden,false);await tabs[1].fire('keydown',{key:'End'});assert.equal(active.id,'tab-settings');await tabs[2].fire('keydown',{key:'Home'});assert.equal(active.id,'tab-analysis');
// Network / HTTP errors clear prior benchmark, best and backtest.
const failure=vm.runInContext('loadResearch()',context);await respond(requests.shift(),{message:'Quelle nicht erreichbar'},503);await failure;assert.equal(nodes['best-return'].textContent,'—');assert.equal(nodes['bt-return'].textContent,'—');assert.equal(nodes['benchmark'].textContent,'SPY nicht verfügbar');assert.match(nodes['banner-text'].textContent,/Quelle/);
const empty=vm.runInContext('loadResearch()',context);await respond(requests.shift(),{stocks:[],dataQuality:[],errors:[]});await empty;assert.match(nodes.empty.textContent,/Keine Aktie/);
// Cost and audit races must not restore a prior scenario or wrong-symbol snapshot.
vm.runInContext("simulationSnapshots={symbol:'AAPL',rawId:'raw',splitId:'split',dividendId:'div'}",context);
const simulation=vm.runInContext('refreshSimulation()',context),oldSim=requests.shift();
nodes['broker-mode'].value='custom';nodes.entryFeeBps.value=20;vm.runInContext('updateCostProfile()',context);const newSim=requests.shift();
const blocked={status:'blocked',version:'execution-v2',reason:'NEUE ANNAHME',dayConvention:'Tag1',costs:{entryFeeBps:20,exitFeeBps:10,entryFixedFee:0,exitFixedFee:0,entrySlippageBps:5,exitSlippageBps:5}};
await respond(newSim,blocked);await respond(oldSim,{...blocked,reason:'ALTE ANNAHME'});await simulation;assert.ok(nodes['simulation-output'].innerHTML.includes('NEUE ANNAHME'));assert.ok(!nodes['simulation-output'].innerHTML.includes('ALTE ANNAHME'));
nodes['audit-symbol'].value='AAPL';const audit=nodes['audit-button'].fire('click'),oldAudit=requests.shift();nodes['audit-symbol'].value='NVDA';await nodes['audit-symbol'].fire('input');await respond(oldAudit,{symbol:'AAPL',archiveStatus:'saved'});await audit;assert.match(nodes['audit-output'].textContent,/Noch keine/);assert.equal(vm.runInContext('simulationSnapshots',context),null);
// Scenario amount is forwarded and invalidation prevents stale cost results.
vm.runInContext("simulationSnapshots={symbol:'AAPL',rawId:'raw',splitId:'split',dividendId:'div'}",context);
nodes['scenario-capital'].value='2500.25';await nodes['scenario-capital'].fire('input');
const capitalRequest=requests.shift();const sent=JSON.parse(capitalRequest.options.body);assert.equal(sent.capital,2500.25);assert.equal(sent.currency,'USD');assert.equal(sent.horizon,20);
nodes['scenario-capital'].value='0';await nodes['scenario-capital'].fire('input');assert.match(nodes['simulation-output'].textContent,/Ungültiger Szenario/);
await respond(capitalRequest,{...blocked,reason:'ALTER BETRAG',scenario:{capital:2500.25}});assert.ok(!nodes['simulation-output'].innerHTML.includes('ALTER BETRAG'));
vm.runInContext('simulationSnapshots=null',context);nodes['scenario-capital'].value='10000';await nodes['scenario-capital'].fire('change');
assert.match(nodes['analysis-contract-output'].innerHTML,/Aktienrendite am Tag 20/);assert.match(nodes['analysis-contract-output'].innerHTML,/Cash/);
// Calendars are invalidated when watchlist changes, also if an old request resolves.
const calendar=nodes['calendar-button'].fire('click'),oldCalendar=requests.shift();nodes.symbols.value='NVDA';await nodes.symbols.fire('input');await respond(oldCalendar,{events:[],risks:[],sources:[],checkedAt:'2026-10-04T12:00:00Z'});await calendar;assert.equal(vm.runInContext('calendarData',context),null);
// Core text has no unverified historical-availability assertion or probability claim.
assert.ok(!html.includes('Nur bis zum jeweiligen Tag bekannte Daten'));assert.ok(!html.includes('Historische Chance auf'));assert.match(html,/Historischer Vergleich · ohne Kosten/);assert.match(html,/Experimentelle Schätzung/);
assert.equal([...html.split('<script>')[0].matchAll(/role="tab"/g)].length,3);
assert.ok(html.includes('@media(max-width:420px)')&&html.includes('@media(max-width:780px)'));assert.ok(html.includes('min-height:44px'));
const luminance=hex=>{const rgb=hex.match(/[\da-f]{2}/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
for(const [fg,bg] of [['13212b','ffffff'],['4e606b','ffffff'],['005b73','ffffff'],['286437','ffffff'],['963c31','ffffff'],['bdf26e','101820'],['284858','f0f5f9'],['664600','fff4dc']]){const a=luminance(fg),b=luminance(bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'text contrast '+fg)}
console.log('UI workflows checked: three areas, shared quality display gate, stale research/cost/audit/calendar responses, loading/error/empty reset, keyboard tabs and text contrast. Responsive CSS checked structurally; no browser rendering claim.');


// Paket09: same synthetic qualification policy in main card; production research stays unknown.
const cardPlan=createTradePlan({decisionDate:'2026-11-27',asOf:'2026-11-27T18:01:00Z',closeAvailableAt:'2026-11-27T18:00:30Z',mic:'XNAS',priceBasis:'raw',referenceClose:100});
context.cardFixture={...stock('SYNTH'),asOf:cardPlan.asOf,evidence:{data:'qualified',costs:'qualified',liquidity:'qualified'},dailyValueUSD:1000000,net:{middle:.02,adverse:-.05,lossUSD:500},rawTradePlan:cardPlan};
nodes['risk-max-loss'].value='1000';nodes['risk-min-liquidity'].value='100000';
vm.runInContext('renderAnalysisCard(cardFixture)',context);
assert.match(nodes['analysis-card'].innerHTML,/Experimentell beobachten/);assert.match(nodes['analysis-card'].innerHTML,/2026-12-28/);assert.ok(nodes['analysis-card'].innerHTML.includes(vm.runInContext('usd(95)',context)));
nodes['risk-max-loss'].value='100';vm.runInContext('renderAnalysisCard(cardFixture)',context);assert.match(nodes['analysis-card'].innerHTML,/Aktuell keine geeignete Aktie/);
context.cardFixture.evidence.costs='unknown';vm.runInContext('renderAnalysisCard(cardFixture)',context);assert.match(nodes['analysis-card'].innerHTML,/Nicht beurteilbar/);assert.match(nodes['analysis-card'].innerHTML,/2026-12-28/);
nodes['risk-max-loss'].value='';vm.runInContext('renderAnalysisCard(cardFixture)',context);assert.match(nodes['analysis-card'].innerHTML,/nicht konfiguriert/);
vm.runInContext("renderAnalysisCard({qualityUsable:true,sampleCount:20,expectedReturn:.02})",context);assert.match(nodes['analysis-card'].innerHTML,/Nicht beurteilbar/);assert.match(nodes['analysis-card'].innerHTML,/historische Beobachtungen/);
console.log('Paket09 main-card policy rendering checked with explicit synthetic qualification, known plan, blocked costs and missing risk preferences.');
// Configuration changes also cancel a research response that ignores abort.
for(const [id,value] of [['risk-max-loss','200'],['scenario-capital','12000'],['entryFeeBps','30']]){
 nodes.symbols.value='AAPL';const pendingResearch=vm.runInContext('loadResearch()',context),stale=requests.shift();
 nodes[id].value=value;await nodes[id].fire('input');assert.equal(stale.options.signal.aborted,true);
 await respond(stale,fixture(['AAPL']));await pendingResearch;
 assert.equal(vm.runInContext('stocks.length',context),0);assert.equal(nodes['load-button'].disabled,false);assert.match(nodes['analysis-card'].innerHTML,/Nicht beurteilbar/);
}
console.log('Paket09 capital/cost/risk changes discard stale research and clear main-card values.');
// Paket10: invalid input is recoverable by keyboard and has a linked error.
for(const value of ['', 'SPY', 'AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA, IBM', '<INVALID>']){
 const count=requests.length;nodes.symbols.value=value;
 await vm.runInContext('loadResearch()',context);
 assert.equal(requests.length,count,'invalid watchlist must not fetch');
 assert.equal(active.id,'symbols');assert.equal(nodes.symbols.getAttribute('aria-invalid'),'true');
 assert.equal(nodes['symbols-error'].hidden,false);assert.match(nodes['symbols-error'].textContent,/1–7/);
 assert.equal(nodes['view-analysis'].hidden,false);assert.equal(nodes['view-analysis'].getAttribute('aria-busy'),'false');
 assert.equal(nodes['best-return'].textContent,'—');assert.match(nodes['analysis-card'].innerHTML,/Nicht beurteilbar/);
}
nodes.symbols.value='AAPL';await nodes.symbols.fire('input');
assert.equal(nodes.symbols.getAttribute('aria-invalid'),'false');assert.equal(nodes['symbols-error'].hidden,true);
assert.match(nodes.symbols.getAttribute('aria-describedby'),/symbols-error/);
assert.equal(nodes.banner.getAttribute('aria-atomic'),'true');
// All-negative historical observations must not produce a positive reference candidate.
const negative=fixture(['AAPL']);negative.stocks[0].expectedReturn=-.03;negative.best=negative.stocks[0];
const negativeLoad=vm.runInContext('loadResearch()',context);await respond(requests.shift(),negative);await negativeLoad;
assert.equal(vm.runInContext('best',context),null);assert.equal(nodes['paper-button'].disabled,true);
assert.match(nodes['candidate-cards'].innerHTML,/-3,0 %/);assert.match(nodes['analysis-card'].innerHTML,/Nicht beurteilbar/);
// Incomplete stock/SPY coverage removes observations from every reachable selector.
const missing=fixture(['AAPL']);missing.dataQuality.find(q=>q.symbol==='SPY').quality.usable=false;
const missingLoad=vm.runInContext('loadResearch()',context);await respond(requests.shift(),missing);await missingLoad;
assert.equal(vm.runInContext('stocks.length',context),0);assert.equal(nodes['best-return'].textContent,'—');
assert.ok(!nodes['detail-symbol'].innerHTML.includes('AAPL'));assert.match(nodes['analysis-card'].innerHTML,/Nicht beurteilbar/);
console.log('Paket10 Mock-DOM: invalid/empty watchlist focus and linked error, no invalid fetch, recovery, negative observations and missing benchmark coverage. Real browser/screenreader acceptance remains unavailable.');
// Package A: long-running, aborted, semantic 200 and malformed replies retain
// useful same-watchlist information only with an explicit stale status.
nodes.symbols.value='AAPL';await nodes.symbols.fire('input');
let work=vm.runInContext('loadResearch()',context);await respond(requests.shift(),fixture(['AAPL']));await work;
work=vm.runInContext('loadResearch()',context);let req=requests.shift();
assert.equal(nodes['load-button'].disabled,true);assert.match(nodes.stocks.innerHTML,/Veraltet/);
[...timers.values()].find(t=>t.delay===8000).fn();assert.match(nodes['banner-title'].textContent,/noch in Bearbeitung/);
[...timers.values()].find(t=>t.delay===30000).fn();assert.equal(req.options.signal.aborted,true);
req.reject(Object.assign(new Error('aborted'),{name:'AbortError'}));await work;
assert.equal(vm.runInContext('researchState',context),'stale');assert.match(nodes.stocks.innerHTML,/AAPL/);assert.match(nodes.stocks.innerHTML,/Veraltet/);assert.match(nodes['banner-text'].textContent,/30 Sekunden/);assert.equal(nodes['load-button'].textContent,'Erneut versuchen');assert.equal(nodes['paper-button'].disabled,true);
for(const body of [{error:'provider',message:'Provider meldet Fehler'}, {status:'error',message:'Semantischer Fehler'}, {stocks:[]}, null]){
 work=vm.runInContext('loadResearch()',context);await respond(requests.shift(),body);await work;
 assert.equal(vm.runInContext('researchState',context),'stale');assert.match(nodes['banner-title'].textContent,/gescheitert/);assert.equal(nodes['load-button'].disabled,false);
}
work=vm.runInContext('loadResearch()',context);await respond(requests.shift(),fixture(['AAPL']));await work;
assert.equal(vm.runInContext('researchState',context),'ready');assert.ok(!nodes.stocks.innerHTML.includes('Veraltet'));assert.match(nodes['banner-title'].textContent,/Historische Analyse verfügbar/);
const partial=fixture(['AAPL','MSFT']);partial.dataQuality[1].quality.usable=false;partial.dataQuality[1].quality.issues=['Letzter Tageskurs fehlt'];
nodes.symbols.value='AAPL,MSFT';await nodes.symbols.fire('input');work=vm.runInContext('loadResearch()',context);await respond(requests.shift(),partial);await work;
assert.match(nodes.stocks.innerHTML,/AAPL/);assert.ok(!nodes.stocks.innerHTML.includes('MSFT'));assert.match(nodes['banner-text'].textContent,/MSFT: Letzter Tageskurs fehlt/);
console.log('Package A: slow/abort/retry, retained stale results, semantic HTTP200/schema errors and concrete partial-result reasons passed (synthetic DOM, no live acceptance).');
// V11 shared table/cards: assertions exercise the inline controller with synthetic
// API results. They are regression evidence, never visual or live acceptance.
assert.ok(html.indexOf('id="dashboard-stocks"')<html.indexOf('id="analysis-card-title"'),'main table precedes advanced analysis card');
assert.match(html,/max-width:780px[\s\S]*?\.dashboard-table thead\{display:none\}/);
assert.match(nodes['dashboard-stocks'].innerHTML,/AAPL/);assert.ok(!nodes['dashboard-stocks'].innerHTML.includes('MSFT'));
assert.match(nodes['dashboard-stocks'].innerHTML,/Nicht beurteilbar/);
assert.match(nodes['dashboard-stocks'].innerHTML,/Nicht verfügbar – Ausführungsdaten und historische Verfügbarkeit fehlen/);
assert.match(nodes['dashboard-stocks'].innerHTML,/Historisch, ohne Kosten/);
const cells=nodes['dashboard-stocks'].innerHTML.match(/<td>[\s\S]*?<\/td>/g);assert.equal(cells.length,7);assert.ok(!cells[2].includes('+2,0 %'),'historic return cannot enter net column');
for(const text of ['Einstiegsspanne','Stop / Ziel','Enddatum','Kostenannahmen','Gründe dafür','Gründe dagegen / fehlende Daten','Verwendete Indikatoren'])assert.match(cells[6],new RegExp(text));
nodes['dashboard-filter'].value='noSuitable';await nodes['dashboard-filter'].fire('change');assert.equal(nodes['dashboard-stocks'].innerHTML,'');assert.match(nodes['dashboard-empty'].textContent,/Filter/);
nodes['dashboard-filter'].value='unknown';await nodes['dashboard-filter'].fire('change');assert.match(nodes['dashboard-stocks'].innerHTML,/AAPL/);
nodes['dashboard-filter'].value='all';nodes.symbols.value='AAPL,MSFT,NVDA';await nodes.symbols.fire('input');work=vm.runInContext('loadResearch()',context);await respond(requests.shift(),fixture(['AAPL','MSFT','NVDA']));await work;
nodes['compare-one'].value='AAPL';nodes['compare-two'].value='AAPL';await nodes['compare-apply'].fire('click');assert.match(nodes['compare-status'].textContent,/unterschiedliche/);
nodes['compare-two'].value='MSFT';await nodes['compare-apply'].fire('click');assert.match(nodes['dashboard-stocks'].innerHTML,/AAPL/);assert.match(nodes['dashboard-stocks'].innerHTML,/MSFT/);assert.ok(!nodes['dashboard-stocks'].innerHTML.includes('NVDA'));
await nodes['compare-reset'].fire('click');assert.match(nodes['dashboard-stocks'].innerHTML,/NVDA/);
work=vm.runInContext('loadResearch()',context);assert.match(nodes['dashboard-stocks'].innerHTML,/Veraltet/);req=requests.shift();req.reject(Error('Netzwerkfehler'));await work;assert.match(nodes['dashboard-stocks'].innerHTML,/Veraltet/);assert.match(nodes['dashboard-stocks'].innerHTML,/NVDA/);
// HTML escaping in user/provider sourced calendar titles; unknown coverage stays visible.
vm.runInContext("calendarData={events:[{date:'2026-10-07',title:'<script>unsafe</script>',confirmationStatus:'vorläufig'}],risks:[]};renderDashboard()",context);
assert.match(nodes['dashboard-stocks'].innerHTML,/&lt;script&gt;/);assert.ok(!nodes['dashboard-stocks'].innerHTML.includes('<script>unsafe'));
console.log('V11 regression: visible seven-column table, labels for mobile cards, common quality/status gate, net/historic separation, complete disclosures, filters, two-stock comparison, stale retention, calendar escaping. Real desktop/mobile and real API acceptance remain blocked.');

// Qualified experimental input remains distinct from released forecasts; data
// gaps must never become a no-suitable verdict. Reuse the common policy fixture.
nodes['risk-max-loss'].value='100';nodes['risk-min-liquidity'].value='100000';
vm.runInContext("cardFixture.evidence.costs='qualified';stocks=[cardFixture];researchState='ready';dashboardComparison=[];calendarData=null;renderDashboard()",context);
assert.match(nodes['dashboard-stocks'].innerHTML,/Aktuell keine geeignete Aktie/);assert.ok(!nodes['dashboard-stocks'].innerHTML.includes('Nicht beurteilbar'));
assert.match(nodes['dashboard-stocks'].innerHTML,/Experimentelles Szenario/);assert.match(nodes['dashboard-stocks'].innerHTML,/Prognosefreigabe fehlt/);
nodes['dashboard-filter'].value='noSuitable';await nodes['dashboard-filter'].fire('change');assert.match(nodes['dashboard-stocks'].innerHTML,/SYNTH/);
nodes['risk-max-loss'].value='';vm.runInContext('renderDashboard()',context);assert.equal(nodes['dashboard-stocks'].innerHTML,'');
nodes['dashboard-filter'].value='unknown';await nodes['dashboard-filter'].fire('change');assert.match(nodes['dashboard-stocks'].innerHTML,/Nicht beurteilbar/);

vm.runInContext("calendarData={events:[{date:'2026-10-07',title:'CPI',confirmationStatus:'source-observation-unqualified'}],risks:[]};renderCalendarSummary()",context);
assert.match(nodes['dashboard-stocks'].innerHTML,/Quelle beobachtet · noch nicht fachlich geprüft/);assert.ok(!nodes['dashboard-stocks'].innerHTML.includes('source-observation-unqualified'));
