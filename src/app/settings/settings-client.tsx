"use client";

import { useState, useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, setAnalyticsOptOut, deleteAccount } from "@/lib/actions";

export function ProfileForm({ username, displayName }: { username: string; displayName: string }) {
  const [pending, start] = useTransition();
  const [u, setU] = useState(username);
  const [d, setD] = useState(displayName);
  return (
    <form
      className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfile({ username: u.trim(), display_name: d.trim() });
          if (!r.ok) toast.error(r.error);
          else toast.success("Profile saved");
        });
      }}
    >
      <input className="input" value={u} onChange={(e) => setU(e.target.value)} placeholder="username" pattern="[a-z0-9_]{3,24}" title="3-24 lowercase letters, digits, underscores" />
      <input className="input" value={d} onChange={(e) => setD(e.target.value)} placeholder="Display name (optional)" maxLength={80} />
      <button className="btn btn-primary" disabled={pending}>Save</button>
    </form>
  );
}

export function AnalyticsToggle({ initial }: { initial: boolean }) {
  const [pending, start] = useTransition();
  const [optOut, setOptOut] = useState(initial);
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold">Anonymous usage analytics</p>
        <p className="text-sm muted">
          Vercel Analytics counts page views — no cookies, no fingerprinting, nothing sold or shared. On by default;
          opt out here and nothing of yours is sent.
        </p>
      </div>
      <button
        role="switch"
        aria-checked={!optOut}
        className={`btn shrink-0 ${optOut ? "" : "btn-primary"}`}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const next = !optOut;
            const r = await setAnalyticsOptOut(next);
            if (!r.ok) { toast.error(r.error); return; }
            setOptOut(next);
            toast.success(next ? "Analytics off — nothing will be collected" : "Analytics on");
          })
        }
      >
        {optOut ? "Off" : "On"}
      </button>
    </div>
  );
}

export function ExportAccount() {
  const [pending, start] = useTransition();
  const [data, setData] = useState<string | null>(null);
  return (
    <div className="flex items-start justify-between gap-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
      <div>
        <p className="font-semibold">Export everything</p>
        <p className="text-sm muted">Your profile, saved devices, questions, answers, issues, votes and submissions as JSON.</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          className="btn"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await fetch("/api/export", { method: "GET" });
              if (!res.ok) { toast.error("Export failed"); return; }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "rootdb-export.json";
              a.click();
              URL.revokeObjectURL(url);
              setData("done");
            })
          }
        >
          <Download size={14} /> {data ? "Export again" : "Download JSON"}
        </button>
      </div>
    </div>
  );
}

export function DangerZone() {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  return (
    <div>
      <p className="text-sm muted">
        Permanently delete your account. Questions and answers you wrote stay (attributed to a deleted account) so
        community threads keep making sense; everything personal — profile, saved devices, votes, submissions — goes.
      </p>
      {!confirm ? (
        <button className="btn mt-3" style={{ borderColor: "var(--bad)", color: "var(--bad)" }} onClick={() => setConfirm(true)}>
          <Trash2 size={14} /> Delete my account
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-semibold">Type <code style={{ color: "var(--code)" }}>DELETE</code> to confirm:</p>
          <div className="flex gap-2">
            <input className="input max-w-40" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" />
            <button
              className="btn"
              style={{ background: "var(--bad)", color: "#fff", borderColor: "transparent", opacity: typed === "DELETE" ? 1 : 0.4 }}
              disabled={typed !== "DELETE" || pending}
              onClick={() =>
                start(async () => {
                  const r = await deleteAccount();
                  if (r && !r.ok) toast.error(r.error);
                })
              }
            >
              Permanently delete
            </button>
            <button className="btn btn-ghost" onClick={() => { setConfirm(false); setTyped(""); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
