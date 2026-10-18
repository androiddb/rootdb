import { createClient } from "@/lib/supabase/server";
import type { DeviceBundle } from "@/lib/server/device";
import type { Issue } from "@/lib/types";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { relativeTime } from "@/lib/labels";
import { Markdown } from "@/components/markdown";
import { AuthorPickRow } from "./qa-client";
import { IssueForm } from "./issues-client";

export async function IssuesTab({ bundle, variantId, href }: { bundle: DeviceBundle; variantId: string | null; href: string }) {
  const supabase = await createClient();

  let q = supabase
    .from("issues")
    .select("*, author:profiles!issues_author_id_fkey(username,display_name,role,is_verified_dev), rom:roms!issues_rom_id_fkey(name), method:root_methods!issues_root_method_id_fkey(name), variant:device_variants!issues_variant_id_fkey(label)")
    .eq("device_id", bundle.device.id)
    .order("created_at", { ascending: false })
    .limit(60);
  if (variantId) q = q.or(`variant_id.is.null,variant_id.eq.${variantId}`);
  const { data } = await q;
  const rows = (data ?? []) as unknown as (Issue & { author: Issue["author"]; rom: { name: string } | null; method: { name: string } | null; variant: { label: string } | null })[];

  let voted = new Set<string>();
  if (bundle.auth.authed && rows.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("target_id")
      .eq("target_type", "issue")
      .eq("user_id", bundle.auth.profile!.id)
      .in("target_id", rows.map((r) => r.id));
    voted = new Set((votes ?? []).map((v) => v.target_id as string));
  }

  const open = rows.filter((r) => r.status === "open" || r.status === "confirmed");
  const done = rows.filter((r) => r.status === "fixed" || r.status === "wontfix" || r.status === "duplicate");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">Known issues with a real lifecycle. Moderators confirm, fix and close — searchable forever.</p>
        <IssueForm deviceId={bundle.device.id} authed={bundle.auth.authed} scopes={{
          roms: bundle.roms.map((r) => ({ id: r.id, label: r.name })),
          methods: bundle.methodsDevice.map((m) => ({ id: m.id, label: m.name })),
          variants: bundle.variants.map((v) => ({ id: v.id, label: v.label })),
        }} />
      </div>

      {rows.length === 0 && (
        <div className="panel p-8 text-center">
          <p className="text-lg font-semibold">No issues reported.</p>
          <p className="mt-1 text-sm muted">Hit a snag? Report it and save the next person a weekend.</p>
        </div>
      )}

      {([["Open & confirmed", open], ["Resolved & closed", done]] as const).map(([label, list]) =>
        list.length === 0 ? null : (
          <section key={label}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide muted">{label}</h2>
            <div className="space-y-3">
              {list.map((iss) => (
                <article key={iss.id} className="panel p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={iss.severity} />
                    <StatusBadge status={iss.status} />
                    <AuthorPickRow prefix={<strong className="leading-snug">{iss.title}</strong>} upvotes={iss.upvotes} targetType="issue" targetId={iss.id} voted={voted.has(iss.id)} authed={bundle.auth.authed} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-xs muted">
                    <span>reported {relativeTime(iss.created_at)} by {iss.author?.display_name ?? iss.author?.username ?? "someone"}</span>
                    {iss.rom && <span>· ROM: {iss.rom.name}</span>}
                    {iss.method && <span>· Method: {iss.method.name}</span>}
                    {iss.variant && <span>· Variant: {iss.variant.label}</span>}
                  </div>
                  {iss.body_md && <div className="mt-2 text-sm"><Markdown>{iss.body_md}</Markdown></div>}
                  {iss.resolution_note && (
                    <div className="mt-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "color-mix(in srgb, var(--ok) 45%, transparent)", background: "color-mix(in srgb, var(--ok) 6%, transparent)" }}>
                      <strong style={{ color: "var(--ok)" }}>Resolution:</strong> {iss.resolution_note}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
