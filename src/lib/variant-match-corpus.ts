// Frontend-friendly corpus for the variant matcher (tests/variant-match.corpus.mjs uses the same).
// Every case: [query, shouldMatchAny]. Should stay in lockstep with src/lib/variant-match.ts.
export const CORPUS: [string, number][] = [
  ["sms911u", 1], ["sm-s911u", 1], ["s911u", 0], ["SMS911U", 1], ["sms991", 0], ["911", 0],
  ["s911", 0], ["s991", 0], ["s911u1", 0], ["SM S911U", 1],
  ["pixel 7", 0], ["s23", 0], ["verizon", 1], ["verizo", 1], ["verizon pixel 7 pro", 1],
  ["vs995", 1], ["vs 995", 1], ["h910", 1], ["att h910", 1],
  ["gm1915", 1], ["GFE4J", 1], ["gfe4j", 1],
  ["samsung galaxy s23 verizon", 1], ["google pixel 7 pro verizon", 1],
  ["t-mobile", 1], ["t-mobile usa", 1], ["snapdragon", 1],
  ["a", 0], ["the", 0], ["sum", 0], ["sms", 0], ["sms9", 0], ["sms91", 0],
  ["sms911", 0], ["u", 0], ["u1", 0], ["s901u", 0], ["g991u", 0], ["s901u1", 0],
  ["at&t", 0], ["att", 0], ["tmo", 1], ["tmobile", 1], ["carrier", 0], ["mods", 0], ["906", 0],
  ["sms911x", 0], ["s9110", 0], ["sms91a", 0], ["vs999", 0], ["vs996", 0], ["s99", 0], ["s9", 0], ["9110", 0],
];

export const SAMPLE_VARIANTS = [
  { id: "vz911u", label: "Verizon", model_numbers: ["SM-S911U", "SM-S911U1"] },
  { id: "tmo", label: "T-Mobile USA", model_numbers: ["GM1915"] },
  { id: "lg", label: "Verizon VS995 / AT&T H910", model_numbers: ["VS995", "H910"] },
  { id: "pixv", label: "Verizon", model_numbers: ["GFE4J"] },
  { id: "sd", label: "US / Canada (Snapdragon)", model_numbers: ["SM-G991U"] },
];
