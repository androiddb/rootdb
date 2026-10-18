import Link from "next/link";
import { KeyRound, ExternalLink, ArrowRight, Cpu, CalendarDays, Smartphone } from "lucide-react";
import type { DeviceBundle } from "@/lib/server/device";
import { effectiveVerdict } from "@/lib/server/device";
import { VERDICT_META, BOOTLOADER_META } from "@/lib/types";
import { difficultyLabel } from "@/lib/labels";
import { Markdown } from "@/components/markdown";

export function OverviewTab({ bundle, variantId, href }: { bundle: DeviceBundle; variantId: string | null; href: string }) {
  const { device, rootability } = bundle;
  const v = effectiveVerdict(bundle, variantId);
  const meta = VERDICT_META[v.verdict];
  const toneColor = { good: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)", muted: "var(--muted)" }[meta.tone];

  const specEntries = [device.release_year && ["Released", String(device.release_year)], device.soc && ["SoC", device.soc], device.ram_options?.length && ["RAM", device.ram_options.join(" / ")], device.android_versions.length && ["Android", device.android_versions.join(", ")], device.model && ["Model", device.model]]
    .filter(Boolean) as [string, string][];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        {/* Verdict panel */}
        <section className="panel p-5">
          <h2 className="text-lg font-bold" style={{ color: toneColor }}>{meta.label}</h2>
          <p className="mt-1 text-sm muted">{meta.blurb}</p>

          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="panel-alt rounded-md p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide muted">Bootloader</dt>
              <dd className="mt-0.5 font-semibold">{BOOTLOADER_META[v.bootloader].label}</dd>
            </div>
            {rootability?.unlock_wait_hours != null && (
              <div className="panel-alt rounded-md p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide muted">Unlock delay</dt>
                <dd className="mt-0.5 font-semibold">{rootability.unlock_wait_hours}h wait ({Math.round(rootability.unlock_wait_hours / 24)}d)</dd>
              </div>
            )}
            {rootability?.anti_rollback && (
              <div className="rounded-md border p-3" style={{ borderColor: "color-mix(in srgb, var(--bad) 50%, transparent)" }}>
                <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--bad)" }}>Anti-rollback</dt>
                <dd className="mt-0.5 text-sm muted">Flashing older builds can hard-brick. Never downgrade past the fuse state.</dd>
              </div>
            )}
            {v.unlockUrl && (
              <div className="panel-alt rounded-md p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide muted">Official unlock</dt>
                <dd className="mt-0.5">
                  <a className="font-semibold underline" href={v.unlockUrl} target="_blank" rel="noreferrer">
                    Vendor unlock portal <ExternalLink size={12} className="inline -translate-y-px" />
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {v.notes && <div className="mt-4"><Markdown>{v.notes}</Markdown></div>}
          {device.variant_notes && bundle.variants.length > 0 && <p className="mt-3 text-sm muted">{device.variant_notes}</p>}
        </section>

        {/* Recommended root method */}
        {bundle.recommended ? (
          <section className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold"><KeyRound size={17} className="mr-2 inline -translate-y-px" style={{ color: "var(--accent)" }} />Recommended root path</h2>
              <Link href={`${href}?tab=downloads`} className="btn btn-ghost btn-sm">All methods <ArrowRight size={13} /></Link>
            </div>
            <div className="mt-3 panel-alt rounded-md p-4">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-base">{bundle.recommended.name}</strong>
                <span className="chip">{difficultyLabel(bundle.recommended.difficulty)}</span>
                {bundle.recommended.requires.length > 0 && <span className="chip">needs {bundle.recommended.requires.join(" + ")}</span>}
              </div>
              {bundle.recommended.summary && <p className="mt-1.5 text-sm muted">{bundle.recommended.summary}</p>}
            </div>
            {bundle.recommended.play_integrity_notes && (
              <p className="mt-2 text-xs muted">Play Integrity: {bundle.recommended.play_integrity_notes}</p>
            )}
          </section>
        ) : v.verdict === "rootable" || v.verdict === "partially" ? (
          <section className="panel p-5 text-sm">
            <p className="muted">No recommended method pinned yet — see the <Link className="underline" href={`${href}?tab=downloads`}>Downloads tab</Link> for all methods for this device, highest-value first.</p>
          </section>
        ) : null}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <section className="panel p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide muted">At a glance</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Smartphone size={14} className="muted" />{bundle.counts.roms} ROM{bundle.counts.roms === 1 ? "" : "s"} · {bundle.counts.methods} root methods</li>
            <li className="flex items-center gap-2"><Cpu size={14} className="muted" />{bundle.counts.tools} tooling entries (recovery / kernel / utils)</li>
            <li className="flex items-center gap-2"><CalendarDays size={14} className="muted" />{bundle.counts.questions} questions · {bundle.counts.issues} issues</li>
          </ul>
          <div className="mt-3 flex flex-col gap-1.5">
            <Link href={`${href}?tab=downloads`} className="btn btn-primary btn-sm">Downloads</Link>
            <Link href={`${href}?tab=guides`} className="btn btn-sm">Guides ({bundle.counts.guides})</Link>
          </div>
        </section>

        {specEntries.length > 0 && (
          <section className="panel p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide muted">Specs</h3>
            <dl className="space-y-2 text-sm">
              {specEntries.map(([k, val]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="muted">{k}</dt>
                  <dd className="text-right font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {bundle.variants.length > 0 && (
          <section className="panel p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide muted">Variants</h3>
            <ul className="space-y-2">
              {bundle.variants.map((vr) => (
                <li key={vr.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{vr.label}</span>
                  <span className="text-xs muted">{vr.model_numbers.join(", ")}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs muted">Filter by variant above — catalog rows tagged to a variant apply only there.</p>
          </section>
        )}
      </aside>
    </div>
  );
}
