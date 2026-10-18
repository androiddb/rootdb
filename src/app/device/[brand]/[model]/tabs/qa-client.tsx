"use client";

import { useState, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowBigUp, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { askQuestion, addAnswer, acceptAnswer, castVote } from "@/lib/actions";

/** Compact upvote pill rendered beside authored content. */
export function AuthorPickRow({
  prefix, upvotes, targetType, targetId, voted, authed,
}: {
  prefix?: React.ReactNode; upvotes: number; targetType: "question" | "answer" | "issue"; targetId: string; voted: boolean; authed: boolean;
}) {
  const [pending, start] = useTransition();
  const path = usePathname();
  const router = useRouter();
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="min-w-0 flex-1">{prefix}</span>
      <button
        className={`btn btn-sm shrink-0 ${voted ? "btn-primary" : "btn-ghost"}`}
        disabled={pending}
        title={authed ? (voted ? "Unvote" : "Upvote") : "Sign in to upvote"}
        onClick={() =>
          authed
            ? start(async () => {
                const r = await castVote(targetType, targetId, path);
                if (!r.ok) toast.error(r.error);
              })
            : router.push(`/login?next=${path}`)
        }
      >
        <ArrowBigUp size={15} fill={voted ? "currentColor" : "none"} /> {upvotes}
      </button>
    </span>
  );
}

function AskSelect({ value, onChange, items, placeholder }: { value: string; onChange: (v: string) => void; items: { id: string; label: string }[]; placeholder: string }) {
  const options = useMemo(() => items, [items]);
  return (
    <select className="select w-auto" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
    </select>
  );
}

export function AskForm({
  deviceId, authed, scopes,
}: {
  deviceId: string;
  authed: boolean;
  scopes: { roms: { id: string; label: string }[]; methods: { id: string; label: string }[]; variants: { id: string; label: string }[] };
}) {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [romId, setRomId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [variantId, setVariantId] = useState("");

  if (!authed) return <button className="btn btn-primary btn-sm" onClick={() => router.push(`/login?next=${path}`)}>Ask a question</button>;

  if (!open) return <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Ask a question</button>;

  return (
    <form
      className="panel w-full space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await askQuestion(
            { deviceId, title, body, scope: { romId: romId || undefined, rootMethodId: methodId || undefined, variantId: variantId || undefined } },
            path,
          );
          if (!r.ok) { toast.error(r.error); return; }
          toast.success("Question posted");
          setOpen(false); setTitle(""); setBody("");
        });
      }}
    >
      <input className="input" placeholder="Your question in one line…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      <textarea className="textarea" rows={3} placeholder="Details — what you tried, error text, Android version… (Markdown ok)" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="muted font-semibold uppercase tracking-wide">Scope</span>
        <AskSelect value={romId} onChange={setRomId} items={scopes.roms} placeholder="No specific ROM" />
        <AskSelect value={methodId} onChange={setMethodId} items={scopes.methods} placeholder="No specific root method" />
        <AskSelect value={variantId} onChange={setVariantId} items={scopes.variants} placeholder="No specific variant" />
        <span className="flex-1" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={pending}><Send size={14} /> Post question</button>
      </div>
    </form>
  );
}

export function AnswerForm({ questionId, authed }: { questionId: string; authed: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");

  if (!authed) return <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/login?next=${path}`)}>Sign in to answer</button>;
  if (!open) return <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Write an answer</button>;

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await addAnswer({ questionId, body }, path);
          if (!r.ok) { toast.error(r.error); return; }
          toast.success("Answer posted");
          setOpen(false); setBody("");
        });
      }}
    >
      <textarea className="textarea" rows={3} placeholder="Your answer (Markdown ok)…" value={body} onChange={(e) => setBody(e.target.value)} required />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={pending}><Send size={14} /> Post answer</button>
      </div>
    </form>
  );
}

export function AcceptAnswerButton({ answerId }: { answerId: string }) {
  const [pending, start] = useTransition();
  const path = usePathname();
  return (
    <button
      className="btn btn-sm"
      disabled={pending}
      title="Mark as the accepted answer"
      onClick={() =>
        start(async () => {
          const r = await acceptAnswer(answerId, path);
          if (!r.ok) toast.error(r.error);
          else toast.success("Answer accepted");
        })
      }
    >
      <CheckCircle2 size={14} /> Accept
    </button>
  );
}
