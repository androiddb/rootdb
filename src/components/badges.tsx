import type { CatalogStatus, IssueSeverity, IssueStatus, Provenance, Verdict } from "@/lib/types";
import { VERDICT_META } from "@/lib/types";

export function VerdictBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" | "lg" }) {
  const meta = VERDICT_META[verdict] ?? VERDICT_META.unknown;
  const tone = { good: "chip-ok", warn: "chip-warn", bad: "chip-bad", muted: "" }[meta.tone];
  const sz = size === "lg" ? "px-4 py-1.5 text-base" : size === "sm" ? "" : "px-3 py-1 text-sm";
  return <span className={`chip ${tone} ${sz}`}>{meta.label}</span>;
}

export function StatusBadge({ status }: { status: CatalogStatus | IssueStatus | string }) {
  const map: Record<string, { c: string; l: string }> = {
    active: { c: "chip-ok", l: "Active" },
    discontinued: { c: "chip-warn", l: "Discontinued" },
    archived: { c: "", l: "Archived" },
    unknown: { c: "", l: "Status?" },
    open: { c: "chip-warn", l: "Open" },
    confirmed: { c: "chip-bad", l: "Confirmed" },
    fixed: { c: "chip-ok", l: "Fixed" },
    wontfix: { c: "", l: "Won't fix" },
    duplicate: { c: "", l: "Duplicate" },
    answered: { c: "chip-accent", l: "Answered" },
    solved: { c: "chip-ok", l: "Solved" },
    closed: { c: "", l: "Closed" },
    pending: { c: "chip-warn", l: "Pending" },
    approved: { c: "chip-ok", l: "Approved" },
    rejected: { c: "chip-bad", l: "Rejected" },
    withdrawn: { c: "", l: "Withdrawn" },
  };
  const m = map[status] ?? map.unknown;
  return <span className={`chip ${m.c}`}>{m.l}</span>;
}

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const map = { low: "", medium: "chip-warn", high: "chip-bad", critical: "chip-bad" } as const;
  const label = { low: "Low", medium: "Medium", high: "High", critical: "Critical" }[severity];
  return <span className={`chip ${map[severity]}`}>{label}</span>;
}

export function ProvenanceBadge({ provenance, official }: { provenance: Provenance; official?: boolean }) {
  if (official || provenance === "official_verified")
    return <span className="chip chip-ok" title="Verified official source">Official ✓</span>;
  if (provenance === "community")
    return <span className="chip chip-accent" title="Community build with public source">Community</span>;
  return <span className="chip" title="Link submitted by a user — moderated">Link ↗</span>;
}

export function KindChip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <span className={`chip ${accent ? "chip-accent" : ""}`}>{children}</span>;
}
