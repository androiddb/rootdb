"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { reportIssue } from "@/lib/actions";

export function IssueForm({
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
  const [severity, setSeverity] = useState("medium");
  const [romId, setRomId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [variantId, setVariantId] = useState("");

  if (!authed) return <button className="btn btn-primary btn-sm" onClick={() => router.push(`/login?next=${path}`)}>Report an issue</button>;
  if (!open) return <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Report an issue</button>;

  return (
    <form
      className="panel w-full space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await reportIssue(
            { deviceId, title, body, severity, scope: { romId: romId || undefined, rootMethodId: methodId || undefined, variantId: variantId || undefined } },
            path,
          );
          if (!r.ok) { toast.error(r.error); return; }
          toast.success("Issue reported — moderators will triage");
          setOpen(false); setTitle(""); setBody("");
        });
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_12rem]">
        <input className="input" placeholder="Issue in one line…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        <select className="select" value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity">
          <option value="low">Severity: Low</option>
          <option value="medium">Severity: Medium</option>
          <option value="high">Severity: High</option>
          <option value="critical">Severity: Critical</option>
        </select>
      </div>
      <textarea className="textarea" rows={3} placeholder="Repro steps, build fingerprint, error text… (Markdown ok)" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="muted font-semibold uppercase tracking-wide">Scope</span>
        <select className="select w-auto" value={romId} onChange={(e) => setRomId(e.target.value)}>
          <option value="">No specific ROM</option>
          {scopes.roms.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select className="select w-auto" value={methodId} onChange={(e) => setMethodId(e.target.value)}>
          <option value="">No specific method</option>
          {scopes.methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <select className="select w-auto" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
          <option value="">No specific variant</option>
          {scopes.variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        <span className="flex-1" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={pending}><Send size={14} /> Report issue</button>
      </div>
    </form>
  );
}
