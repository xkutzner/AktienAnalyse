import {renderPage} from './render-page.mjs';
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const [html, template, dataModule, simulationModule, analogueModule, contractModule, reproModule, capabilityModule] = await Promise.all([
  readFile(resolve(root, "app/index.html"), "utf8"),
  readFile(resolve(root, "worker/index.template.js"), "utf8"),
  readFile(resolve(root, "worker/data.js"), "utf8"),
  readFile(resolve(root, "worker/simulation.js"), "utf8"),
  readFile(resolve(root, "worker/analogues.js"), "utf8"),
  readFile(resolve(root, "worker/contract.js"), "utf8"),
  readFile(resolve(root, "worker/reproducibility.js"), "utf8"),
  readFile(resolve(root, "worker/capabilities.js"), "utf8"),
]);
if (!template.includes("__APP_PAGE_HTML__")) throw new Error("Worker HTML placeholder missing.");
const sourceCommit=process.env.SOURCE_COMMIT||process.env.GITHUB_SHA||null;
if(sourceCommit&&!/^[a-f0-9]{40}$/.test(sourceCommit))throw new Error('SOURCE_COMMIT must be the actual full source SHA');
await writeFile(resolve(root, "worker/index.js"), template.replace('__SOURCE_COMMIT__',JSON.stringify(sourceCommit)).replace(/^import .* from "\.\/capabilities\.js";\n/m,capabilityModule.replace(/export (?=(async )?(function|const))/g, "")+"\n").replace(/^import .* from "\.\/reproducibility\.js";\n/m,reproModule.replace(/export (?=(async )?(function|const))/g, "")+"\n").replace(/^import .* from "\.\/contract\.js";\n/m, contractModule.replace(/export (?=(async )?(function|const))/g, "")+"\n").replace(/^import .* from "\.\/analogues\.js";\n/m, analogueModule.replace(/export (?=(async )?(function|const))/g, "")+"\n").replace(/^import .* from "\.\/simulation\.js";\n/m, simulationModule.replace(/^import .* from "\.\/data\.js";\n/m, "").replace(/export (?=(async )?(function|const))/g, "")+"\n").replace(/^import .* from "\.\/data\.js";\n/m, dataModule.replace(/export (?=(async )?(function|const))/g, "")+"\n").replace("__APP_PAGE_HTML__", JSON.stringify(renderPage(html))));
console.log("Embedded the dashboard in the Worker bundle.");

