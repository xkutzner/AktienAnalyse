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
