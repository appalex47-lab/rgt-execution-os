// Runs every suite as a separate process and reports the REAL exit code. Usage: node tests/run-all.mjs
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const legacy = fs.readdirSync(dir).filter(f => /^(smoke|phase[3-9])-tests\.js$/.test(f)).sort();
const modern = fs.readdirSync(dir).filter(f => /\.mjs$/.test(f) && !f.startsWith("_") && f !== "run-all.mjs").sort();
const rows = [];
for (const f of [...legacy, ...modern]) {
  const args = legacy.includes(f) ? ["--import", path.join(dir, "_dom-shim.mjs"), path.join(dir, f)] : [path.join(dir, f)];
  const r = spawnSync(process.execPath, args, {encoding: "utf8", timeout: 120000});
  rows.push({f, ok: r.status === 0, out: (r.stdout || "").trim().split("\n").pop(), err: r.status === 0 ? "" : (r.stderr || r.stdout || "").trim().split("\n").slice(0, 4).join(" | ")});
}
console.log("| Suite | Resultado | Observaciones |\n|---|---|---|");
for (const r of rows) console.log(`| ${r.f} | ${r.ok ? "PASS" : "FAIL"} | ${(r.ok ? r.out : r.err).replace(/\|/g, "/")} |`);
const failed = rows.filter(r => !r.ok).length;
console.log(`\n${rows.length - failed}/${rows.length} suites OK`);
process.exit(failed ? 1 : 0);
