import {createTradePlan} from '../worker/data.js';
import assert from 'node:assert/strict';
import {analysisCardPolicy,ANALYSIS_CARD_STATES} from '../worker/contract.js';
import {renderPage} from './render-page.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
const rawTradePlan=createTradePlan({decisionDate:'2026-11-27',asOf:'2026-11-27T18:01:00Z',closeAvailableAt:'2026-11-27T18:00:30Z',mic:'XNAS',priceBasis:'raw',referenceClose:100});
const good={rawTradePlan,asOf:'2026-11-27T18:01:00Z',qualityUsable:true,sampleCount:20,expectedReturn:.02,evidence:{data:'qualified',costs:'qualified',liquidity:'qualified'},dailyValueUSD:1000000,riskConfiguration:{maxLossUSD:1000,minDailyValueUSD:100000},net:{middle:.02,adverse:-.05,lossUSD:500}};
assert.equal(analysisCardPolicy({...good,rawTradePlan:null}).status,'unknown');
assert.equal(analysisCardPolicy({...good,dailyValueUSD:1}).status,'noSuitable');
assert.equal(analysisCardPolicy(good).status,'experimentalObserving');
for(const input of [{...good,net:{...good.net,middle:-.01}},{...good,net:{...good.net,lossUSD:1001}}])assert.equal(analysisCardPolicy(input).status,'noSuitable');
for(const input of [{...good,evidence:{}},{...good,evidence:{...good.evidence,costs:'unknown'}},{...good,evidence:{...good.evidence,liquidity:'unknown'}},{...good,riskConfiguration:{}},{...good,net:{}},{qualityUsable:false},{sampleCount:11,expectedReturn:.02}]){
 const card=analysisCardPolicy(input);assert.equal(card.status,'unknown');assert.equal(card.middleNet,null);assert.equal(card.adverseNet,null);assert.equal(card.reasons.length,2);
}
assert.equal(analysisCardPolicy({qualityUsable:true,sampleCount:11,expectedReturn:.1}).historicalMean,null);
const historical=analysisCardPolicy({qualityUsable:true,sampleCount:20,expectedReturn:.02});assert.equal(historical.historicalMean,.02);assert.equal(historical.status,'unknown');
assert.equal(analysisCardPolicy({...good,forecastReleased:true,validatedPurchaseReleased:true}).forecastReleased,false);
const html=renderPage(fs.readFileSync('app/index.html','utf8'));
const code=html.match(/const ANALYSIS_CARD_STATES=[\s\S]*?;\n    const UI_ANALYSIS_CONTRACT/)[0].replace(/\n    const UI_ANALYSIS_CONTRACT$/,'');
const context=vm.createContext({});vm.runInContext(code,context);context.input=good;
assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('analysisCardPolicy(input)',context))),analysisCardPolicy(good));
assert.match(html,/id="analysis-card"/);assert.match(html,/Historische Quantile sind keine Zukunftsgarantie/);assert.equal(ANALYSIS_CARD_STATES.checkedSuitable,'Geeignet im geprüften Modus');
console.log('Analysis card: shared API/UI policy, positive/negative/budget/data/cost/liquidity/insufficient fixtures, unknown metrics and immutable release gate checked; synthetic only.');

for(const patch of [{referenceClose:-1},{entryRange:{min:101,max:99}},{stopFraction:1},{targetFraction:.2},{plannedEndDate:'tomorrow'}])assert.equal(analysisCardPolicy({...good,rawTradePlan:{...rawTradePlan,...patch}}).status,'unknown');
for(const patch of [{lossUSD:-1},{adverse:.03}])assert.equal(analysisCardPolicy({...good,net:{...good.net,...patch}}).status,'unknown');
assert.equal(analysisCardPolicy({...good,dailyValueUSD:-1}).status,'unknown');

for(const asOf of ['2026-10-02','2026-11-27T17:00:00Z','invalid'])assert.equal(analysisCardPolicy({...good,asOf}).status,'unknown');
