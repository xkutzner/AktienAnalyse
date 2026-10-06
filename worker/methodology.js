// Documentation metadata only; never changes scoring, qualification or execution.
import {DATA_VERSION, RISK_VERSION, TRADE_PLAN_VERSION} from './data.js';
import {SIMULATION_VERSION, EXECUTION_LABEL_VERSION} from './simulation.js';
import {ANALOGUE_VERSION, ANALOGUE_PARAMETERS, PRICE_RESEARCH_VERSION} from './analogues.js';
import {ANALYSIS_CONTRACT, tradePriceLevels, analysisCardPolicy} from './contract.js';
import {REPRO_VERSION, RESEARCH_GRID, EVALUATION_PROTOCOL} from './reproducibility.js';
import {CAPABILITY_VERSION} from './capabilities.js';
import {EVENT_VERSION, MACRO_SNAPSHOT_VERSION} from './events.js';

export const METHODOLOGY_VERSION='methodology-registry-v1';
export const REFERENCE_MODEL_VERSION='reference-v1';
export const SELECTION_VERSION='selection-v2';
export const REFERENCE_FEATURES=Object.freeze([
 {key:'r20',label:'Momentum20',formula:'C / C[t−20] − 1',unit:'Dezimalrendite; Anzeige in %',weight:.25,sensitivity:300,influence:'positiv, begrenzt',scoreFormula:'begrenze(50 + r20 × 300, 0, 100)'},
 {key:'r60',label:'Momentum60',formula:'C / C[t−60] − 1',unit:'Dezimalrendite; Anzeige in %',weight:.20,sensitivity:150,influence:'positiv, begrenzt',scoreFormula:'begrenze(50 + r60 × 150, 0, 100)'},
 {key:'rel20',label:'Relative Stärke vs. SPY',formula:'Momentum20 Aktie − Momentum20 SPY',unit:'Dezimaldifferenz; Anzeige in Prozentpunkten',weight:.25,sensitivity:300,influence:'positiv, begrenzt',scoreFormula:'begrenze(50 + rel20 × 300, 0, 100)'},
 {key:'trend50',label:'Abstand zum SMA50',formula:'C / Mittelwert(C[t−49…t]) − 1',unit:'Dezimalverhältnis; Anzeige in %',weight:.20,sensitivity:250,influence:'positiv, begrenzt',scoreFormula:'begrenze(50 + trend50 × 250, 0, 100)'},
 {key:'vol20',label:'Volatilität p.a.',formula:'Stichproben-Stdabw(Tagesrenditen20) × √252',unit:'Annualisierte Dezimalvolatilität; Anzeige in % p.a.',weight:.10,sensitivity:80,influence:'negativ, begrenzt',scoreFormula:'begrenze(100 − vol20 × 80, 0, 100)'}
].map(feature=>({...feature,lookbackSessions:{r20:20,r60:60,rel20:20,trend50:50,vol20:20}[feature.key],priceBasis:'Anbieterbereinigte Schlusskurse (adjust=all); reale Maßnahmen-/PIT-Abnahme offen',source:feature.key==='rel20'?'Twelve Data time_series: Aktie und SPY':'Twelve Data time_series: Aktie',availability:'Nur abgeschlossene bestätigte reguläre Sitzungen; historische Veröffentlichungsstände unbekannt'})));

export function methodologyRegistry(){
 return {version:METHODOLOGY_VERSION,qualification:{netForecastApproved:false,empiricalVerified:false},
  versions:{priceResearch:PRICE_RESEARCH_VERSION,data:DATA_VERSION,reference:REFERENCE_MODEL_VERSION,selection:SELECTION_VERSION,features:ANALOGUE_VERSION,execution:SIMULATION_VERSION,executionLabel:EXECUTION_LABEL_VERSION,risk:RISK_VERSION,tradePlan:TRADE_PLAN_VERSION,contract:ANALYSIS_CONTRACT.version,priceAnchor:tradePriceLevels().version,analysisCard:analysisCardPolicy().version,archive:REPRO_VERSION,capabilities:CAPABILITY_VERSION,events:EVENT_VERSION,macroCalendar:MACRO_SNAPSHOT_VERSION,sessionCalendar:RESEARCH_GRID.calendarVersion,evaluationProtocol:EVALUATION_PROTOCOL.version},
  reference:{status:'verwendet',ranking:true,features:REFERENCE_FEATURES,score:'Summe(begrenzter Teilscore × Referenzgewicht)',outcome:'Historischer Strategie-Proxy auf bereinigten Kursen ohne Kosten; +5% Ziel oder Schluss Tag20',selection:'Präfixbasierte Auswahl vor späterer Auswertung (selection-v2). reference/v1 bleibt das unveränderte historische Archiv einschließlich seines bekannten Auswahlfehlers.'},
  features:{status:'experimentell',ranking:false,keys:ANALOGUE_PARAMETERS.features,parameters:ANALOGUE_PARAMETERS,referenceWeightsApplied:false,influence:'Trainings-Z-Skalierung; konstante Merkmale entfernt; Mahalanobis-Distanz mit inverser (0,9 × Trainingskorrelation + 0,1 × Identität), normiert auf effektiven Rang.',outcomeWeights:'exp(−0,5 × (Distanz / (Distanzgrenze/2))²); Gewichte der Vergleichsfälle, keine Referenzgewichte und keine Prognosewahrscheinlichkeit.',qualification:'Abgeschlossene, nicht überlappende Fälle; mindestens 12 Fälle, Kish-Effektivfallzahl 8 und 4 Zeitblöcke. Kein empirischer Mehrwert nachgewiesen.'},
  priceResearch:{version:PRICE_RESEARCH_VERSION,status:'experimentell',horizons:[1,5,10,20],outcome:'Bereinigter Schluss t+h / Signal-Schluss t − 1, feste Haltedauer ohne Strategieausstieg oder Kosten; kein kalibrierter Rohkurszielwert',rating:'Vorläufiger reference-v1-Merkmalscore aus fünf vollständig verfügbaren Merkmalen, getrennt von Anlagefreigabe',dataAudit:'Endliche Merkmale vor Verwendung; unbekannte Zusatzdaten ausgeschlossen; Rohschluss separat prüfen'},
  diagnostics:{status:'experimentell',ranking:false,items:['Handelswert aus Rohpreis × Volumen bei bestätigter Basis','Overnight-Gaps und Downside aus Datenpräfix','Ereignisrisiko aus beobachteten Revisionen; Abdeckung unbekannt']},
  calendar:{status:'verwendet',ranking:false,description:'Aktuelle BLS-Beobachtung nach abgeschlossenem Abruf; historischer Replay nur aus bis asOf bekannten archivierten Snapshots. Fed-Termine manuell. Kein Treffer beweist Ereignisfreiheit.',access:'HTTP- und Tarifstatus gelten je Abruf und Konto; keine pauschale 403- oder Tarifsperre. Reale Unternehmensabdeckung und Anbieterentitlements bleiben offen.'},
  planned:{status:'geplant',ranking:false,items:['Qualifizierte Nettolabels und serverseitige Datenabnahme','Sektorrelative Stärke und zusätzliche Modelle nach Vergleichsabnahme','Nachrichten-KI mit belegten Quellen; kein Renditekern']},
  limitations:['Keine freigegebene Nettoprognose oder Kaufempfehlung','Synthetische Tests belegen Softwareverhalten, keine Prognosegüte','Datenvollständigkeit und historische Verfügbarkeit nicht durch diese Registry bestätigt']};
}
