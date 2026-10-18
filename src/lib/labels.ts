import type { Difficulty, ModuleFramework } from "@/lib/types";

export function difficultyLabel(d: Difficulty | string): string {
  return { easy: "Easy", moderate: "Moderate", advanced: "Advanced", expert: "Expert" }[d] ?? d;
}

export const FRAMEWORK_META: Record<ModuleFramework, { label: string; stableId: string }> = {
  magisk: { label: "Magisk", stableId: "magisk" },
  kernelsu: { label: "KernelSU", stableId: "kernelsu" },
  apatch: { label: "APatch", stableId: "apatch" },
  lsposed: { label: "LSPosed", stableId: "lsposed" },
  xposed: { label: "Xposed", stableId: "xposed" },
  vector: { label: "Vector", stableId: "vector" },
  other: { label: "Other framework", stableId: "other" },
};

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function asDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
