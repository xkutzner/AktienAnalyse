import assert from "node:assert/strict";
import vm from "node:vm";
import {renderPage} from "./render-page.mjs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");

const [source, manifest] = await Promise.all([
  readFile(workerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
JSON.parse(manifest);

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  "function",
  `${pathToFileURL(workerPath)} must export default.fetch`,
);

const response=await workerModule.default.fetch(new Request('https://artifact.local/'),{});
assert.equal(response.status,200);
const html=await response.text();
const expected=renderPage(await readFile(resolve(projectRoot,'app/index.html'),'utf8'));
assert.equal(html,expected,'served artifact page must match current source renderer exactly');
assert.ok(!/__[A-Z][A-Z0-9_]*__/.test(html),'unresolved template placeholder blocks browser startup');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length,'page must contain its controller');
for(const [,script] of scripts)new vm.Script(script);
console.log("Artifact ESM, served page parity, resolved templates and browser script syntax passed");
