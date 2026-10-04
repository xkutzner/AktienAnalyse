import {blockedComparison} from '../worker/comparison.js';
// stdout only. No provider access, input trust bypass, or outer test execution.
const suppliedCommit=process.env.SOURCE_COMMIT||null;
const sourceCommit=/^[a-f0-9]{40}$/.test(suppliedCommit||'')?suppliedCommit:null;
console.log(JSON.stringify(await blockedComparison({sourceCommit}),null,2));
