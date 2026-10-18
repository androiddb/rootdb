"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Menu, X, Bookmark, LogOut, Settings, ShieldCheck, Terminal } from "lucide-react";
import { QuickThemeToggle } from "@/components/theme-toggle";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader({ user, profile }: { user: { id: string; email?: string } | null; profile: Profile | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const isMod = profile?.role === "moderator" || profile?.role === "admin";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
            <Terminal size={16} strokeWidth={2.5} />
          </span>
          RootDB
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <Link className="btn btn-ghost btn-sm" href="/search">Devices</Link>
          <Link className="btn btn-ghost btn-sm" href="/apps">Apps</Link>
          <Link className="btn btn-ghost btn-sm" href="/modules">Modules</Link>
        </nav>

        <form
          className="ml-auto hidden min-w-0 max-w-xs flex-1 items-center gap-2 sm:flex"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
          role="search"
        >
          <div className="relative w-full">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 muted" />
            <input
              className="input pl-8"
              placeholder="Phone, model or codename…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search devices"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <QuickThemeToggle />
          {user ? (
            <>
              <Link className="btn btn-ghost btn-sm" href="/saved" title="Saved devices">
                <Bookmark size={16} />
              </Link>
              {isMod && (
                <Link className="btn btn-ghost btn-sm" href="/admin" title="Moderation">
                  <ShieldCheck size={16} />
                </Link>
              )}
              <Link className="btn btn-ghost btn-sm" href="/settings" title="Settings">
                <Settings size={16} />
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={signOut} title="Sign out" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link className="btn btn-primary btn-sm" href="/login">Sign in</Link>
          )}
          <button className="btn btn-ghost btn-sm md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t px-4 py-3 md:hidden" style={{ borderColor: "var(--border)" }}>
          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) { setOpen(false); router.push(`/search?q=${encodeURIComponent(q.trim())}`); }
            }}
          >
            <input className="input" placeholder="Phone, model or codename…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-primary" type="submit">Search</button>
          </form>
          <div className="flex flex-col gap-1">
            <Link className="btn btn-ghost justify-start" href="/search" onClick={() => setOpen(false)}>Devices</Link>
            <Link className="btn btn-ghost justify-start" href="/apps" onClick={() => setOpen(false)}>Apps</Link>
            <Link className="btn btn-ghost justify-start" href="/modules" onClick={() => setOpen(false)}>Modules</Link>
            {user && <Link className="btn btn-ghost justify-start" href="/saved" onClick={() => setOpen(false)}>Saved</Link>}
            {user && <Link className="btn btn-ghost justify-start" href="/submit" onClick={() => setOpen(false)}>Contribute</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
