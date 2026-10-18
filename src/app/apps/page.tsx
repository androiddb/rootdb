import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Software } from "@/lib/types";
import { FullSoftwareCard } from "@/components/software-card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apps",
  description: "Root-adjacent apps indexed by RootDB — root managers, backup, salvage, debloat. Link-out only, no binary hosting.",
};

export default async function AppsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("software")
    .select("*")
    .eq("kind", "app")
    .order("confirmed_count", { ascending: false })
    .order("name");
  const apps = (data ?? []) as Software[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Apps</h1>
      <p className="mt-1 max-w-2xl text-sm muted">
        The root ecosystem&rsquo;s apps — managers, backup, Play Integrity tooling, debloaters. RootDB links out; it never hosts binaries.
        If it plugs into a framework, it lives under <Link href="/modules" className="underline">Modules</Link> instead.
      </p>

      {apps.length === 0 ? (
        <div className="panel mt-6 p-8 text-center text-sm muted">No apps indexed yet — <Link className="underline" href="/submit?type=app">submit the first</Link>.</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((s) => <FullSoftwareCard key={s.id} sw={s} />)}
        </div>
      )}
    </div>
  );
}
