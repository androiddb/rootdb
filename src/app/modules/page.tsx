import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { ModuleFramework, Software } from "@/lib/types";
import { FullSoftwareCard } from "@/components/software-card";
import { FRAMEWORK_META } from "@/lib/labels";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Modules",
  description: "Framework modules indexed by RootDB: Magisk, KernelSU, APatch, LSPosed, Xposed, Vector. Even the APK-distributed ones.",
};

export default async function ModulesPage(props: { searchParams: Promise<{ fw?: string }> }) {
  const { fw } = await props.searchParams;
  const filterFw = fw && fw in FRAMEWORK_META ? (fw as ModuleFramework) : null;

  const supabase = await createClient();
  let query = supabase.from("software").select("*").eq("kind", "module");
  if (filterFw) query = query.eq("framework", filterFw);
  const { data } = await query.order("framework").order("confirmed_count", { ascending: false }).order("name");
  const rows = (data ?? []) as Software[];

  const frameworks = Object.keys(FRAMEWORK_META) as ModuleFramework[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Modules</h1>
      <p className="mt-1 max-w-2xl text-sm muted">
        If it plugs into a framework it&rsquo;s a module — even when it ships as an APK (hello LSPosed). Per-framework shelves below;
        device pages list only the device-specific ones.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/modules" className={`chip ${!filterFw ? "chip-accent" : ""}`}>All</Link>
        {frameworks.map((f) => (
          <Link key={f} href={`/modules?fw=${f}`} className={`chip ${filterFw === f ? "chip-accent" : ""}`}>{FRAMEWORK_META[f].label}</Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="panel mt-6 p-8 text-center text-sm muted">
          Nothing on this shelf yet — <Link className="underline" href={`/submit?type=module${filterFw ? `&fw=${filterFw}` : ""}`}>submit one</Link>.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => <FullSoftwareCard key={s.id} sw={s} />)}
        </div>
      )}
    </div>
  );
}
