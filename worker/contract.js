// Product definitions shared by API and rendered UI; no prognostic qualification.
export const ANALYSIS_CONTRACT=Object.freeze({
 version:'analysis-v1',side:'long',leverage:1,currency:'USD',universe:'Unterstützte US-Aktien innerhalb der angegebenen Watchlist',
 decision:'Nach abgeschlossenem Tageskurs und bestätigter Datenverfügbarkeit',
 entry:'Frühestens nächstes reguläres Open; fehlende Eröffnung bleibt unbekannt',
 horizon:20,entryDay:1,end:'Regulärer Schluss von Handelstag 20; kein stilles Verlängern',
 scenario:{defaultCapital:10000,minCapital:.01,step:.01,label:'Szenario-Anlagebetrag',currency:'USD',portfolioCapital:false},
 returns:{
  stockAt20:{label:'Aktienrendite am Tag 20',basis:'Aktie vom nächsten regulären Open bis Schluss von Tag 20; unabhängig von frühem Strategieausstieg'},
  strategy:{label:'Strategieertrag bis zum Ausstieg',basis:'Trade einschließlich seiner Kosten bis zum tatsächlichen modellierten Ausstieg'},
  window:{label:'Kapitalrendite über das Vergleichsfenster',basis:'Gesamter Szenario-Anlagebetrag bis Schluss von Tag 20, einschließlich Cash nach frühem Verkauf'},
  historicalMean:{label:'Historischer mittlerer Strategie-Proxy ohne Kosten',basis:'Bereinigte Vergleichskurse; keine erwartete Nettorendite'}
 },
 resultTypes:{historical:'Historischer Vergleich',costScenario:'Retrospektives Kostenszenario',experimental:'Experimentelle Schätzung',validated:'Auf zeitlich getrennten Daten geprüft'},
 states:{unknown:'Nicht beurteilbar',notSuitable:'Nicht geeignet',cash:'Bewusst Cash halten',experimental:'Experimentell beobachten'},
 costs:{currency:'USD',fixedFeeBasis:'Feste Gebühren pro Order in USD',bps:'10 Basispunkte = 0,10 %',spread:'Einseitige Ausführungskonzession; getrennt von Slippage, Standard 0 bp ungeprüfte Annahme',status:'Modellannahmen; keine bestätigten Brokerabrechnungen',fx:'Ohne belegte FX-Daten keine EUR-Nettorendite'},
 validatedPurchaseReleased:false
});
export function scenarioCapital(value=ANALYSIS_CONTRACT.scenario.defaultCapital){
 if(typeof value!=='number'||!Number.isFinite(value)||value<ANALYSIS_CONTRACT.scenario.minCapital||Math.round(value*100)/100!==value||value>Number.MAX_SAFE_INTEGER)throw Error('Szenario-Anlagebetrag muss eine positive endliche Zahl in USD sein');
 return value;
}
export function analysisContext(capital,costs){
 return {contract:ANALYSIS_CONTRACT,scenario:{capital:scenarioCapital(capital),currency:'USD',portfolioCapital:false},costs,resultType:'historical',resultLabel:ANALYSIS_CONTRACT.resultTypes.historical,expectedNetReturn:null};
}
export function candidateStatus(forecast){
 return !Number.isFinite(forecast.expectedReturn)?'unknown':forecast.expectedReturn>0?'experimental':'notSuitable';
}
export function watchlistStatus(stocks){
 if(stocks.some(stock=>stock.analysisStatus==='experimental'))return 'experimental';
 if(!stocks.length||stocks.some(stock=>stock.analysisStatus==='unknown'))return 'unknown';
 return 'cash';
}

export function simulationReturnMetrics(result,capital){
 const complete=result.status!=='blocked'&&result.daily?.length===ANALYSIS_CONTRACT.horizon+1;
 return {stockAt20:null,strategyNet:result.status==='blocked'?null:result.netReturn??null,capitalWindowNet:complete?result.daily.at(-1).equity/scenarioCapital(capital)-1:null};
}

