import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadDeviceBundle } from "@/lib/server/device";
import type { Guide, GuideBlock } from "@/lib/types";
import { difficultyLabel } from "@/lib/labels";
import GuideReader from "./guide-reader";

export async function generateMetadata(props: { params: Promise<{ brand: string; model: string; guideId: string }> }): Promise<Metadata> {
  const { guideId } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase.from("guides").select("title,summary").eq("id", guideId).maybeSingle();
  return data ? { title: data.title, description: data.summary ?? undefined } : { title: "Guide" };
}

export default async function GuidePage(props: {
  params: Promise<{ brand: string; model: string; guideId: string }>;
}) {
  const { brand, model, guideId } = await props.params;
  const bundle = await loadDeviceBundle(brand, model).catch(() => notFound());
  const supabase = await createClient();

  const { data: guide } = await supabase.from("guides").select("*").eq("id", guideId).eq("published", true).maybeSingle();
  if (!guide) notFound();
  const g = guide as Guide;
  // Device-specific guides live only on their device; generic guides render anywhere.
  if (g.device_id !== null && g.device_id !== bundle.device.id) notFound();

  // All blocks for the guide, plus any directly-embedded guides' blocks (one hop)
  const { data: blocks } = await supabase.from("guide_blocks").select("*").eq("guide_id", g.id).order("position");
  const allBlocks = (blocks ?? []) as GuideBlock[];
  const embedIds = allBlocks.map((b) => b.embed_guide_id).filter(Boolean) as string[];
  let embedBlocks: Record<string, GuideBlock[]> = {};
  if (embedIds.length) {
    const { data: eb } = await supabase.from("guide_blocks").select("*").in("guide_id", embedIds).order("position");
    for (const b of (eb ?? []) as GuideBlock[]) {
      (embedBlocks[b.guide_id] ??= []).push(b);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={`/device/${brand}/${model}?tab=guides`} className="text-sm muted hover:underline">
        <ArrowLeft size={13} className="mr-1 inline -translate-y-px" />Back to {bundle.device.name} guides
      </Link>

      <header className="mt-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{g.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm muted">
          <span className="chip">{g.kind.replace(/_/g, " ")}</span>
          <span className="chip">{difficultyLabel(g.difficulty)}</span>
          {g.device_id === null && <span className="chip chip-accent">Generic guide</span>}
          {g.summary && <span className="mt-1 basis-full">{g.summary}</span>}
        </div>
      </header>

      <div className="mt-6 rounded-md border px-4 py-3 text-sm muted" style={{ borderColor: "color-mix(in srgb, var(--warn) 45%, transparent)", background: "color-mix(in srgb, var(--warn) 6%, transparent)" }}>
        Guides describe procedures you run at your own risk. Read every branch before acting on your device.
      </div>

      <GuideReader
        blocks={allBlocks}
        embedBlocks={embedBlocks}
        deviceId={bundle.device.id}
        deviceName={bundle.device.name}
      />
    </div>
  );
}
