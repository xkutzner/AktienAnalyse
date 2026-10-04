import {validateTradePlan, regularSessionOpenUtc} from "./data.js";
export const SIMULATION_VERSION='execution-v4';
export const DEFAULT_COSTS=Object.freeze({entryFeeBps:10,exitFeeBps:10,entryFixedFee:0,exitFixedFee:0,entrySlippageBps:5,exitSlippageBps:5,entrySpreadBps:0,exitSpreadBps:0});
export const BROKER_PROFILES={"tr-best": {"name": "Trade Republic · Bestpreis", "currency": "EUR", "fixed": 1, "feeText": "1 EUR je Kauf / Verkauf", "scope": "Bestpreis, Aktien / ETFs", "api": "Keine offizielle öffentliche Trading-API verifiziert; derzeit keine Empfehlung für einen Bot", "source": "https://support.traderepublic.com/de-de/3372dc64-59cb-4521-a424-1ee812f264a4", "note": "Andere Ausführungsplätze und EUR-Kurse. Im USD-Simulator gesperrt; keine erfundene Umrechnung.", "checkedAt": "2026-10-04", "historicalRatesVerified": false}, "tr-direct": {"name": "Trade Republic · Direktpreis", "currency": "EUR", "fixed": 2, "feeText": "2 EUR je Kauf / Verkauf (1 EUR Abwicklung + 1 EUR Handelsplatz)", "scope": "Direktpreis; gewählte Börse", "api": "Keine offizielle öffentliche Trading-API verifiziert", "source": "https://support.traderepublic.com/de-de/835f9deb-b864-4587-b428-7facfc55296c", "note": "Bei Nicht-EUR-Börsen Währungsumrechnung. Historische FX-Kosten fehlen; USD-Simulation gesperrt.", "checkedAt": "2026-10-04", "historicalRatesVerified": false}, "ibkr-fixed": {"name": "Interactive Brokers · US Fixed SmartRouting", "currency": "USD", "perShare": 0.005, "minimum": 1, "cap": 0.01, "feeText": "0,005 USD je Aktie; mindestens 1 USD, höchstens 1 % Orderwert", "scope": "Ganze US-Aktien, Fixed, SmartRouting; keine direkt gerouteten API-Orders", "api": "TWS API / IB Gateway · erste Wahl: direkte API und niedrige Basisprovision", "apiSource": "https://interactivebrokers.ie/de/trading/ib-api.php", "source": "https://www.interactivebrokers.ie/en/pricing/commissions-stocks.php", "note": "Nur Basisprovision. Regulatorische Verkaufsgebühren, FX, Marktdatenabos und Teilausführungen fehlen.", "checkedAt": "2026-10-04", "historicalRatesVerified": false}, "captrader-us": {"name": "CapTrader · US-Aktien", "currency": "USD", "perShare": 0.01, "minimum": 2, "feeText": "0,01 USD je Aktie; mindestens 2 USD", "scope": "Standard-US-Aktien, Nasdaq; kein OTC, keine Bruchteile", "api": "IB API / IB Gateway · Alternative mit deutschem Ansprechpartner", "apiSource": "https://www.captrader.com/plattformen/handel-via-api/ib-api/", "source": "https://www.captrader.com/konditionen/aktien-handel/", "note": "Nur Basisprovision; Obergrenze nicht verifiziert. Regulatorische Verkaufsgebühren, FX, Marktdatenabos und Sonderfälle fehlen.", "checkedAt": "2026-10-04", "historicalRatesVerified": false}, "lynx-us": {"name": "LYNX · US-Aktien Nasdaq", "currency": "USD", "perShare": 0.01, "minimum": 5, "cap": 0.02, "feeText": "0,01 USD je Aktie; mindestens 5 USD, höchstens 2 % Orderwert", "scope": "Ganze US-Aktien, Nasdaq-Standardtarif", "api": "TWS API / IB Gateway · weitere Alternative mit deutschem Service", "apiSource": "https://www.lynxbroker.de/service/software/trader-workstation/", "source": "https://www.lynxbroker.de/preise-konditionen/", "note": "Nur Basisprovision. FX, Steuern, Marktdatenabos, mögliche externe Gebühren und Teilausführungen fehlen.", "checkedAt": "2026-10-04", "historicalRatesVerified": false}};
export function brokerBaseFee(id,shares,price){
 const p=BROKER_PROFILES[id];if(!p||p.currency!=='USD'||!Number.isFinite(shares)||shares<0||!Number.isFinite(price)||price<=0)throw Error('Brokergebühr nicht in USD berechenbar');
 const fee=Math.max(p.minimum,shares*p.perShare);return p.cap?Math.min(fee,shares*price*p.cap):fee;
}
export function validateCosts(input={}){
 const costs={...DEFAULT_COSTS,...input};
 for(const [key,value] of Object.entries(costs))if(!Object.hasOwn(DEFAULT_COSTS,key)||!Number.isFinite(value)||value<0||(key.endsWith('Bps')&&value>1000))throw Error('Ungültige Kostenannahme: '+key);
 return costs;
}
export function dailyDrawdown(curve){let peak=0,dd=0;for(const row of curve){if(!Number.isFinite(row.equity))return null;peak=Math.max(peak,row.equity);if(peak>0)dd=Math.min(dd,row.equity/peak-1)}return dd}
const validBar=b=>b&&[b.open,b.high,b.low,b.close].every(v=>Number.isFinite(v)&&v>0)&&b.high>=Math.max(b.open,b.close,b.low)&&b.low<=Math.min(b.open,b.close,b.high);
// bars must be an expected regular-session spine, including null for absent sessions.
export function simulateTrade(bars,decisionIndex,actions,options={}){
 // Spread inputs are one-way execution concessions (not full quoted bid/ask spreads).
 const costs=validateCosts(options.costs),capital=options.capital??10000,horizon=options.horizon??20,target=.05;
 const broker=options.brokerProfile?BROKER_PROFILES[options.brokerProfile]:null;
 const blocked=reason=>({version:SIMULATION_VERSION,status:'blocked',reason,costs,grossReturn:null,netReturn:null,maxDrawdown:null,daily:[],...(options.tradePlan?{tradePlan:options.tradePlan,plannedEndDate:options.tradePlan.plannedEndDate||null}: {})});
 if(options.tradePlan!==undefined&&options.tradePlan!==null&&(typeof options.tradePlan!=='object'||Array.isArray(options.tradePlan)))return blocked('Ungültiger Tradeplan');
 if((options.currency??'USD')!=='USD')return blocked('Historische FX- und passende Ausführungsdaten fehlen: keine Nettorendite in anderer Währung');
 if(options.priceBasis&&options.priceBasis!=='raw')return blocked('Bereinigte Kurse sind nur Feature-/Proxybasis, keine Rohpreisausführung');
 if(broker&&['entryFeeBps','exitFeeBps','entryFixedFee','exitFixedFee'].some(key=>costs[key]!==0))return blocked('Brokerbasisprovision und benutzerdefinierte Gebühren dürfen nicht gleichzeitig angesetzt werden');
 if(options.brokerProfile&&!broker)return blocked('Unbekanntes Brokerprofil');
 if(broker?.currency==='EUR')return blocked('EUR-Brokergebühren / historische Wechselkurse und passende Ausführungsplätze fehlen');
 if(broker&&options.strict!==false)return blocked('Heutiger Brokertarif ist kein belegter historischer Tarif; nur Kostenszenario möglich');
 if(!Number.isInteger(decisionIndex)||decisionIndex<0||!Number.isFinite(capital)||capital<=0||!Number.isInteger(horizon)||horizon<1||horizon>20)return blocked('Ungültiges Kapital oder Haltedauer');
 if(!Array.isArray(actions?.splits)||!Array.isArray(actions?.dividends))return blocked('Maßnahmenledger fehlt oder ist unvollständig');
 if(actions.dividends.some(div=>div.currency&&div.currency!=='USD'))return blocked('Dividenden-FX fehlt');
 if(!actions?.coverageVerified)return blocked('Kapitalmaßnahmenabdeckung nicht bestätigt');
 if(options.strict!==false&&!actions.pointInTimeVerified)return blocked('Historische Informationsstände fehlen');
 const first=decisionIndex+1,last=decisionIndex+horizon,plan=options.tradePlan;
 if(plan&&(!validateTradePlan(plan,bars[decisionIndex])||horizon!==20||plan.validEntryDate!==bars[first]?.date||plan.plannedEndDate!==bars[last]?.date||plan.regularSessions.some((date,j)=>date!==bars[first+j]?.date)))return blocked('Ungültiger oder abgelaufener Tradeplan: Einstieg/Enddatum nicht verschieben');
 if(!bars[decisionIndex]?.date||!validBar(bars[first]))return blocked('Nächste reguläre Eröffnung fehlt: Einstieg nicht verschieben');
 if(bars[first].halted===true)return blocked('Handelsunterbrechung am Einstieg: keine nachweisbare Eröffnungsausführung');
 const entryOpen=bars[first].open,entryPrice=entryOpen*(1+(costs.entrySlippageBps+costs.entrySpreadBps)/10000);
 if(plan&&(entryPrice<plan.entryRange.min||entryPrice>plan.entryRange.max))return {...blocked('Einstieg außerhalb Preisbereich: verzichten oder neu bewerten; kein Verschieben'),tradePlan:plan,entryDisposition:'abstain-or-reevaluate'};
 let qty=(capital-costs.entryFixedFee)/(entryPrice*(1+costs.entryFeeBps/10000));
 if(broker){let low=0,high=Math.floor(capital/entryPrice);while(low<high){const mid=Math.ceil((low+high)/2);if(mid*entryPrice+brokerBaseFee(options.brokerProfile,mid,entryPrice)<=capital)low=mid;else high=mid-1}qty=low}
 if(qty<=0)return blocked('Kapital reicht nicht für Einstiegskosten');
 const entryFee=broker?brokerBaseFee(options.brokerProfile,qty,entryPrice):costs.entryFixedFee+qty*entryPrice*costs.entryFeeBps/10000;
 let shares=qty,cash=capital-qty*entryPrice-entryFee,receivable=0,grossCash=capital-qty*entryOpen;
 let mae=0,mfe=0,exitIndex=null,exitReason=null,exitPrice=null,exitFee=0,grossExit=null,uncertainIntraday=false,maeBounds=null,exitPriceBounds=null;
 const ledger=[{date:bars[first].date,type:'entry',price:entryPrice,shares:qty,fee:entryFee}],entitlements=[];
 const daily=[{date:bars[decisionIndex].date,day:0,cash:capital,positionValue:0,dividendReceivable:0,equity:capital,grossEquity:capital}];
 const assumptions=['Kosten sind Modellannahmen, keine Brokerabrechnung.','Bruchteile von Aktien, keine Mindeststückzahl.','Reguläre OHLC-Aggregate; Auktionsteilnahme und verfügbare Stückzahl nicht belegt.','Kein historischer Halt-/Liquiditätsfeed: fehlende Unterbrechungsmeldung beweist keine Unterbrechungsfreiheit.'];
 if(broker){assumptions[1]='Ganze Aktien am Einstieg; Split-Bruchteile nur modelliert.';assumptions.push(broker.name+': heutige Basisprovision als Szenario; '+broker.note)}
 for(let i=first;i<=last;i++){
  const bar=bars[i];
  if(!bar?.date)return {...blocked('Fehlender Handelstag: keine Ersatzkurse, kein Verschieben des Ausstiegs'),daily,partial:true};
  if(exitIndex===null&&!validBar(bar))return {...blocked('Fehlende oder unplausible OHLC: Bewertung/Ausführung unbekannt'),daily,partial:true};
  if(i>first&&exitIndex===null){
   for(const split of actions.splits.filter(s=>s.effectiveDate===bar.date)){if(!Number.isFinite(split.shareFactor)||split.shareFactor<=0)return blocked('Ungültiger Split');shares*=split.shareFactor;ledger.push({date:bar.date,type:'split',shareFactor:split.shareFactor,shares})}
   for(const div of actions.dividends.filter(d=>d.exDate===bar.date)){const amount=shares*div.amount;if(!Number.isFinite(amount)||amount<0)return blocked('Ungültige Dividende');receivable+=amount;entitlements.push({amount,paymentDate:div.paymentDate||null,paid:false});ledger.push({date:bar.date,type:'dividend-entitlement',amount,paymentDate:div.paymentDate||null})}
  }
  for(const div of entitlements.filter(d=>!d.paid&&d.paymentDate&&d.paymentDate<=bar.date)){cash+=div.amount;grossCash+=div.amount;receivable-=div.amount;div.paid=true;ledger.push({date:bar.date,type:'dividend-payment',amount:div.amount})}
  if(exitIndex===null){
   const limit=qty*entryPrice*(1+target)/shares;
   const stop=plan?qty*entryPrice*(1-plan.stopFraction)/shares:null;
   const stopGap=stop!==null&&bar.open<=stop,stopTouch=stop!==null&&bar.low<=stop;
   const thesis=plan&&Array.isArray(options.thesisInvalidations)&&options.thesisInvalidations.some(event=>event.date===bar.date&&Number.isFinite(Date.parse(event.availableAt))&&Date.parse(event.availableAt)<=Date.parse(regularSessionOpenUtc(bar.date,plan.mic))&&event.phase==='before-open');
   const openEligible=bar.open>=limit;
   const bufferedTouch=bar.high*(1-(costs.exitSlippageBps+costs.exitSpreadBps)/10000)>=limit;
   if(bar.halted===true){
    if(i===last)return {...blocked('Handelsunterbrechung an Tag '+horizon+': rechtzeitiger Ausstieg nicht nachweisbar'),daily,partial:true};
    assumptions.push(bar.date+': Zielausführung wegen dokumentierter Unterbrechung nicht angenommen.');
   }else if(thesis||stopGap||(!openEligible&&stopTouch)){
    exitReason=thesis?'thesis-invalidated-open':stopGap?'stop-open-gap':'stop-intraday-assumed';
    const rawExit=thesis||stopGap?bar.open:stop;
    exitPrice=rawExit*(1-(costs.exitSlippageBps+costs.exitSpreadBps)/10000);exitIndex=i;
    uncertainIntraday=exitReason==='stop-intraday-assumed';
    mae=Math.min(mae,shares*exitPrice/(qty*entryPrice)-1,shares*bar.open/(qty*entryPrice)-1);mfe=Math.max(mfe,shares*bar.open/(qty*entryPrice)-1);
    if(uncertainIntraday){maeBounds=[Math.min(mae,shares*bar.low/(qty*entryPrice)-1),mae];if(bufferedTouch){exitPriceBounds=[exitPrice,limit];assumptions.push(bar.date+': Stop und Ziel berührt; unbekannte Reihenfolge, konservativ Stop zuerst, Preisband nur modellierte Alternativen.')}assumptions.push('Stop-Fill am Trigger mit Kosten ist eine Modellannahme; keine garantierte Ausführung.');}
   }else if(openEligible||bufferedTouch){
    exitReason=openEligible?'target-open-gap':'target-intraday-assumed';
    exitPrice=openEligible?Math.max(limit,bar.open*(1-(costs.exitSlippageBps+costs.exitSpreadBps)/10000)):limit;
    uncertainIntraday=!openEligible;
    // Gap exit occurs at open: use only open. Intraday low ordering is unknown.
    const exitExcursion=shares*exitPrice/(qty*entryPrice)-1;
    mfe=Math.max(mfe,exitExcursion,openEligible?shares*bar.open/(qty*entryPrice)-1:exitExcursion);mae=Math.min(mae,exitExcursion,shares*bar.open/(qty*entryPrice)-1);
    if(uncertainIntraday){maeBounds=[Math.min(mae,shares*bar.low/(qty*entryPrice)-1),mae];assumptions.push(bar.date+': Tageshoch legt Limit-Fill nahe, beweist ihn aber nicht. Tief kann nach Verkauf liegen; MAE nur als Intervall.');}
    exitIndex=i;
   }else{
    mae=Math.min(mae,shares*bar.low/(qty*entryPrice)-1);mfe=Math.max(mfe,shares*bar.high/(qty*entryPrice)-1);
    if(bar.high>=limit)assumptions.push(bar.date+': Ziel nur berührt; Slippage-Puffer nicht erreicht, kein Limit-Fill modelliert.');
    if(i===last){exitReason='time-close';exitPrice=bar.close*(1-(costs.exitSlippageBps+costs.exitSpreadBps)/10000);mae=Math.min(mae,shares*exitPrice/(qty*entryPrice)-1);mfe=Math.max(mfe,shares*exitPrice/(qty*entryPrice)-1);exitIndex=i;}
   }
   if(exitIndex===i){
    const proceeds=shares*exitPrice;exitFee=broker?brokerBaseFee(options.brokerProfile,shares,exitPrice):costs.exitFixedFee+proceeds*costs.exitFeeBps/10000;
    grossExit=exitReason==='time-close'?bar.close:(['target-open-gap','stop-open-gap','thesis-invalidated-open'].includes(exitReason)?bar.open:exitReason==='stop-intraday-assumed'?qty*entryPrice*(1-plan.stopFraction)/shares:exitPrice);
    grossCash+=shares*grossExit;cash+=proceeds-exitFee;
    ledger.push({date:bar.date,type:'exit',reason:exitReason,price:exitPrice,shares,fee:exitFee,assumed:true});shares=0;
   }
  }
  const positionValue=shares?shares*bar.close:0;
  daily.push({date:bar.date,day:i-first+1,cash,positionValue,dividendReceivable:receivable,equity:cash+positionValue+receivable,grossEquity:grossCash+positionValue+receivable});
 }
 const exitDay=bars[exitIndex].date,atExit=daily.find(d=>d.date===exitDay);
 const exitConcession=Math.max(0,ledger.find(event=>event.type==='exit').shares*(grossExit-exitPrice)),exitBps=costs.exitSpreadBps+costs.exitSlippageBps;
 const exitSpread=exitBps?exitConcession*costs.exitSpreadBps/exitBps:0,exitSlippage=exitBps?exitConcession*costs.exitSlippageBps/exitBps:0;
 return {version:SIMULATION_VERSION,status:options.strict===false?'retrospective-assumed':'modeled-assumed',dayConvention:'Einstiegstag = Handelstag 1; Tag20 = decisionIndex+20',costs,costAssumption:true,currency:'USD',priceBasis:'raw',feeRule:broker?'broker-base-only':'fixed-plus-notional',executionConcessions:{entrySpread:qty*entryOpen*costs.entrySpreadBps/10000,entrySlippage:qty*entryOpen*costs.entrySlippageBps/10000,exitSpread,exitSlippage},capitalWindowNetReturn:daily.at(-1).equity/capital-1,entryDate:bars[first].date,exitDate:exitDay,holdingSessions:exitIndex-first+1,entryOpen,entryPrice,exitPrice,exitReason,exitExecutionProven:false,limitFillRule:'Open >= Limit: max(Limit, Open × (1−ExitSpread−ExitSlippage)); intraday nur High × (1−ExitSpread−ExitSlippage) >= Limit, Fill exakt Limit. Nie unter Verkaufslimit.',grossReturn:atExit.grossEquity/capital-1,netReturn:atExit.equity/capital-1,grossPnl:atExit.grossEquity-capital,netPnl:atExit.equity-capital,totalFees:entryFee+exitFee,mae:uncertainIntraday?null:mae,maeBounds:maeBounds||[mae,mae],mfe,maxDrawdown:dailyDrawdown(daily),daily,ledger,assumptions,noStopLoss:!plan,tradePlan:plan||null,plannedEndDate:plan?.plannedEndDate||bars[last].date,exitCategory:exitReason.startsWith('target')?'target':exitReason.startsWith('stop')?'stop':exitReason.startsWith('thesis')?'thesis':'time',exitPriceBounds};
}
export function simulatePortfolio(bars,decisions,actions,options={}){
 let capital=options.capital??10000,curve=[],trades=[],lastDecision=-1,grossCarry=0;
 for(const decision of decisions){
  if(decision<=lastDecision)throw Error('Entscheidungsfenster überlappen oder sind unsortiert');
  const result=simulateTrade(bars,decision,actions,{...options,capital});
  if(result.status==='blocked')return {status:'blocked',reason:result.reason,trades,curve,maxDrawdown:null,grossReturn:null,netReturn:null};
  // One position; keep Cash and receivables through day20, even after an early exit.
  if(trades.length&&decision!==lastDecision+20)return {status:'blocked',reason:'Portfolio benötigt lückenlose 20-Session-Fenster für tägliche Bewertung',trades,curve,maxDrawdown:null};
  if(trades.length&&result.daily[0].date!==curve.at(-1).date)return {status:'blocked',reason:'Bewertungsraster nicht zusammenhängend',trades,curve,maxDrawdown:null};
  // Do not silently reinvest unpaid dividend claims as cash.
  if(result.daily.at(-1).dividendReceivable>0)return {status:'blocked',reason:'Unbezahlte Dividendenforderung: nächste All-in-Position nicht ohne separate Cash-Allokation simulierbar',trades:[...trades,result],curve:[...curve,...result.daily.slice(trades.length?1:0)],maxDrawdown:null};
  curve.push(...result.daily.slice(trades.length?1:0).map(row=>({...row,grossEquity:row.grossEquity+grossCarry})));trades.push(result);capital=result.daily.at(-1).equity;grossCarry=curve.at(-1).grossEquity-capital;lastDecision=decision;
 }
 return {status:'modeled-assumed',trades,curve,maxDrawdown:dailyDrawdown(curve),netReturn:capital/(options.capital??10000)-1,grossReturn:curve.length?curve.at(-1).grossEquity/(options.capital??10000)-1:null,grossReturnStatus:'Identische Trades/Stückzahlen; ersparte Kosten bleiben unverzinst als Cash, keine unabhängige Brutto-Neuallokation'};
}


