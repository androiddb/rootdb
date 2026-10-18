import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: { template: "%s · RootDB", default: "Legal" } };

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-8 flex flex-wrap gap-2 text-sm">
        <Link href="/legal/terms" className="chip">Terms of Service</Link>
        <Link href="/legal/privacy" className="chip">Privacy Policy</Link>
        <Link href="/legal/dmca" className="chip">DMCA & IP Policy</Link>
      </nav>
      <div className="prose-rdb">{children}</div>
    </div>
  );
}
