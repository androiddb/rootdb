import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t py-8 text-sm muted" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-semibold" style={{ color: "var(--text)" }}>RootDB</span>
          <span className="mx-2">·</span>
          the phone modding index. Search a phone, get its rootability verdict — every entry cites its source.
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/legal/terms" className="hover:underline">Terms</Link>
          <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
          <Link href="/legal/dmca" className="hover:underline">DMCA</Link>
          <Link href="/submit" className="hover:underline">Contribute</Link>
          <a href="https://github.com/androiddb/rootdb" className="hover:underline" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
