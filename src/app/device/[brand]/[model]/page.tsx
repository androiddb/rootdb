import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, AlertTriangle, ExternalLink } from "lucide-react";
import { loadDeviceBundle, effectiveVerdict } from "@/lib/server/device";
import { deviceHref, VERDICT_META, BOOTLOADER_META } from "@/lib/types";
import type { Device } from "@/lib/types";
import { VerdictBadge } from "@/components/badges";
import { SaveButton } from "@/components/interactions";
import { OverviewTab } from "./tabs/overview";
import { DownloadsTab } from "./tabs/downloads";
import { QuestionsTab } from "./tabs/questions";
import { IssuesTab } from "./tabs/issues";
import { GuidesTab } from "./tabs/guides";
import { UpdatesTab } from "./tabs/updates";

const TABS = ["overview", "downloads", "questions", "issues", "guides", "updates"] as const;
type Tab = (typeof TABS)[number];

export async function generateMetadata(props: { params: Promise<{ brand: string; model: string }> }): Promise<Metadata> {
  const { brand, model } = await props.params;
  try {
    const bundle = await loadDeviceBundle(brand, model);
    const v = effectiveVerdict(bundle, null);
    return {
      title: `${bundle.device.name} — can you root it?`,
      description: `${bundle.device.name} rootability: ${VERDICT_META[v.verdict].label}. Bootloader: ${BOOTLOADER_META[v.bootloader].label}. ${bundle.counts.roms} ROMs, ${bundle.counts.methods} root methods, ${bundle.counts.guides} guides.`,
    };
  } catch {
    return { title: "Device" };
  }
}

export default async function DevicePage(props: {
  params: Promise<{ brand: string; model: string }>;
  searchParams: Promise<{ tab?: string; variant?: string; scope?: string }>;
}) {
  const { brand, model } = await props.params;
  const sp = await props.searchParams;
  const bundle = await loadDeviceBundle(brand, model).catch(() => notFound());
  const { device } = bundle;
  if (!device) notFound();

  const tab = (TABS.includes(sp.tab as Tab) ? sp.tab : "overview") as Tab;
  const variantId = sp.variant && bundle.variants.some((v) => v.id === sp.variant) ? sp.variant! : null;
  const verdict = effectiveVerdict(bundle, variantId);
  const href = deviceHref(device);
  const selectedVariant = variantId ? bundle.variants.find((v) => v.id === variantId)! : null;

  const tabHref = (t: Tab) => `${href}?tab=${t}${variantId ? `&variant=${variantId}` : ""}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-1 text-sm"><Link href="/search" className="muted hover:underline"><ArrowLeft size={13} className="mr-1 inline -translate-y-px" />Search</Link></div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide muted">{device.brand}{device.codename && <> · <code style={{ fontFamily: "var(--font-mono)", color: "var(--code)" }}>{device.codename}</code></>}</div>
          <h1 className="text-3xl font-extrabold tracking-tight">{device.name}{selectedVariant && <span className="ml-2 align-middle text-base font-semibold" style={{ color: "var(--accent)" }}>/ {selectedVariant.label}</span>}</h1>
          {selectedVariant && selectedVariant.model_numbers.length > 0 && (
            <p className="mt-0.5 font-mono text-sm" style={{ color: "var(--code)" }}>{selectedVariant.model_numbers.join(" · ")}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm muted">
            {device.model && <span>{device.model}</span>}
            {device.soc && <span>{device.soc}</span>}
            {device.release_year && <span>{device.release_year}</span>}
            {device.aliases.length > 0 && <span>aka {device.aliases.join(", ")}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <VerdictBadge verdict={verdict.verdict} size="lg" />
          <SaveButton deviceId={device.id} href={href} saved={bundle.auth.saved} authed={bundle.auth.authed} />
        </div>
      </div>

      {/* Tabs */}
      <nav className="mt-5 flex gap-0 overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => {
          const count =
            t === "downloads" ? bundle.counts.roms + bundle.counts.methods + bundle.counts.tools + bundle.software.length :
            t === "questions" ? bundle.counts.questions :
            t === "issues" ? bundle.counts.issues :
            t === "guides" ? bundle.counts.guides :
            t === "updates" ? bundle.counts.updates : 0;
          return (
            <Link key={t} href={tabHref(t)} className="tab-link capitalize" data-active={tab === t}>
              {t}
              {count > 0 && <span className="chip px-1.5">{count}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Variant strip — variants are differentiated BY MODEL NUMBER */}
      {bundle.variants.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide muted">Variant</span>
          <Link href={tabHref(tab).replace(/&variant=[^&]*/, "")} className={`chip ${!variantId ? "chip-accent" : ""}`}>All</Link>
          {bundle.variants.map((v) => (
            <Link key={v.id} href={`${href}?tab=${tab}&variant=${v.id}`} className={`chip ${variantId === v.id ? "chip-accent" : ""}`} title={v.model_numbers.join(", ") || v.label}>
              {v.label}
              {v.model_numbers.length > 0 && (
                <span className="font-mono opacity-80" style={{ fontSize: "0.68rem" }}>· {v.model_numbers[0]}{v.model_numbers.length > 1 ? ` +${v.model_numbers.length - 1}` : ""}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Bright-line warnings */}
      {verdict.warnings.length > 0 && (
        <div className="mt-4 rounded-md border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--warn) 55%, transparent)", background: "color-mix(in srgb, var(--warn) 8%, transparent)" }}>
          <div className="mb-1 flex items-center gap-2 font-bold" style={{ color: "var(--warn)" }}><AlertTriangle size={15} /> Know before you flash</div>
          <ul className="list-disc pl-5 muted">
            {verdict.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
      {verdict.source === "variant" && variantId && (
        <p className="mt-3 text-xs muted">
          Showing verdict for variant <strong style={{ color: "var(--text)" }}>{selectedVariant?.label}</strong>
          {selectedVariant && selectedVariant.model_numbers.length > 0 && <> ({selectedVariant.model_numbers.join(", ")})</>}
          {verdict.unlockUrl && <> — <a className="underline" href={verdict.unlockUrl} target="_blank" rel="noreferrer">vendor unlock portal <ExternalLink size={11} className="inline -translate-y-px" /></a></>}
          . Carrier and region variants of the same phone can root very differently.
        </p>
      )}

      <div className="mt-6">
        {tab === "overview" && <OverviewTab bundle={bundle} variantId={variantId} href={href} />}
        {tab === "downloads" && <DownloadsTab bundle={bundle} variantId={variantId} href={href} />}
        {tab === "questions" && <QuestionsTab bundle={bundle} variantId={variantId} href={href} />}
        {tab === "issues" && <IssuesTab bundle={bundle} variantId={variantId} href={href} />}
        {tab === "guides" && <GuidesTab bundle={bundle} variantId={variantId} href={href} />}
        {tab === "updates" && <UpdatesTab bundle={bundle} variantId={variantId} href={href} />}
      </div>
    </div>
  );
}
