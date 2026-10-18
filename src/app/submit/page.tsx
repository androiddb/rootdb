import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Submission } from "@/lib/types";
import { StatusBadge } from "@/components/badges";
import { SubmitForm, WithdrawButton } from "./submit-client";
import { asDate } from "@/lib/labels";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Add a device, ROM, root method, app, module or correction to the RootDB index. Moderated, never gatekept.",
};

const TYPES = [
  { id: "new_device", label: "New device", hint: "A phone missing from the index" },
  { id: "rom", label: "ROM", hint: "A custom ROM (community builds need public source + build config)" },
  { id: "root_method", label: "Root method", hint: "A way to root (device-specific or universal)" },
  { id: "app", label: "App", hint: "Root-adjacent app (no framework attachment)" },
  { id: "module", label: "Module", hint: "Plugged into a framework — even if it ships as an APK" },
  { id: "guide", label: "Guide", hint: "An interactive block guide (reviewed before going live)" },
  { id: "correction", label: "Correction", hint: "Something in the index is wrong" },
  { id: "broken_link", label: "Broken link", hint: "A dead download or stale mirror" },
] as const;

export default async function SubmitPage(props: { searchParams: Promise<{ type?: string; from?: string; q?: string }> }) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // user's submission history + whether they're a verified dev
  let mine: Submission[] = [];
  let verifiedDev = false;
  let devices: { id: string; name: string; brand: string }[] = [];
  if (user) {
    const [{ data: subs }, { data: prof }, { data: devs }] = await Promise.all([
      supabase.from("submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("is_verified_dev").eq("id", user.id).single(),
      supabase.from("devices").select("id,name,brand").order("popularity", { ascending: false }).limit(400),
    ]);
    mine = (subs ?? []) as Submission[];
    verifiedDev = !!prof?.is_verified_dev;
    devices = (devs ?? []) as { id: string; name: string; brand: string }[];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Contribute to the index</h1>
      <p className="mt-1 text-sm muted">
        Everything is user-submittable; a moderator checks facts before it surfaces. Verified maintainers
        get their official uploads stamped <span className="chip chip-ok">Official ✓</span>.
        {verifiedDev && <span className="chip chip-ok ml-1">You hold the Verified Developer badge</span>}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TYPES.map((t) => (
          <Link key={t.id} href={`/submit?type=${t.id}`} className={`panel card-hover p-3 text-sm ${sp.type === t.id ? "ring-1" : ""}`} style={sp.type === t.id ? { borderColor: "var(--accent)" } : undefined}>
            <div className="font-semibold">{t.label}</div>
            <div className="mt-0.5 text-xs muted">{t.hint}</div>
          </Link>
        ))}
      </div>

      {sp.type && (
        <div className="mt-6">
          <SubmitForm type={sp.type} devices={devices} fromHref={sp.from} defaultTitle={sp.q} />
        </div>
      )}

      {mine.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">Your submissions</h2>
          <ol className="panel divide-y" style={{ borderColor: "var(--border)" }}>
            {mine.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="chip">{s.type.replace(/_/g, " ")}</span>
                <span className="min-w-0 flex-1 truncate">{(s.payload as { title?: string; name?: string }).title ?? (s.payload as { name?: string }).name ?? JSON.stringify(s.payload).slice(0, 60)}</span>
                <StatusBadge status={s.status} />
                {s.reviewer_note && <span className="basis-full text-xs muted">Moderator: {s.reviewer_note}</span>}
                <time className="shrink-0 text-xs muted">{asDate(s.created_at)}</time>
                {s.status === "pending" && <WithdrawButton id={s.id} />}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