// One policy for API and UI. Qualification is internal evidence, never a release flag.
export const ANALYSIS_CARD_STATES=Object.freeze({checkedSuitable:'Geeignet im geprüften Modus',experimentalObserving:'Experimentell beobachten',noSuitable:'Aktuell keine geeignete Aktie',unknown:'Nicht beurteilbar'});
export function analysisCardPolicy(input={}){
 const evidence=input.evidence||{}, net=input.net||{}, risk=input.riskConfiguration||{};
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const blocks=[];
 if(evidence.data!=='qualified')blocks.push('Ausführungsdaten und historische Verfügbarkeit fehlen');
 if(evidence.costs!=='qualified')blocks.push('Vollständige Netto-Kosten fehlen');
 if(evidence.liquidity==='qualified'&&(!finite(input.dailyValueUSD)||input.dailyValueUSD<0))blocks.push('Handelswert unbekannt');
 if(evidence.liquidity!=='qualified')blocks.push('Liquidität unbekannt oder nicht ausreichend');
 if(!finite(risk.maxLossUSD)||risk.maxLossUSD<=0||!finite(risk.minDailyValueUSD)||risk.minDailyValueUSD<=0)blocks.push('Risikobudget und Liquiditätsgrenze nicht konfiguriert');
 if(!finite(net.middle)||!finite(net.adverse)||!finite(net.lossUSD)||net.lossUSD<0||net.adverse>net.middle)blocks.push('Netto- und Verlustszenarien unbekannt');
 const candidate=input.rawTradePlan;
 const plan=evidence.data==='qualified'&&candidate?.version==='trade-plan-v1'&&candidate.status==='experimental'&&typeof input.asOf==='string'&&candidate.decisionDate===input.asOf.slice(0,10)&&Number.isFinite(Date.parse(candidate.asOf))&&(input.asOf.length===10||Date.parse(input.asOf)>=Date.parse(candidate.asOf))&&finite(candidate.referenceClose)&&candidate.referenceClose>0&&finite(candidate.entryRange?.min)&&finite(candidate.entryRange?.max)&&candidate.entryRange.min>0&&candidate.entryRange.max>=candidate.entryRange.min&&finite(candidate.stopFraction)&&candidate.stopFraction>0&&candidate.stopFraction<1&&candidate.targetFraction===.05&&typeof candidate.plannedEndDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(candidate.plannedEndDate)?candidate:null;
 if(!plan)blocks.push('Qualifizierter experimenteller Rohpreisplan fehlt');
 const qualified=blocks.length===0;
 let status='unknown';
 if(qualified)status=net.lossUSD>risk.maxLossUSD||input.dailyValueUSD<risk.minDailyValueUSD||net.middle<=0?'noSuitable':'experimentalObserving';
 if(qualified&&net.lossUSD>risk.maxLossUSD)blocks.push('Modellierter Verlust überschreitet das Risikobudget');
 if(qualified&&input.dailyValueUSD<risk.minDailyValueUSD)blocks.push('Liquiditätsgrenze unterschritten');
 if(qualified&&net.middle<=0)blocks.push('Kein positives mittleres Nettoszenario');
 const reasons=blocks.length?blocks.slice(0,2):['Qualifiziertes experimentelles Szenario','Geprüfter Kaufmodus bis Paket 14 gesperrt'];
 while(reasons.length<2)reasons.push('Cash ist eine reguläre Alternative');

 return {version:'analysis-card-v1',status,label:ANALYSIS_CARD_STATES[status],reasons,constraints:blocks,forecastReleased:false,cashAlternative:true,resultStatus:qualified?'Experimentelles Szenario':'Historischer Vergleich; Netto und Risiko unbekannt',asOf:input.asOf||null,costStatus:evidence.costs==='qualified'?'Qualifizierte Szenariokosten':'Ungeprüfte Modellannahmen',middleNet:qualified?net.middle:null,adverseNet:qualified?net.adverse:null,lossUSD:qualified?net.lossUSD:null,entryRange:plan?.entryRange||null,stop:plan?plan.referenceClose*(1-plan.stopFraction):null,target:plan?plan.referenceClose*(1+plan.targetFraction):null,plannedEndDate:plan?.plannedEndDate||null,historicalMean:input.qualityUsable===true&&input.sampleCount>=12&&finite(input.expectedReturn)?input.expectedReturn:null};
}
