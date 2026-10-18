import { createClient } from "@/lib/supabase/server";
import type { Device, Verdict } from "@/lib/types";
import { DeviceCard } from "@/components/device-card";
import { VerdictBadge } from "@/components/badges";
import { SearchSuggestions } from "./search-client";
import { matchVariantRow } from "@/lib/variant-match";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search devices" };

const PAGE_SIZE = 24;

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; brand?: string; verdict?: string; android?: string; roms?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const q = (sp.q ?? "").trim();
  const brand = sp.brand ?? "";
  const verdict = sp.verdict ?? "";
  const android = sp.android ?? "";
  const romsOnly = sp.roms === "1";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  const { data: brandRows } = await supabase.from("devices").select("brand").order("brand");
  const brands = [...new Set((brandRows ?? []).map((b) => b.brand as string))].sort((a, b) => a.localeCompare(b));

  // Pre-filter by verdict via the rootability join if requested
  let verdictIds: string[] | null = null;
  if (verdict) {
    const { data: rr } = await supabase
      .from("device_rootability")
      .select("device_id")
      .eq("verdict", verdict as Verdict);
    verdictIds = (rr ?? []).map((r) => r.device_id as string);
    if (!verdictIds.length) verdictIds = ["00000000-0000-0000-0000-000000000000"]; // no match
  }

  let romIds: string[] | null = null;
  if (romsOnly) {
    const { data: rr } = await supabase.from("roms").select("device_id", { count: "exact", head: false });
    romIds = [...new Set((rr ?? []).map((r) => r.device_id as string))];
    if (!romIds.length) romIds = ["00000000-0000-0000-0000-000000000000"];
  }

  // ---- variant matching via the shared module (single source of truth) ----

  // Variant-first prefilter: if q looks like a carrier label or model number, the devices
  // those variants belong to must surface even when the base device text doesn't match.
  let variantHitDeviceIds: string[] = [];
  let allVariantRows: { id: string; device_id: string; label: string; verdict: Verdict | null; model_numbers: string[] }[] = [];
  if (q) {
    const { data: av } = await supabase
      .from("device_variants")
      .select("id,device_id,label,verdict,model_numbers")
      .limit(400);
    allVariantRows = (av ?? []) as typeof allVariantRows;
    variantHitDeviceIds = allVariantRows
      .filter((v) => matchVariantRow(q, v.label, v.model_numbers ?? []))
      .map((v) => v.device_id);
  }

  let query = supabase.from("devices").select("*", { count: "exact" });
  if (brand) query = query.eq("brand", brand);
  if (android) query = query.contains("android_versions", [android]);
  if (verdictIds) query = query.in("id", verdictIds);
  if (romIds) query = query.in("id", romIds);
  if (q) {
    // Variant-first matching: a query like SM-S911U hits the Verizon variant, not the base S23 row.
    // The variant table is ~46 rows — fetch it once and match client-side with the same
    // frozen rules used for chip highlighting, then OR those device ids into the base ilike.
    const like = `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    query = variantHitDeviceIds.length
      ? query.or(`search_text.ilike.${like},id.in.(${variantHitDeviceIds.join(",")})`)
      : query.ilike("search_text", like);
  }
  query = query.order("popularity", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
  const { data: devices, count } = await query;
  const rows = (devices ?? []) as Device[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const ids = rows.map((d) => d.id);
  const verdictMap = new Map<string, Verdict>();
  const romCountMap = new Map<string, number>();
  const variantsByDevice = new Map<string, { id: string; label: string; verdict: Verdict | null; model_numbers: string[] }[]>();
  // chips: prefer the full variant sweep we already fetched for the prefilter
  for (const v of allVariantRows) {
    if (!ids.includes(v.device_id)) continue;
    const list = variantsByDevice.get(v.device_id) ?? [];
    list.push({ id: v.id, label: v.label, verdict: v.verdict, model_numbers: v.model_numbers });
    variantsByDevice.set(v.device_id, list);
  }
  if (ids.length) {
    const [{ data: root }, { data: roms }] = await Promise.all([
      supabase.from("device_rootability").select("device_id,verdict").in("device_id", ids),
      supabase.from("roms").select("device_id").in("device_id", ids),
    ]);
    for (const r of root ?? []) verdictMap.set(r.device_id, r.verdict as Verdict);
    for (const r of roms ?? []) romCountMap.set(r.device_id, (romCountMap.get(r.device_id) ?? 0) + 1);
  }

  // matchedVariantOf: same frozen rules, run against the chip-level variant rows of this device.
  const matchedVariantOf = (deviceId: string): string | null => {
    for (const v of variantsByDevice.get(deviceId) ?? []) {
      if (matchVariantRow(q, v.label, v.model_numbers ?? [])) return v.id;
    }
    return null;
  };

  const qs = (over: Record<string, string>) => {
    const cur: Record<string, string> = { q, brand, verdict, android, roms: sp.roms ?? "", page: "1", ...over };
    const s = Object.entries(cur).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
    return `/search?${s.join("&")}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Search devices</h1>

      <form className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_10rem_10rem_8rem_7rem_auto]" method="GET" action="/search">
        <input className="input" name="q" defaultValue={q} placeholder="Name, model, codename, alias…" aria-label="Query" />
        <select className="select" name="brand" defaultValue={brand} aria-label="Brand">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="select" name="verdict" defaultValue={verdict} aria-label="Verdict">
          <option value="">Any verdict</option>
          <option value="rootable">Rootable</option>
          <option value="partially">Partially</option>
          <option value="not_rootable">Not rootable</option>
          <option value="unknown">Unknown</option>
        </select>
        <select className="select" name="android" defaultValue={android} aria-label="Android version">
          <option value="">Any Android</option>
          {Array.from({ length: 11 }, (_, i) => 16 - i).map((v) => <option key={v} value={String(v)}>Android {v}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs muted">
          <input type="checkbox" name="roms" value="1" defaultChecked={romsOnly} /> has ROMs
        </label>
        <button className="btn btn-primary" type="submit">Filter</button>
      </form>

      <p className="mt-4 flex flex-wrap items-center gap-2 text-sm muted">
        {total} device{total === 1 ? "" : "s"}{q && <> for “<span style={{ color: "var(--text)" }}>{q}</span>”</>}
        {verdict && <>· <VerdictBadge verdict={verdict as Verdict} /></>}
      </p>
      {total > 0 && rows.some((d) => matchedVariantOf(d.id)) && (
        <p className="mt-2 flex items-center gap-2 text-sm" style={{ color: "var(--accent)" }}>
          Matched a variant by model number — the card shows <em>that variant&rsquo;s</em> verdict, which can differ sharply from
          the base model&rsquo;s (carrier firmware is the usual culprit).
        </p>
      )}

      {total === 0 && q.length >= 3 ? (
        <SearchSuggestions q={q} />
      ) : total === 0 ? (
        <div className="panel mt-6 p-6 text-center">
          <p className="text-lg font-semibold">No devices indexed yet{q ? <> for “{q}”</> : ""}.</p>
          <p className="mt-1 text-sm muted">
            RootDB grows by contribution — <Link className="underline" href="/submit">submit this device</Link> and it goes to moderation.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              verdict={verdictMap.get(d.id) ?? null}
              romCount={romCountMap.get(d.id) ?? 0}
              variants={variantsByDevice.get(d.id)}
              matchedVariantId={matchedVariantOf(d.id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && <Link className="btn btn-sm" href={qs({ page: String(page - 1) })}>← Prev</Link>}
          <span className="text-sm muted">Page {page} of {totalPages}</span>
          {page < totalPages && <Link className="btn btn-sm" href={qs({ page: String(page + 1) })}>Next →</Link>}
        </div>
      )}
    </div>
  );
}
