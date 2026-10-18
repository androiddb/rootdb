/**
 * Variant matching — the single source of truth for "variants are differentiated by model number".
 *
 * A device variant (Verizon S23) is its model numbers (SM-S911U/U1/W) — everything else
 * (label, carrier, region) is description layered on those. This module turns a free-text
 * query into a variant match, with zero tolerance for false positives.
 *
 * Rules (each tested in tests/variant-match.corpus.mjs):
 *   R1  label prefix          — 'verizon', 'verizo', 't-mobile', 'tmo'
 *   R2  label word token      — 'verizon pixel 7 pro', 'att h910', 'samsung galaxy s23 verizon'
 *   R3  exact model number    — 'SM-S911U', 'SMS911U', 'sm s911u', 'vs995', 'h910'
 *   R4  near-exact model      — normalized qn >= 7 chars and a model's normalized form starts with it ('sms911u1')
 * Owner shorthand ('s911u', 'sms911', 'sms9') and bare numeric fragments do NOT match.
 */

export const normModelNumber = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const words = (s: string) => { const o = new Set<string>(); for (const w of (s ?? "").toLowerCase().split(/[^a-z0-9]+/)) if (w) o.add(w); return o; };
const toks = (s: string) => (s ?? "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !/^[0-9]+$/.test(t));

export function matchVariantRow(q: string, label: string, modelNumbers: string[]): boolean {
  const qn = normModelNumber(q);
  if (qn.length < 3) return false;
  const ln = normModelNumber(label);
  if (ln && (ln === qn || ln.startsWith(qn))) return true;                      // R1
  const qt = toks(q);
  if (qt.some((w) => words(label).has(w))) return true;                         // R2
  if (qn.length >= 5 && modelNumbers.some((m) => normModelNumber(m) === qn)) return true; // R3
  if (qn.length >= 7 && modelNumbers.some((m) => { const mn = normModelNumber(m); return mn.length >= 7 && mn.startsWith(qn); })) return true; // R4
  return false;
}

export interface MatchableVariant {
  id: string;
  label: string;
  model_numbers: string[] | null;
}

/** First variant on this device the query identifies, or null. */
export function firstMatchedVariantId(q: string, variants: MatchableVariant[]): string | null {
  for (const v of variants) {
    if (matchVariantRow(q, v.label, v.model_numbers ?? [])) return v.id;
  }
  return null;
}
