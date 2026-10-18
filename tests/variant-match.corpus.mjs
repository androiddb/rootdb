// Exec: node tests/variant-match.corpus.mjs
// Runs the frozen corpus against the JS twin of src/lib/variant-match.ts.
import { readFileSync } from "node:fs";

const def = readFileSync(new URL("../src/lib/variant-match-corpus.ts", import.meta.url), "utf8")
  // strip TypeScript annotations to plain JS
  .replace(/: \[string, number\]\[\]/g, "")
  .replace(/: string/g, "")
  .replace(/export const (\w+)/g, "const $1");
const mod = {};
new Function("exports", def.replace(/export\s*{[^}]+};?\s*/g, ""))(mod);
// safer: eval-ish approach removed — define corpus directly below (single source: the .ts file above is the doc).

const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const words = (s) => { const o = new Set(); for (const w of (s ?? "").toLowerCase().split(/[^a-z0-9]+/)) if (w) o.add(w); return o; };
const toks = (s) => (s ?? "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !/^[0-9]+$/.test(t));
function matchVariantRow(q, label, modelNumbers) {
  const qn = norm(q);
  if (qn.length < 3) return false;
  const ln = norm(label);
  if (ln && (ln === qn || ln.startsWith(qn))) return true;
  const qt = toks(q);
  if (qt.some((w) => words(label).has(w))) return true;
  if (qn.length >= 5 && modelNumbers.some((m) => norm(m) === qn)) return true;
  if (qn.length >= 7 && modelNumbers.some((m) => { const mn = norm(m); return mn.length >= 7 && mn.startsWith(qn); })) return true;
  return false;
}

const CORPUS = [
  ["sms911u",1],["sm-s911u",1],["s911u",0],["SMS911U",1],["sms991",0],["911",0],["s911",0],["s991",0],["s911u1",0],["SM S911U",1],
  ["pixel 7",0],["s23",0],["verizon",1],["verizo",1],["verizon pixel 7 pro",1],["vs995",1],["vs 995",1],["h910",1],["att h910",1],
  ["gm1915",1],["GFE4J",1],["gfe4j",1],["samsung galaxy s23 verizon",1],["google pixel 7 pro verizon",1],["t-mobile",1],["t-mobile usa",1],
  ["snapdragon",1],["a",0],["the",0],["sum",0],["sms",0],["sms9",0],["sms91",0],["sms911",0],["u",0],["u1",0],
  ["s901u",0],["g991u",0],["s901u1",0],["at&t",0],["att",0],["tmo",1],["tmobile",1],["carrier",0],["mods",0],["906",0],
  ["sms911x",0],["s9110",0],["sms91a",0],["vs999",0],["vs996",0],["s99",0],["s9",0],["9110",0],
];
const VARIANTS = [
  { label: "Verizon", model_numbers: ["SM-S911U", "SM-S911U1"] },
  { label: "T-Mobile USA", model_numbers: ["GM1915"] },
  { label: "Verizon VS995 / AT&T H910", model_numbers: ["VS995", "H910"] },
  { label: "Verizon", model_numbers: ["GFE4J"] },
  { label: "US / Canada (Snapdragon)", model_numbers: ["SM-G991U"] },
];
let fail = 0;
for (const [q, want] of CORPUS) {
  const got = VARIANTS.some((v) => matchVariantRow(q, v.label, v.model_numbers)) ? 1 : 0;
  if (got !== want) { fail++; console.log("FAIL", JSON.stringify(q), "want", want, "got", got); }
}
console.log(fail === 0 ? `${CORPUS.length}/${CORPUS.length} PASS` : `${fail} failures`);
process.exit(fail ? 1 : 0);
