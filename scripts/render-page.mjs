import {ANALYSIS_CONTRACT} from '../worker/contract.js';
export function renderPage(html){
 if(!html.includes('__ANALYSIS_CONTRACT_JSON__'))throw Error('Analysis contract placeholder missing');
 return html.replace('__ANALYSIS_CONTRACT_JSON__',JSON.stringify(ANALYSIS_CONTRACT).replace(/</g,'\\u003c'));
}
