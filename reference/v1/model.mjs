const HORIZON=20, TARGET=0.05, MIN_ANALOGS=12;
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
    if (!bars[index]) return null;
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

function walkForward(series, records, marketBars, marketFeatures, dates) {
  const testStart = Math.max(260, dates.length - 504);
  const windows = [];
  for (let index = testStart; index + HORIZON < dates.length; index += HORIZON) {
    const marketOutcome = simulateTarget(marketBars, index);
    if (!marketOutcome) continue;
    const ranked = series.map((stock) => {
      const features = featureAt(stock.bars, marketBars, index);
      if (!features) return null;
      const estimateAtDate = estimate(features, records[stock.symbol], marketFeatures[index]?.r20 >= 0, index);
      return { symbol: stock.symbol, features, ...estimateAtDate, outcome: simulateTarget(stock.bars, index) };
    }).filter((row) => row && row.outcome && row.sampleCount >= MIN_ANALOGS && Number.isFinite(row.expectedReturn))
      .sort((a, b) => b.expectedReturn - a.expectedReturn || b.probabilityTarget - a.probabilityTarget || b.features.score - a.features.score);
    const pick = ranked[0] && ranked[0].expectedReturn > 0 ? ranked[0] : null;
    windows.push({
      date: dates[index + 1],
      symbol: pick?.symbol || null,
      expectedReturn: pick?.expectedReturn ?? null,
      expectedTargetProbability: pick?.probabilityTarget ?? null,
      realizedReturn: pick?.outcome.tradeReturn ?? 0,
      targetHit: pick?.outcome.targetHit ?? false,
      averageAdverseMove: pick?.outcome.adverseMove ?? 0,
      benchmarkReturn: marketOutcome.tradeReturn,
      benchmarkTargetHit: marketOutcome.targetHit,
    });
  }
  const trades = windows.filter((window) => window.symbol);
  const selectedReturns = windows.map((window) => window.realizedReturn);
  const spyReturns = windows.map((window) => window.benchmarkReturn);
  const tradeReturns = trades.map((window) => window.realizedReturn);
  return {
    method: "Walk-forward, nicht überlappende 20-Tage-Perioden",
    testFrom: windows[0]?.date || null,
    testTo: windows.at(-1)?.date || null,
    windows: windows.length,
    tradeCount: trades.length,
    target: TARGET,
    averageReturnPerWindow: mean(selectedReturns),
    averageTradeReturn: mean(tradeReturns),
    hitRate: trades.length ? trades.filter((window) => window.targetHit).length / trades.length : null,
    winRate: trades.length ? trades.filter((window) => window.realizedReturn > 0).length / trades.length : null,
    averageAdverseMove: trades.length ? mean(trades.map((window) => window.averageAdverseMove)) : null,
    averageBenchmarkReturn: mean(spyReturns),
    excessPerWindow: mean(selectedReturns) - mean(spyReturns),
    maxDrawdown: maxDrawdown(selectedReturns),
    minimumTrades: 12,
    sufficientSample: trades.length >= 12,
    recent: windows.slice(-10).reverse(),
  };
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

export { featureAt, buildRecords, simulateTarget, estimate, walkForward };