// Shared outcome adapter: features/adjusted proxies never enter this execution path.
export const EXECUTION_LABEL_VERSION='execution-label-v1';
export function executionLabel(bars,decisionIndex,actions,options={}){
 const unknown=reason=>({labelVersion:EXECUTION_LABEL_VERSION,executionVersion:SIMULATION_VERSION,index:decisionIndex,knownAtIndex:null,netReturn:null,capitalWindowNetReturn:null,netVerified:false,pointInTimeVerified:false,status:'unknown',reason});
 if(options.priceBasis!=='raw')return unknown('Qualifizierte Rohpreisbasis fehlt; adjusted Proxy bleibt separat');
 if(!Number.isInteger(options.knownAtIndex)||options.knownAtIndex<decisionIndex+(options.horizon??20))return unknown('Outcome-Verfügbarkeitsindex fehlt oder liegt vor Fensterende');
 const result=simulateTrade(bars,decisionIndex,actions,options);
 if(result.status==='blocked')return {...unknown(result.reason),execution:result};
 const pit=actions.pointInTimeVerified===true;
 return {labelVersion:EXECUTION_LABEL_VERSION,executionVersion:SIMULATION_VERSION,index:decisionIndex,knownAtIndex:options.knownAtIndex,netReturn:result.netReturn,capitalWindowNetReturn:result.capitalWindowNetReturn,netVerified:pit&&options.strict!==false,pointInTimeVerified:pit,status:'modeled-assumed',execution:result};
}
