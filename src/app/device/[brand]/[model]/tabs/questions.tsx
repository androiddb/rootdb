import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DeviceBundle } from "@/lib/server/device";
import type { Answer, Question } from "@/lib/types";
import { StatusBadge } from "@/components/badges";
import { relativeTime } from "@/lib/labels";
import { Markdown } from "@/components/markdown";
import { AskForm, AnswerForm, AcceptAnswerButton, AuthorPickRow } from "./qa-client";

export async function QuestionsTab({ bundle, variantId, href }: { bundle: DeviceBundle; variantId: string | null; href: string }) {
  const supabase = await createClient();

  let q = supabase
    .from("questions")
    .select("*, author:profiles!questions_author_id_fkey(username,display_name,role,is_verified_dev)")
    .eq("device_id", bundle.device.id)
    .order("created_at", { ascending: false })
    .limit(50);
  // variant filter: "All" shows everything; a variant shows variant + general
  if (variantId) q = q.or(`variant_id.is.null,variant_id.eq.${variantId}`);
  const { data: questions } = await q;

  const rows = (questions ?? []) as unknown as (Question & { author: Question["author"] })[];
  const ids = rows.map((r) => r.id);

  let answersByQ = new Map<string, Answer[]>();
  let votedQ = new Set<string>();
  let votedA = new Set<string>();
  if (ids.length) {
    const { data: answers } = await supabase
      .from("answers")
      .select("*, author:profiles!answers_author_id_fkey(username,display_name,role,is_verified_dev)")
      .in("question_id", ids)
      .order("is_accepted", { ascending: false })
      .order("upvotes", { ascending: false })
      .order("created_at");
    for (const a of (answers ?? []) as unknown as (Answer & { author: Answer["author"] })[]) {
      const list = answersByQ.get(a.question_id) ?? [];
      list.push(a);
      answersByQ.set(a.question_id, list);
    }
    if (bundle.auth.authed) {
      const user = bundle.auth.profile!.id;
      const aIds = (answers ?? []).map((a) => a.id as string);
      const { data: votes } = await supabase
        .from("votes")
        .select("target_id,target_type")
        .eq("user_id", user)
        .in("target_id", [...ids, ...aIds]);
      for (const v of votes ?? []) {
        if (v.target_type === "question") votedQ.add(v.target_id);
        else votedA.add(v.target_id);
      }
    }
  }

  const scopes = {
    roms: bundle.roms.map((r) => ({ id: r.id, label: r.name })),
    methods: bundle.methodsDevice.map((m) => ({ id: m.id, label: m.name })),
    variants: bundle.variants.map((v) => ({ id: v.id, label: v.label })),
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">Device-general by default — optionally scoped to a ROM, root method or variant. Answers that solve it get pinned.</p>
        <AskForm deviceId={bundle.device.id} authed={bundle.auth.authed} scopes={scopes} />
      </div>

      {rows.length === 0 && (
        <div className="panel p-8 text-center">
          <p className="text-lg font-semibold">No questions yet.</p>
          <p className="mt-1 text-sm muted">Ask the first — scoped questions get faster, better answers.</p>
        </div>
      )}

      {rows.map((qu) => (
        <article key={qu.id} className="panel p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={qu.status} />
            <AuthorPickRow prefix={<strong className="text-base leading-snug">{qu.title}</strong>} upvotes={qu.upvotes} targetType="question" targetId={qu.id} voted={votedQ.has(qu.id)} authed={bundle.auth.authed} />
          </div>
          <div className="mt-1 text-xs muted">
            asked {relativeTime(qu.created_at)} by {qu.author?.display_name ?? qu.author?.username ?? "someone"}
            {qu.author?.is_verified_dev && <span className="chip chip-ok ml-1">Verified dev</span>}
          </div>
          {qu.body_md && <div className="mt-3"><Markdown>{qu.body_md}</Markdown></div>}

          <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            {(answersByQ.get(qu.id) ?? []).map((a) => (
              <div key={a.id} className={`rounded-md border p-4 ${a.is_accepted ? "" : ""}`} style={{ borderColor: a.is_accepted ? "color-mix(in srgb, var(--ok) 55%, transparent)" : "var(--border)", background: a.is_accepted ? "color-mix(in srgb, var(--ok) 6%, transparent)" : "transparent" }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs muted">
                    {a.author?.display_name ?? a.author?.username ?? "someone"} · {relativeTime(a.created_at)}
                    {a.author?.is_verified_dev && <span className="chip chip-ok ml-1">Verified dev</span>}
                    {a.is_accepted && <span className="chip chip-ok ml-2">Accepted answer</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <AuthorPickRow upvotes={a.upvotes} targetType="answer" targetId={a.id} voted={votedA.has(a.id)} authed={bundle.auth.authed} />
                    {bundle.auth.authed && (bundle.auth.profile!.id === qu.author_id || bundle.auth.profile!.role !== "user") && !a.is_accepted && qu.status !== "closed" && (
                      <AcceptAnswerButton answerId={a.id} />
                    )}
                  </div>
                </div>
                <div className="mt-2"><Markdown>{a.body_md}</Markdown></div>
              </div>
            ))}
            {qu.status !== "closed" && <AnswerForm questionId={qu.id} authed={bundle.auth.authed} />}
            {qu.status === "closed" && <p className="text-xs muted">This question is closed.</p>}
          </div>
        </article>
      ))}

      {rows.length === 50 && <p className="text-center text-sm muted">Showing the 50 newest — <Link className="underline" href={`${href}?tab=questions`}>search narrows further</Link>.</p>}
    </div>
  );
}
