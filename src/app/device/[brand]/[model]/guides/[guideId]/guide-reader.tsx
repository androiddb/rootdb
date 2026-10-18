"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import type { GuideBlock, Rom, RootMethod } from "@/lib/types";
import { Markdown } from "@/components/markdown";
import { createClient } from "@/lib/supabase/client";

interface AnswerEdge { label: string; goto_block_id?: string | null }

/** Linearize a guide with branching: start at the first block; question jumps re-order dynamically. */
export default function GuideReader({
  blocks,
  embedBlocks,
  deviceId,
  deviceName,
}: {
  blocks: GuideBlock[];
  embedBlocks: Record<string, GuideBlock[]>;
  deviceId: string;
  deviceName: string;
}) {
  const ordered = useMemo(() => [...blocks].sort((a, b) => a.position - b.position), [blocks]);
  const byId = useMemo(() => new Map(ordered.map((b) => [b.id, b])), [ordered]);
  const indexOf = useMemo(() => new Map(ordered.map((b, i) => [b.id, i])), [ordered]);

  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  // jump queue: when a goto targets a block id, we splice the walk there
  const [jumpStack, setJumpStack] = useState<string[]>([]);

  function goNext() {
    const nxt = jumpStack.length
      ? indexOf.get(jumpStack[0])
      : current + 1;
    if (jumpStack.length) setJumpStack((s) => s.slice(1));
    if (nxt == null || nxt >= ordered.length) {
      setCurrent(ordered.length); // done
      setVisited((v) => [...new Set([...v, ordered.length])]);
      return;
    }
    setCurrent(nxt);
    setVisited((v) => [...new Set([...v, nxt])]);
  }

  function answer(edge: AnswerEdge) {
    if (edge.goto_block_id && byId.has(edge.goto_block_id)) {
      const target = indexOf.get(edge.goto_block_id)!;
      setCurrent(target);
      setVisited((v) => [...new Set([...v, target])]);
    } else {
      goNext();
    }
  }

  function restart() {
    setCurrent(0);
    setVisited([0]);
    setJumpStack([]);
  }

  const done = current >= ordered.length;
  const progress = Math.min(100, Math.round(((visited.filter((i) => i < ordered.length).length) / Math.max(ordered.length, 1)) * 100));
  const block = ordered[current] as GuideBlock | undefined;

  return (
    <div className="mt-8">
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs muted">
          <span>Step {Math.min(current + 1, ordered.length)} of {ordered.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg-alt)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--accent)" }} />
        </div>
      </div>

      {done ? (
        <div className="panel p-8 text-center">
          <CheckCircle2 size={36} className="mx-auto" style={{ color: "var(--ok)" }} />
          <h2 className="mt-3 text-xl font-bold">Guide complete</h2>
          <p className="mt-1 text-sm muted">If something was off, say so on the device page — every note improves the index.</p>
          <button className="btn mt-4" onClick={restart}><RotateCcw size={14} /> Run it again</button>
        </div>
      ) : block ? (
        <div key={block.id} className="panel p-6">
          <RenderBlock block={block} embedBlocks={embedBlocks} deviceId={deviceId} deviceName={deviceName} />

          {block.block_type === "question" ? (
            <div className="mt-5 space-y-2">
              {((block.config as { prompt?: string }).prompt) && (
                <p className="mb-3 font-semibold">{(block.config as { prompt?: string }).prompt}</p>
              )}
              {((block.config?.answers as AnswerEdge[] | undefined) ?? []).map((a, i) => (
                <button key={i} onClick={() => answer(a)} className="btn w-full justify-start text-left">
                  {a.label} <ArrowRight size={14} className="ml-auto" />
                </button>
              ))}
            </div>
          ) : block.block_type === "embed" ? null : (
            <div className="mt-6 flex justify-end">
              <button className="btn btn-primary" onClick={goNext}>
                Continue <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-4 text-center">
        <button className="btn btn-ghost btn-sm" onClick={restart}><RotateCcw size={13} /> Restart guide</button>
      </div>
    </div>
  );
}

function RenderBlock({ block, embedBlocks, deviceId, deviceName }: { block: GuideBlock; embedBlocks: Record<string, GuideBlock[]>; deviceId: string; deviceName: string }) {
  if (block.block_type === "content") {
    return block.content_md ? <Markdown>{block.content_md}</Markdown> : null;
  }
  if (block.block_type === "question") {
    return <p className="text-xs font-semibold uppercase tracking-wide muted">Answer to continue</p>;
  }
  if (block.block_type === "embed") {
    const inner = block.embed_guide_id ? embedBlocks[block.embed_guide_id] ?? [] : [];
    const title = (block.config as { title?: string }).title;
    if (!inner.length) return <p className="text-sm muted">Embedded guide content unavailable.</p>;
    return (
      <div className="rounded-md border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-alt)" }}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>{title ?? "Embedded guide"}</p>
        <div className="space-y-4">
          {inner.filter((b) => b.block_type === "content" && b.content_md).map((b) => (
            <Markdown key={b.id}>{b.content_md!}</Markdown>
          ))}
        </div>
      </div>
    );
  }
  if (block.block_type === "recommendation") {
    return <Recommendation deviceId={deviceId} deviceName={deviceName} />;
  }
  return null;
}

/** Dynamic recommendation: best confirmed root method / ROM for this device, else global top picks. */
function Recommendation({ deviceId, deviceName }: { deviceId: string; deviceName: string }) {
  const [state, setState] = useState<{ loading: boolean; methods: RootMethod[]; roms: Rom[]; global: boolean }>({ loading: true, methods: [], roms: [], global: false });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: methods }, { data: roms }] = await Promise.all([
        supabase
          .from("root_methods")
          .select("*")
          .eq("device_id", deviceId)
          .order("confirmed_count", { ascending: false })
          .order("weight", { ascending: false })
          .limit(3),
        supabase
          .from("roms")
          .select("*")
          .eq("device_id", deviceId)
          .eq("status", "active")
          .order("confirmed_count", { ascending: false })
          .limit(3),
      ]);
      if ((methods?.length ?? 0) + (roms?.length ?? 0) > 0) {
        setState({ loading: false, methods: (methods ?? []) as RootMethod[], roms: (roms ?? []) as Rom[], global: false });
      } else {
        const { data: globals } = await supabase.from("root_methods").select("*").is("device_id", null).order("weight", { ascending: false }).limit(3);
        setState({ loading: false, methods: (globals ?? []) as RootMethod[], roms: [], global: true });
      }
    })();
  }, [deviceId]);

  return (
    <div className="rounded-md border p-4" style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)", background: "color-mix(in srgb, var(--accent) 6%, transparent)" }}>
      <p className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--accent)" }}>
        <Sparkles size={15} /> Recommended for this device
      </p>
      {state.loading ? (
        <p className="text-sm muted">Consulting the index…</p>
      ) : (
        <div className="space-y-2">
          {state.global && (
            <p className="text-sm muted">No {deviceName}-specific rows yet — these are the index-wide top picks that apply to any phone:</p>
          )}
          {state.methods.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              <strong>{m.name}</strong>
              {!state.global && <span className="chip">{m.confirmed_count} confirmed</span>}
              {m.links.slice(0, 1).map((l, i) => (
                <a key={i} className="btn btn-sm ml-auto" href={l.url} target="_blank" rel="noreferrer">{l.label} <ExternalLink size={11} /></a>
              ))}
            </div>
          ))}
          {state.roms.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              <strong>{r.name}</strong>
              {r.android_version && <span className="chip">Android {r.android_version}</span>}
              <span className="chip">{r.confirmed_count} confirmed</span>
              <a className="btn btn-sm ml-auto" href={r.download_url} target="_blank" rel="noreferrer">Get it <ExternalLink size={11} /></a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
