export const ANALOGUE_VERSION='features-v2';
export const PRICE_RESEARCH_VERSION='price-research-v1';
export const PRICE_HORIZONS=Object.freeze([1,5,10,20]);
// Fixed holding outcomes from signal close, never the capped strategy proxy.
// Keep the existing 20-session training raster and maturity for all horizons.
export function priceResearch(features,records,currentIndex,bars,{marketUp=null,asOf=null,retrievedAt=null}={}){
 const valid=bar=>bar&&Number.isFinite(bar.close)&&bar.close>0;
 const audit=ANALOGUE_PARAMETERS.features.map(key=>({key,status:Number.isFinite(features?.[key])?'available':'missing',included:Number.isFinite(features?.[key]),basis:'provider-adjusted-close'}));
 const anchor=valid(bars[currentIndex])?bars[currentIndex].close:null;
 const price={value:anchor,currency:'USD',basis:'provider-adjusted-close',sessionDate:asOf,retrievedAt,live:false,rawVerified:false};
 const horizons=PRICE_HORIZONS.map(horizon=>{
  const observations=records.map(row=>{
   const path=bars.slice(row.index,row.index+horizon+1);
   const complete=path.length===horizon+1&&path.every(valid);
   const outcome=complete?bars[row.index+horizon].close/bars[row.index].close-1:null;
   return {...row,proxyReturn:Number.isFinite(outcome)?outcome:null};
  });
  const estimate=estimateFeatures(features,observations,currentIndex,{basis:'proxy',marketUp});
  const m=estimate.metrics;
  const values=m&&anchor!==null?[m.expectedReturn,m.outcomeRange80.low,m.outcomeRange80.high].map(r=>anchor*(1+r)):null;
  const usable=values?.every(v=>Number.isFinite(v)&&v>0);
  return {horizon,status:usable?'exploratory':'unknown',meanPrice:usable?values[0]:null,lowPrice:usable?values[1]:null,highPrice:usable?values[2]:null,meanReturn:usable?m.expectedReturn:null,caseCount:estimate.caseCount,effectiveCaseCount:estimate.effectiveCaseCount,reason:usable?null:estimate.reason||'Preisanker oder endliche positive Szenariopreise fehlen'};
 });
 const complete=audit.every(item=>item.status==='available')&&anchor!==null;
 const score=complete&&Number.isFinite(features?.score)&&features.score>=0&&features.score<=100?features.score:null;
 const rating={status:score===null?'unknown':'provisional',score,label:score===null?'Datenbasis unzureichend':score>50?'Kursmerkmale überwiegend positiv':score<50?'Kursmerkmale überwiegend schwach':'Kursmerkmale ausgeglichen',basis:'reference-v1-feature-score',investmentQualified:false};
 return {version:PRICE_RESEARCH_VERSION,price,rating,horizons,indicatorAudit:audit,excluded:['Handelswert: Rohpreis-/Volumenbasis ungeprüft','Earnings und Kapitalmaßnahmen: Abdeckung unbekannt','Makro-/Sektordaten: nicht integriert'],basis:'adjusted-fixed-close-return-gross-proxy',dayConvention:'Signal-Schluss t; Preis an Schluss t+h; 1, 5, 10, 20 folgende reguläre Handelssitzungen',empiricalVerified:false,net:false,warning:'Experimentelle Brutto-Kursszenarien aus historischen Analogien, keine kalibrierte Prognose. Anbieterbereinigt, einschließlich möglicher Dividendenanpassung; keine handelbare Rohkursprognose. 10.–90. historische Ergebnisperzentile, keine garantierte Zukunftsspanne.'};
}
export const ANALOGUE_PARAMETERS=Object.freeze({features:['r20','r60','rel20','trend50','vol20'],minCases:12,minEffectiveCases:8,minTemporalBlocks:4,maxCases:30,shrinkage:.1,thresholdNeighbour:12,thresholdQuantile:.75,blockLength:4,bootstrapReplicates:500});
function avg(values){return values.reduce((a,b)=>a+b,0)/values.length}
function percentile(values,p){const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor((sorted.length-1)*p)]}
function inverse(matrix){const n=matrix.length,a=matrix.map((row,i)=>[...row,...Array.from({length:n},(_,j)=>Number(i===j))]);for(let i=0;i<n;i++){let pivot=i;for(let j=i+1;j<n;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;[a[i],a[pivot]]=[a[pivot],a[i]];const value=a[i][i];if(Math.abs(value)<1e-12)throw Error('Singuläre Trainingsmatrix');for(let k=0;k<2*n;k++)a[i][k]/=value;for(let j=0;j<n;j++)if(j!==i){const factor=a[j][i];for(let k=0;k<2*n;k++)a[j][k]-=factor*a[i][k]}}return a.map(row=>row.slice(n))}
export function fitTraining(rows){
 const keys=ANALOGUE_PARAMETERS.features;
 const means=keys.map(key=>avg(rows.map(row=>row.features[key])));
 const scales=keys.map((key,k)=>Math.sqrt(rows.reduce((sum,row)=>sum+(row.features[key]-means[k])**2,0)/(rows.length-1)));
 const active=keys.map((_,k)=>k).filter(k=>scales[k]>1e-10);
 if(!active.length)return null;
 const z=rows.map(row=>active.map(k=>(row.features[keys[k]]-means[k])/scales[k]));
 const corr=active.map((_,i)=>active.map((_,j)=>z.reduce((sum,row)=>sum+row[i]*row[j],0)/(rows.length-1)));
 const shrunk=corr.map((row,i)=>row.map((v,j)=>.9*v+.1*Number(i===j)));
 const effectiveRank=active.length**2/corr.reduce((sum,row)=>sum+row.reduce((s,v)=>s+v*v,0),0);
 return {keys,means,scales,active,correlation:corr,inverse:inverse(shrunk),effectiveRank,trainingCount:rows.length};
}
export function featureDistance(a,b,fit){
 const delta=fit.active.map(k=>(a[fit.keys[k]]-b[fit.keys[k]])/fit.scales[k]);
 let square=0;for(let i=0;i<delta.length;i++)for(let j=0;j<delta.length;j++)square+=delta[i]*fit.inverse[i][j]*delta[j];
 return Math.sqrt(Math.max(0,square)/fit.effectiveRank);
}
export function trainingThreshold(rows,fit){
 // Query and outcomes are deliberately absent from calibration.
 const k=Math.min(ANALOGUE_PARAMETERS.thresholdNeighbour,rows.length-1);
 const neighbourhoods=rows.map((row,i)=>rows.filter((_,j)=>i!==j).map(other=>featureDistance(row.features,other.features,fit)).sort((a,b)=>a-b)[k-1]);
 return Math.max(1e-8,percentile(neighbourhoods,ANALOGUE_PARAMETERS.thresholdQuantile));
}
function weightedQuantile(items,p){let sum=0;const total=items.reduce((s,r)=>s+r.weight,0);for(const row of [...items].sort((a,b)=>a.outcome-b.outcome)){sum+=row.weight;if(sum>=p*total)return row.outcome}return [...items].sort((a,b)=>a.outcome-b.outcome).at(-1).outcome}
function tailMean(items,p){let remaining=p*items.reduce((sum,r)=>sum+r.weight,0),sum=0,used=0;for(const row of [...items].sort((a,b)=>a.outcome-b.outcome)){const weight=Math.min(remaining,row.weight);sum+=weight*row.outcome;used+=weight;remaining-=weight;if(remaining<=1e-12)break}return sum/used}
function blockInterval(pool,selected,seed){
 const weights=new Map(selected.map(row=>[row.id,row.weight]));
 let state=seed>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296};
 const means=[],block=Math.min(ANALOGUE_PARAMETERS.blockLength,pool.length);
 for(let rep=0;rep<ANALOGUE_PARAMETERS.bootstrapReplicates;rep++){
  let sum=0,weight=0,count=0;
  while(count<pool.length){const start=Math.floor(random()*(pool.length-block+1));for(let j=0;j<block&&count<pool.length;j++,count++){const row=pool[start+j],w=weights.get(row.id)||0;sum+=w*row.outcome;weight+=w}}
  if(weight>0)means.push(sum/weight);
 }
 return means.length>=400?{low:percentile(means,.025),high:percentile(means,.975),replicates:means.length,method:'Moving-block bootstrap, 4 chronological 20-session observations; fixed fitted selection'}:null;
}
export function estimateFeatures(features,records,currentIndex,{basis='net',marketUp=null}={}){
 const params=ANALOGUE_PARAMETERS;
 const unavailable=reason=>({version:ANALOGUE_VERSION,status:'insufficient',reason,basis,caseCount:0,effectiveCaseCount:0,averageSimilarity:null,metrics:null,expectedNetReturn:null});
 if(params.features.some(key=>!Number.isFinite(features?.[key])))return unavailable('Merkmale fehlen');
 const matured=records.filter(row=>Number.isInteger(row.index)&&row.index+20<=currentIndex&&params.features.every(key=>Number.isFinite(row.features?.[key])));
 // Net labels require explicit qualification; no client-side or retrospective substitution.
 let pool=matured.filter(row=>basis==='net'?row.labelVersion==='execution-label-v1'&&row.executionVersion==='execution-v4'&&row.netVerified===true&&row.pointInTimeVerified===true&&Number.isInteger(row.knownAtIndex)&&row.knownAtIndex<=currentIndex&&row.knownAtIndex>=row.index+20&&Number.isFinite(row.netReturn):Number.isFinite(row.proxyReturn)).map(row=>({...row,id:row.index,outcome:basis==='net'?row.netReturn:row.proxyReturn}));
 if(new Set(pool.map(row=>row.id)).size!==pool.length)return unavailable('Doppelte Trainingsbeobachtungen');
 const chronological=[...pool].sort((a,b)=>a.index-b.index);
 if(chronological.some((row,i)=>i&&(row.index-chronological[i-1].index<20||(row.index-chronological[i-1].index)%20!==0)))return unavailable('Überlappende oder inkonsistent gerasterte Fälle: keine Unsicherheitsschätzung; 20-Session-Raster erforderlich');
 const regime=pool.filter(row=>row.marketUp===marketUp);if(marketUp!==null&&regime.length>=params.minCases)pool=regime;
 pool.sort((a,b)=>a.index-b.index);
 if(pool.length<params.minCases+1)return unavailable(basis==='net'?'Zu wenige freigegebene Nettofälle / historische Datenstände fehlen':'Zu wenig abgeschlossene Trainingsfälle');
 const fit=fitTraining(pool);if(!fit)return unavailable('Keine Merkmalsvariation im Training');
 if(fit.keys.some((key,k)=>fit.scales[k]<=1e-10&&Math.abs(features[key]-fit.means[k])>1e-8))return unavailable('Aktuelles konstantes Trainingsmerkmal außerhalb beobachteter Werte');
 const threshold=trainingThreshold(pool,fit),bandwidth=threshold/2;
 const selected=pool.map(row=>({...row,distance:featureDistance(features,row.features,fit)})).filter(row=>row.distance<=threshold).sort((a,b)=>a.distance-b.distance).slice(0,params.maxCases).map(row=>({...row,weight:Math.exp(-.5*(row.distance/bandwidth)**2)}));
 const weight=selected.reduce((s,row)=>s+row.weight,0),weight2=selected.reduce((s,row)=>s+row.weight**2,0);
 const effective=weight2?weight**2/weight2:0;
 // Counts blocks on the original 20-session timeline, not a compressed selected/regime list.
 const temporalBlocks=new Set(selected.map(row=>Math.floor((row.index-80)/80))).size;
 const diagnostics={version:ANALOGUE_VERSION,basis,caseCount:selected.length,effectiveCaseCount:effective,temporalBlocks,averageSimilarity:selected.length?avg(selected.map(row=>row.weight)):null,averageDistance:selected.length?avg(selected.map(row=>row.distance)):null,maxDistance:threshold,bandwidth,trainingCount:pool.length,trainingMaxIndex:Math.max(...pool.map(row=>row.index)),fit:{keys:fit.keys,means:fit.means,scales:fit.scales,active:fit.active,correlation:fit.correlation,effectiveRank:fit.effectiveRank},expectedNetReturn:null,validation:'Not evaluated outside training; provider vintages unknown for proxy',metrics:null};
 if(selected.length<params.minCases||effective<params.minEffectiveCases||temporalBlocks<params.minTemporalBlocks)return {...diagnostics,status:'insufficient',reason:'Keine belastbare Schätzung: Fallzahl, effektive Fallzahl oder zeitliche Streuung zu gering'};
 const mean=selected.reduce((s,row)=>s+row.weight*row.outcome,0)/weight,losses=selected.filter(row=>row.outcome<0),lossWeight=losses.reduce((s,row)=>s+row.weight,0);
 // Keep unselected observations as zero-weight entries on the original chronological timeline.
 const firstIndex=Math.min(...matured.map(row=>row.index)),lastIndex=Math.max(...matured.map(row=>row.index));
 const byId=new Map(pool.map(row=>[row.index,row]));
 const timeline=[];for(let index=firstIndex;index<=lastIndex;index+=20)timeline.push(byId.get(index)||{id:index,outcome:0});
 const ci=blockInterval(timeline,selected,Math.imul(currentIndex+1,2654435761));
 if(!ci)return {...diagnostics,status:'insufficient',reason:'Unsicherheitsintervall wegen dünner zeitlicher Abdeckung nicht belastbar'};
 return {...diagnostics,status:'exploratory',expectedNetReturn:basis==='net'?mean:null,metrics:{expectedReturn:mean,median:weightedQuantile(selected,.5),lossProbability:lossWeight/weight,averageLossWhenNegative:lossWeight?losses.reduce((s,row)=>s+row.weight*row.outcome,0)/lossWeight:null,worst10PercentMean:tailMean(selected,.1),outcomeRange80:{low:weightedQuantile(selected,.1),high:weightedQuantile(selected,.9)},meanUncertainty95:ci},uncertaintyNote:'Conditional block bootstrap: excludes uncertainty of scaling/threshold fitting and regime choice; nominal 95%, no guaranteed coverage',observationsOverlap:records.some((row,i)=>i&&row.index-records[i-1].index<20)};
}
