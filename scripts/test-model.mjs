import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "../worker/index.js";
import {session,lastCompleted} from "../worker/data.js";

const page = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
const inlineScript = page.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inlineScript, "dashboard has an inline script");
new Function(inlineScript[1]);

const originalFetch = globalThis.fetch;
const calls = [];
const dates = tradingDates(1300);
const symbols = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "SPY"];
globalThis.fetch = async (url) => {
  const parsed = new URL(url);
  const symbol = parsed.searchParams.get("symbol");
  assert.ok(symbols.includes(symbol), "only watchlist symbols and SPY are requested");
  assert.equal(parsed.searchParams.get("outputsize"), "1300");
  assert.equal(parsed.searchParams.get("adjust"), "all");
  assert.equal(parsed.searchParams.get("apikey"), "test-secret");
  calls.push(symbol);
  return Response.json({ meta: { currency: "USD", mic_code:"XNAS",exchange_timezone:"America/New_York" }, values: syntheticSeries(symbol, dates).reverse() });
};

try {
  const missing = await worker.fetch(new Request("https://test.local/api/stocks?symbols=AAPL"), {});
  assert.equal(missing.status, 503, "missing secret is explicit");

  const response = await worker.fetch(
    new Request("https://test.local/api/stocks?symbols=AAPL,MSFT,NVDA,AMZN,GOOGL"),
    { TWELVEDATA_API_KEY: "test-secret" },
  );
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.provider, "Twelve Data");
  assert.equal(result.stocks.length, 5);
  assert.equal(result.benchmark.symbol, "SPY");
  assert.equal(result.model.target, 0.05);
  assert.equal(result.model.horizon, 20);
  assert.equal(result.contract.version,'analysis-v1');assert.equal(result.contract.horizon,20);
  assert.equal(result.scenario.currency,'USD');assert.equal(result.scenario.capital,10000);
  assert.equal(result.resultLabel,'Historischer Vergleich');assert.equal(result.expectedNetReturn,null);
  assert.ok(result.stocks.every(stock=>stock.expectedNetReturn===null&&stock.returnMetrics.strategyNet===null&&stock.returnMetrics.stockAt20===null));
  assert.equal(result.comparisonModel.rankingChanged, false);
  assert.equal(result.comparisonModel.outOfSampleVerified, false);
  assert.ok(result.stocks.every(stock=>stock.newAnalogs.net.expectedNetReturn===null));
  assert.ok(result.stocks.every((stock) => stock.historyBars >= 1200 && Number.isFinite(stock.score)));
  assert.ok(result.stocks.every((stock) => stock.sampleCount >= 12 && Number.isFinite(stock.expectedReturn)));
  assert.ok(result.backtest.windows >= 12);
  assert.ok(result.backtest.recent.length <= 10);
  assert.ok(result.backtest.recent.every((trade) =>
    trade.symbol === null || (Number.isFinite(trade.expectedReturn) && Number.isFinite(trade.realizedReturn))));
  assert.equal(calls.length, 6, "one historical request per symbol plus SPY");
  assert.ok(!JSON.stringify(result).includes("test-secret"), "secret is absent from API response");

  const invalid = await worker.fetch(
    new Request("https://test.local/api/stocks?symbols=AAPL,SPY"),
    { TWELVEDATA_API_KEY: "test-secret" },
  );
  assert.equal(invalid.status, 400, "SPY is reserved as the market benchmark");
  // A fresh last bar does not override defects elsewhere in the accepted history.
  const validFetch=globalThis.fetch;
  const baselinePair=await (await worker.fetch(new Request('https://test.local/api/stocks?symbols=AAPL,MSFT'),{TWELVEDATA_API_KEY:'test-secret'})).json();
  const originalDecision=baselinePair.backtest.decisions[0];
  const decisionState=row=>({date:row.decisionDate,universe:row.universe,candidates:row.candidates,symbol:row.symbol,expectedReturn:row.expectedReturn,expectedTargetProbability:row.expectedTargetProbability});
  globalThis.fetch=async url=>{const response=await validFetch(url);const payload=await response.json();if(new URL(url).searchParams.get('symbol')==='AAPL')payload.values.push({...payload.values[100]});return Response.json(payload)};
  const excluded=await (await worker.fetch(new Request('https://test.local/api/stocks?symbols=AAPL,MSFT'),{TWELVEDATA_API_KEY:'test-secret'})).json();
  assert.ok(!excluded.stocks.some(stock=>stock.symbol==='AAPL'));
  assert.ok(excluded.best?.symbol!=='AAPL');
  assert.equal(excluded.backtest.version,'selection-v2');
  assert.deepEqual(decisionState(excluded.backtest.decisions[0]),decisionState(originalDecision),'future duplicate must not change earlier API decision');
  assert.ok(excluded.backtest.decisions.some(row=>row.universe.includes('AAPL')),'later duplicate must not remove earlier historical membership');
  assert.equal(excluded.dataQuality.find(item=>item.symbol==='AAPL').quality.usable,false);
  assert.ok(excluded.errors.some(error=>error.symbol==='AAPL'));
  globalThis.fetch=async url=>{const response=await validFetch(url);const payload=await response.json();if(new URL(url).searchParams.get('symbol')==='SPY')payload.values[100].low='-1';return Response.json(payload)};
  const invalidBenchmark=await worker.fetch(new Request('https://test.local/api/stocks?symbols=MSFT'),{TWELVEDATA_API_KEY:'test-secret'});
  assert.equal(invalidBenchmark.status,502);
  const blockedCurrent=await invalidBenchmark.json();
  assert.ok(blockedCurrent.backtest.decisions.length,'historical decisions remain available while current SPY is blocked');
  assert.ok(blockedCurrent.backtest.decisions[0].universe.includes('MSFT'),'later SPY defect must not remove earlier stock universe');
  console.log("Model checks passed: page syntax, secret handling, adjusted 1,300-bar history, analogue estimates, and walk-forward results.");
} finally {
  globalThis.fetch = originalFetch;
}

function tradingDates(count) {
  const output = [];
  const day = new Date(lastCompleted(new Date(),"XNAS").date+"T12:00:00Z");
  day.setUTCHours(0, 0, 0, 0);
  while (output.length < count) {
    if (session(day.toISOString().slice(0,10),"XNAS")?.open) output.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return output.reverse();
}

function syntheticSeries(symbol, dates) {
  const offset = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "SPY"].indexOf(symbol);
  let previous = 70 + offset * 23;
  return dates.map((datetime, index) => {
    const dailyReturn = 0.00035 + offset * 0.00013 +
      0.005 * Math.sin((index + offset * 17) / 47) +
      0.003 * Math.sin(index / 9 + offset) +
      0.002 * Math.cos(index / 19 + offset * 2);
    const open = previous * (1 + 0.0003 * Math.sin(index * 1.7 + offset));
    const close = open * Math.exp(dailyReturn);
    const high = Math.max(open, close) * 1.006;
    const low = Math.min(open, close) * 0.994;
    previous = close;
    return { datetime, open: String(open), high: String(high), low: String(low), close: String(close) };
  });
}

