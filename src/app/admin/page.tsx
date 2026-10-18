import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Guide, Issue, Question, Submission } from "@/lib/types";
import { StatusBadge, SeverityBadge } from "@/components/badges";
import { relativeTime } from "@/lib/labels";
import { ReviewButtons, GuidePublishButtons, IssueStatusRow, QuestionStatusRow } from "./admin-client";
import Link from "next/link";

export const metadata: Metadata = { title: "Moderation" };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/");

  const [{ data: subs }, { data: drafts }, { data: openIssues }, { data: openQuestions }, counts] = await Promise.all([
    supabase.from("submissions").select("*, submitter:profiles!submissions_user_id_fkey(username,display_name)").eq("status", "pending").order("created_at").limit(50),
    supabase.from("guides").select("*, device:devices!guides_device_id_fkey(name), author:profiles!guides_author_id_fkey(username)").eq("published", false).order("created_at").limit(30),
    supabase.from("issues").select("*, device:devices!issues_device_id_fkey(name,slug)").in("status", ["open", "confirmed"]).order("severity", { ascending: false }).order("created_at").limit(40),
    supabase.from("questions").select("*, device:devices!questions_device_id_fkey(name,slug)").eq("status", "open").order("created_at", { ascending: false }).limit(20),
    Promise.all([
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("devices").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("guides").select("id", { count: "exact", head: true }).eq("published", false),
    ]),
  ]);

  const [pendingN, devicesN, usersN, draftsN] = counts.map((c) => c.count ?? 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Moderation</h1>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="chip chip-warn">{pendingN} pending submissions</span>
        <span className="chip">{devicesN} devices</span>
        <span className="chip">{usersN} users</span>
        <span className="chip chip-warn">{draftsN} unpublished guides</span>
      </div>

      {/* Submission queue */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Submission queue</h2>
        {(subs ?? []).length === 0 ? (
          <div className="panel p-6 text-center text-sm muted">Queue is empty. The index sleeps.</div>
        ) : (
          <ol className="space-y-3">
            {(subs ?? []).map((s) => {
              const submitter = s.submitter as unknown as { username: string; display_name: string | null } | null;
              return (
                <li key={s.id} className="panel p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="chip">{s.type.replace(/_/g, " ")}</span>
                    <span className="muted text-xs">by {submitter?.display_name ?? submitter?.username ?? "?"} · {relativeTime(s.created_at)}</span>
                    <span className="flex-1" />
                    <ReviewButtons id={s.id} />
                  </div>
                  <pre className="panel-alt mt-2 max-h-48 overflow-auto rounded-md p-3 text-xs" style={{ color: "var(--text)" }}>
                    {JSON.stringify(s.payload, null, 2)}
                  </pre>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Guide drafts */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold">Guide drafts (moderated before live)</h2>
        {(drafts ?? []).length === 0 ? (
          <div className="panel p-6 text-center text-sm muted">No drafts waiting.</div>
        ) : (
          <ol className="space-y-2">
            {(drafts ?? []).map((g) => {
              const dev = g.device as unknown as { name: string } | null;
              const author = g.author as unknown as { username: string } | null;
              return (
                <li key={g.id} className="panel flex flex-wrap items-center gap-2 p-3 text-sm">
                  <span className="chip">{g.kind.replace(/_/g, " ")}</span>
                  <strong>{(g as unknown as Guide).title}</strong>
                  <span className="muted text-xs">{dev ? `device: ${dev.name}` : "generic"} · by {author?.username ?? "?"}</span>
                  <span className="flex-1" />
                  <GuidePublishButtons id={g.id} />
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Issue triage */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold">Issue triage</h2>
        {(openIssues ?? []).length === 0 ? (
          <div className="panel p-6 text-center text-sm muted">No open issues.</div>
        ) : (
          <ol className="space-y-3">
            {(openIssues ?? []).map((i) => {
              const issue = i as unknown as Issue;
              const dev = i.device as unknown as { name: string; slug: string } | null;
              return (
                <li key={i.id} className="panel p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <SeverityBadge severity={issue.severity} />
                    <StatusBadge status={issue.status} />
                    <strong className="min-w-0 flex-1">{issue.title}</strong>
                  </div>
                  <div className="mt-1 text-xs muted">
                    {dev && <span>on {dev.name} · </span>}reported {relativeTime(issue.created_at)} · {issue.upvotes} votes
                  </div>
                  {issue.body_md && <p className="mt-2 line-clamp-3 text-sm muted">{issue.body_md}</p>}
                  <IssueStatusRow id={issue.id} current={issue.status} />
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Open questions quick view */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold">Open questions</h2>
        {(openQuestions ?? []).length === 0 ? (
          <div className="panel p-6 text-center text-sm muted">Nothing open.</div>
        ) : (
          <ol className="panel divide-y text-sm" style={{ borderColor: "var(--border)" }}>
            {(openQuestions ?? []).map((q) => {
              const question = q as unknown as Question;
              const dev = q.device as unknown as { name: string; slug: string } | null;
              return (
                <li key={q.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                  <span className="min-w-0 flex-1 font-medium">{question.title}</span>
                  {dev && (
                    <Link href={`/device/${dev.slug.split("-")[0]}/${dev.slug.split("-").slice(1).join("-")}?tab=questions`} className="muted text-xs hover:underline">
                      {dev.name}
                    </Link>
                  )}
                  <QuestionStatusRow id={question.id} current={question.status} />
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
