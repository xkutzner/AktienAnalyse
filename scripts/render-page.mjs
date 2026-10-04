import {ANALYSIS_CONTRACT, ANALYSIS_CARD_STATES, analysisCardPolicy} from '../worker/contract.js';
export function renderPage(html){
 if(!html.includes('__ANALYSIS_CONTRACT_JSON__'))throw Error('Analysis contract placeholder missing');
 return html.replace('__ANALYSIS_CARD_POLICY__', 'const ANALYSIS_CARD_STATES='+JSON.stringify(ANALYSIS_CARD_STATES)+'; const analysisCardPolicy='+analysisCardPolicy.toString()+';').replace('__ANALYSIS_CONTRACT_JSON__',JSON.stringify(ANALYSIS_CONTRACT).replace(/</g,'\\u003c'));
}
