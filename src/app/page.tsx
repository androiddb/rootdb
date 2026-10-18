import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, ArrowRight, AppWindow, Blocks, BookOpenCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Device, Verdict } from "@/lib/types";
import { deviceHref, UPDATE_KIND_LABEL } from "@/lib/types";
import { DeviceCard } from "@/components/device-card";
import { VerdictBadge } from "@/components/badges";

async function searchAction(formData: FormData) {
  "use server";
  const q = String(formData.get("q") ?? "").trim();
  redirect(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
}

export default async function HomePage() {
  const supabase = await createClient();

  const [popularRes, updatesRes, countsRes] = await Promise.all([
    supabase.from("devices").select("*").order("popularity", { ascending: false }).limit(8),
    supabase
      .from("device_updates")
      .select("id,kind,title,created_at,device:devices!device_updates_device_id_fkey(slug,name)")
      .order("created_at", { ascending: false })
      .limit(14),
    Promise.all([
      supabase.from("devices").select("id", { count: "exact", head: true }),
      supabase.from("roms").select("id", { count: "exact", head: true }),
      supabase.from("root_methods").select("id", { count: "exact", head: true }),
      supabase.from("guides").select("id", { count: "exact", head: true }).eq("published", true),
    ]),
  ]);

  const popular = (popularRes.data ?? []) as Device[];
  const popularVerdicts = new Map<string, Verdict>();
  if (popular.length) {
    const { data: rams } = await supabase
      .from("device_rootability")
      .select("device_id,verdict")
      .in("device_id", popular.map((d) => d.id));
    for (const r of rams ?? []) popularVerdicts.set(r.device_id, r.verdict as Verdict);
  }
  const updates = updatesRes.data ?? [];
  const [devicesN, romsN, methodsN, guidesN] = countsRes.map((r) => r.count ?? 0);

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section
        className="py-16 text-center"
        style={{ background: "radial-gradient(60rem 22rem at 50% -10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent)" }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Can you root <span style={{ color: "var(--accent)" }}>your</span> phone?
        </h1>
        <p className="mx-auto mt-3 max-w-xl muted">
          One search. Verdict per device&nbsp;<em>variant</em> — because a Verizon S23 is not an S23.
          ROMs, recoveries, kernels, modules, guides.
        </p>

        <form action={searchAction} className="mx-auto mt-8 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 muted" />
            <input
              name="q"
              className="input py-3 pl-9 text-base"
              placeholder="Pixel 7 Pro, SM-G991B, cheetah, OnePlus Ace…"
              autoFocus
              aria-label="Search a phone"
            />
          </div>
          <button className="btn btn-primary px-5" type="submit">Search</button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm muted">
          <span><strong style={{ color: "var(--text)" }}>{devicesN}</strong> devices</span>
          <span>·</span>
          <span><strong style={{ color: "var(--text)" }}>{romsN}</strong> ROMs</span>
          <span>·</span>
          <span><strong style={{ color: "var(--text)" }}>{methodsN}</strong> root methods</span>
          <span>·</span>
          <span><strong style={{ color: "var(--text)" }}>{guidesN}</strong> guides</span>
        </div>
      </section>

      {/* Popular */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Popular right now</h2>
          <Link href="/search" className="btn btn-ghost btn-sm">All devices <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((d) => (
            <DeviceCard key={d.id} device={d} verdict={popularVerdicts.get(d.id) ?? null} />
          ))}
        </div>
      </section>

      {/* Verdict quick strip */}
      {popular.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            {popular.map((d) => {
              const v = popularVerdicts.get(d.id);
              return (
                <Link key={d.id} href={deviceHref(d)} className="chip card-hover gap-2">
                  {d.name}
                  {v && <VerdictBadge verdict={v} />}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Shortcuts */}
      <section className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/apps" className="panel card-hover flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-lg" style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}><AppWindow size={20} /></span>
          <span><span className="block font-bold">Apps</span><span className="text-xs muted">Magisk, KernelSU, LSPosed & friends</span></span>
        </Link>
        <Link href="/modules" className="panel card-hover flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-lg" style={{ background: "color-mix(in srgb, var(--ok) 15%, transparent)", color: "var(--ok)" }}><Blocks size={20} /></span>
          <span><span className="block font-bold">Modules</span><span className="text-xs muted">Magisk, LSPosed, Xposed, Vector…</span></span>
        </Link>
        <Link href="/search" className="panel card-hover flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-lg" style={{ background: "color-mix(in srgb, var(--warn) 15%, transparent)", color: "var(--warn)" }}><BookOpenCheck size={20} /></span>
          <span><span className="block font-bold">Guides</span><span className="text-xs muted">Interactive, step-by-step wizards on device pages</span></span>
        </Link>
      </section>

      {/* Updates feed */}
      <section className="mt-14">
        <h2 className="mb-4 text-xl font-bold">Latest updates</h2>
        <ol className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {updates.length === 0 && <li className="p-4 text-sm muted">No updates yet — the index is young.</li>}
          {updates.map((u) => {
            const devRaw = u.device as unknown;
            const dev = (Array.isArray(devRaw) ? devRaw[0] : devRaw) as { slug: string; name: string } | null;
            const href = dev ? deviceHref({ slug: dev.slug }) : "#";
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="chip chip-accent">{UPDATE_KIND_LABEL[u.kind as keyof typeof UPDATE_KIND_LABEL] ?? u.kind}</span>
                {dev ? (
                  <Link href={href} className="shrink-0 font-semibold hover:underline">{dev.name}</Link>
                ) : (
                  <span className="shrink-0 font-semibold muted">Catalog</span>
                )}
                <span className="min-w-0 flex-1 truncate muted">{u.title as string}</span>
                <time className="text-xs muted shrink-0">{new Date(u.created_at as string).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</time>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-10 text-center text-sm muted">
        Missing a phone? <Link className="underline" href="/submit">Contribute it</Link> — verified devs get the badge.
      </div>
    </div>
  );
}
