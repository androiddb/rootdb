import Link from "next/link";
import { ExternalLink, GitBranch, Hammer, User } from "lucide-react";
import type { DeviceBundle } from "@/lib/server/device";
import type { Rom, RootMethod, Software, Tool, DeviceVariant } from "@/lib/types";
import { ProvenanceBadge, StatusBadge } from "@/components/badges";
import { ConfirmButton } from "@/components/interactions";
import { difficultyLabel, relativeTime } from "@/lib/labels";
import { Markdown } from "@/components/markdown";

function variantOf(variants: DeviceVariant[], id: string | null) {
  return id ? variants.find((v) => v.id === id) ?? null : null;
}

/** Keep rows matching the selected variant + rows applying to all variants (null). */
function scopeByVariant<T extends { variant_id: string | null }>(rows: T[], variantId: string | null) {
  if (!variantId) return rows;
  return rows.filter((r) => r.variant_id === null || r.variant_id === variantId);
}

export function DownloadsTab({ bundle, variantId, href }: { bundle: DeviceBundle; variantId: string | null; href: string }) {
  const sel = variantOf(bundle.variants, variantId);
  const roms = scopeByVariant(bundle.roms, variantId);
  const methodsDevice = scopeByVariant(bundle.methodsDevice, variantId);
  const tools = scopeByVariant(bundle.tools, variantId);
  const methods = [...methodsDevice, ...bundle.methodsUniversal];

  return (
    <div className="space-y-8">
      {sel && (
        <p className="text-sm muted">
          Showing downloads for <strong style={{ color: "var(--text)" }}>{sel.label}</strong> (variant-only rows plus rows applying to all variants).
        </p>
      )}

      {/* Root methods */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Root methods</h2>
        {methods.length === 0 ? (
          <EmptyNote label="No root methods listed for this device yet." href={href} type="root_method" />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {methods.map((m) => (
              <MethodCard key={m.id} method={m} confirmed={bundle.confirmedSet.has(m.id)} authed={bundle.auth.authed} variants={bundle.variants} />
            ))}
          </div>
        )}
      </section>

      {/* ROMs */}
      <section>
        <h2 className="mb-3 text-lg font-bold">ROMs</h2>
        {roms.length === 0 ? (
          <EmptyNote label="No ROMs listed for this scope." href={href} type="rom" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {roms.map((r) => (
              <RomCard key={r.id} rom={r} confirmed={bundle.confirmedSet.has(r.id)} authed={bundle.auth.authed} variants={bundle.variants} />
            ))}
          </div>
        )}
      </section>

      {/* Tooling: recoveries / kernels / utilities */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Recoveries, kernels & utilities</h2>
        {tools.length === 0 ? (
          <EmptyNote label="No recoveries, custom kernels or utilities listed yet." href={href} type="correction" />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide muted" style={{ borderColor: "var(--border)" }}>
                  <th className="px-4 py-2.5">Kind</th><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Version</th><th className="px-4 py-2.5">Scope</th><th className="px-4 py-2.5">Source</th><th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {tools.map((t) => {
                  const vr = variantOf(bundle.variants, t.variant_id);
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-2.5"><span className="chip">{t.kind}</span></td>
                      <td className="px-4 py-2.5 font-medium">{t.name}</td>
                      <td className="px-4 py-2.5 muted">{t.version ?? "—"}</td>
                      <td className="px-4 py-2.5 muted">{vr ? vr.label : "All variants"}</td>
                      <td className="px-4 py-2.5"><ProvenanceBadge provenance={t.provenance} /></td>
                      <td className="px-4 py-2.5 text-right"><a className="btn btn-sm" href={t.url} target="_blank" rel="noreferrer">Get <ExternalLink size={12} /></a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Device-tagged software */}
      {bundle.software.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Apps & modules known to shine here</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {bundle.software.map((s) => <SoftwareCard key={s.id} sw={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyNote({ label, href, type }: { label: string; href: string; type: string }) {
  return (
    <div className="panel p-4 text-sm muted">
      {label} <Link className="underline" href={`/submit?type=${type}&from=${encodeURIComponent(href)}`}>Contribute one</Link> — moderated, then live.
    </div>
  );
}

function MethodCard({ method: m, confirmed, authed, variants }: { method: RootMethod; confirmed: boolean; authed: boolean; variants: DeviceVariant[] }) {
  const vr = variantOf(variants, m.variant_id);
  return (
    <article className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-base">{m.name}</strong>
            <span className="chip">{difficultyLabel(m.difficulty)}</span>
            {!m.device_id && <span className="chip chip-accent" title="Universal — recommended because it applies to every device">Universal</span>}
            {vr && <span className="chip">{vr.label}</span>}
            <ProvenanceBadge provenance={m.provenance} />
          </div>
          {m.summary && <p className="mt-1 text-sm muted">{m.summary}</p>}
          {m.requires.length > 0 && (
            <p className="mt-1.5 text-xs muted">Requires: {m.requires.join(" + ")}</p>
          )}
          {m.body_md && <details className="mt-2 text-sm"><summary className="cursor-pointer font-medium" style={{ color: "var(--accent)" }}>Steps</summary><div className="mt-2"><Markdown>{m.body_md}</Markdown></div></details>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <ConfirmButton targetType="root_method" targetId={m.id} count={m.confirmed_count} confirmed={confirmed} authed={authed} />
          {m.links.map((l, i) => (
            <a key={i} className="btn btn-sm" href={l.url} target="_blank" rel="noreferrer">{l.label} <ExternalLink size={12} /></a>
          ))}
        </div>
      </div>
      {m.play_integrity_notes && <p className="mt-2 border-t pt-2 text-xs muted" style={{ borderColor: "var(--border)" }}>Play Integrity: {m.play_integrity_notes}</p>}
    </article>
  );
}

function RomCard({ rom: r, confirmed, authed, variants }: { rom: Rom; confirmed: boolean; authed: boolean; variants: DeviceVariant[] }) {
  const vr = variantOf(variants, r.variant_id);
  return (
    <article className="panel card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong>{r.name}</strong>
            {r.android_version && <span className="chip">Android {r.android_version}</span>}
            <StatusBadge status={r.status} />
            <ProvenanceBadge provenance={r.provenance} official={r.official} />
            {vr && <span className="chip">{vr.label}</span>}
          </div>
          {r.maintainers.length > 0 && (
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs muted">
              <User size={12} /> by{" "}
              {r.maintainers.map((mt, i) => (
                <span key={i}>
                  {mt.url ? <a className="underline" href={mt.url} target="_blank" rel="noreferrer">{mt.name}</a> : mt.name}
                  {i < r.maintainers!.length - 1 && ","}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
      {r.notes && <p className="mt-2 text-sm muted">{r.notes}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a className="btn btn-primary btn-sm" href={r.download_url} target="_blank" rel="noreferrer">Download <ExternalLink size={12} /></a>
        <ConfirmButton targetType="rom" targetId={r.id} count={r.confirmed_count} confirmed={confirmed} authed={authed} />
        {r.source_repo_url && <a className="btn btn-ghost btn-sm" href={r.source_repo_url} target="_blank" rel="noreferrer" title="Public source (required for community builds)"><GitBranch size={13} /> source</a>}
        {r.build_config_url && <a className="btn btn-ghost btn-sm" href={r.build_config_url} target="_blank" rel="noreferrer" title="Build config — reproducibility evidence"><Hammer size={13} /> build config</a>}
      </div>
      {r.last_confirmed_at && <p className="mt-2 text-xs muted">Last confirmed working {relativeTime(r.last_confirmed_at)}</p>}
    </article>
  );
}

function SoftwareCard({ sw: s }: { sw: Software }) {
  return (
    <article className="panel card-hover p-4">
      <div className="flex flex-wrap items-center gap-2">
        <strong>{s.name}</strong>
        <span className="chip">{s.kind === "module" ? `module · ${s.framework ?? "other"}` : "app"}</span>
        <span className="chip">{s.artifact.toUpperCase()}</span>
        {s.requires_root && <span className="chip chip-warn">root</span>}
        <StatusBadge status={s.status} />
      </div>
      {s.description && <p className="mt-1.5 text-sm muted">{s.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs muted">
        {s.version && <span>v{s.version}</span>}
        {s.min_framework_version && <span>fw ≥ {s.min_framework_version}</span>}
        {s.android_range && <span>{s.android_range}</span>}
        <a className="btn btn-sm ml-auto" href={s.download_url} target="_blank" rel="noreferrer">Get <ExternalLink size={12} /></a>
      </div>
    </article>
  );
}
