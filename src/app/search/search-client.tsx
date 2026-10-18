"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Device } from "@/lib/types";
import { deviceHref } from "@/lib/types";

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
}

/** Typo-tolerant suggestions when the ilike search finds nothing. */
export function SearchSuggestions({ q }: { q: string }) {
  const [candidates, setCandidates] = useState<Device[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("devices")
      .select("id,slug,brand,name,model,codename,aliases,release_year,android_versions,soc,ram_options,specs,variant_notes,popularity")
      .order("popularity", { ascending: false })
      .limit(400)
      .then(({ data }) => setCandidates((data ?? []) as Device[]));
  }, []);

  const query = q.toLowerCase();
  const scored = candidates
    .map((d) => {
      const terms = [d.name, d.model ?? "", d.codename ?? "", d.brand, ...d.aliases].filter(Boolean).map((s) => s.toLowerCase());
      let best = Infinity;
      for (const t of terms) {
        // compare against full term, and against word-prefixes so "onepus" matches "oneplus"
        best = Math.min(best, levenshtein(query, t));
        for (const w of t.split(/\s+/)) best = Math.min(best, levenshtein(query, w));
        for (let k = Math.max(4, query.length - 2); k <= Math.min(t.length, query.length + 2); k++) {
          best = Math.min(best, levenshtein(query, t.slice(0, k)));
        }
      }
      const normalized = best / Math.max(query.length, 3);
      return { d, best, normalized };
    })
    .filter((x) => x.normalized <= 0.4)
    .sort((a, b) => a.best - b.best || b.d.popularity - a.d.popularity)
    .slice(0, 5);

  return (
    <div className="mt-6">
      <p className="text-sm muted">No exact matches for “<span style={{ color: "var(--text)" }}>{q}</span>”.{scored.length > 0 && " Did you mean:"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {scored.map(({ d }) => (
          <Link key={d.id} href={deviceHref(d)} className="chip card-hover px-3 py-1 text-sm" style={{ color: "var(--text)" }}>
            {d.name} {d.codename && <span className="muted">({d.codename})</span>}
          </Link>
        ))}
      </div>
      <div className="panel mt-6 p-5 text-sm">
        <strong style={{ color: "var(--text)" }}>Not here yet?</strong>{" "}
        <Link className="underline" href={`/submit?type=new_device&q=${encodeURIComponent(q)}`}>Add “{q}” to the index</Link> —
        submissions go through moderation, then go live.
      </div>
    </div>
  );
}
