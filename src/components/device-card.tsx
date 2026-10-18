import Link from "next/link";
import type { Device, Verdict } from "@/lib/types";
import { deviceHref, VERDICT_META } from "@/lib/types";
import { VerdictBadge } from "@/components/badges";

export interface CardVariant {
  id: string;
  label: string;
  verdict: Verdict | null;
  model_numbers: string[];
}

/**
 * Device card. Variants are first-class: chips for each variant link straight to the
 * variant-scoped device page, toned by that variant's own verdict (your Verizon S23
 * shows Not rootable even when the international S23 is green).
 */
export function DeviceCard({
  device,
  verdict,
  romCount,
  variants,
  matchedVariantId,
}: {
  device: Device;
  verdict?: Verdict | null;
  romCount?: number | null;
  variants?: CardVariant[];
  matchedVariantId?: string | null;
}) {
  const base = deviceHref(device);
  const matched = matchedVariantId ? variants?.find((v) => v.id === matchedVariantId) : null;
  const href = matched ? `${base}?variant=${matched.id}` : base;
  const showVerdict = (matched?.verdict ?? verdict) ?? null;

  // chips: matched variant first, then the rest
  const chips = (variants ?? []).slice().sort((a, b) => (a.id === matchedVariantId ? -1 : b.id === matchedVariantId ? 1 : 0)).slice(0, 4);

  return (
    <div className="panel card-hover relative block p-4">
      <Link href={href} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide muted">{device.brand}</div>
            <div className="truncate text-base font-bold">
              {device.name}
              {matched && <span className="ml-1.5 text-sm font-semibold" style={{ color: "var(--accent)" }}>{matched.label}</span>}
            </div>
            <div className="mt-0.5 truncate text-xs muted">
              {matched
                ? `your model: ${matched.model_numbers.join(", ")}`
                : [device.model, device.codename && `(${device.codename})`, device.soc].filter(Boolean).join(" · ")}
            </div>
            {device.aliases.length > 0 && !matched && (
              <div className="mt-1 truncate text-xs muted">aka {device.aliases.join(", ")}</div>
            )}
            {showVerdict && (
              <div className="mt-1.5 text-xs">
                <VerdictBadge verdict={showVerdict} />
              </div>
            )}
          </div>
          {showVerdict && <VerdictBadge verdict={showVerdict} size="sm" />}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs muted">
          {device.release_year && <span>{device.release_year}</span>}
          {romCount != null && romCount > 0 && <span className="chip chip-accent">{romCount} ROM{romCount === 1 ? "" : "s"}</span>}
          {matched && <span className="chip chip-warn" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>variant match</span>}
        </div>
      </Link>
      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t pt-2.5" style={{ borderColor: "var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider muted">variants by model #</span>
          {chips.map((v) => {
            const tone = v.verdict ? ({ good: "chip-ok", warn: "chip-warn", bad: "chip-bad", muted: "" } as const)[VERDICT_META[v.verdict].tone] : "";
            const active = v.id === matchedVariantId;
            return (
              <Link
                key={v.id}
                href={`${base}?variant=${v.id}`}
                className={`chip ${tone}`}
                style={active ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
                title={[v.label, v.model_numbers.join(", ")].filter(Boolean).join(" · ")}
              >
                {v.label}
                {v.model_numbers.length > 0 && (
                  <span className="font-mono opacity-80" style={{ fontSize: "0.68rem" }}>· {v.model_numbers[0]}{v.model_numbers.length > 1 ? ` +${v.model_numbers.length - 1}` : ""}</span>
                )}
              </Link>
            );
          })}
          {(variants?.length ?? 0) > 4 && <span className="text-[10px] muted">+{variants!.length - 4}</span>}
        </div>
      )}
    </div>
  );
}
