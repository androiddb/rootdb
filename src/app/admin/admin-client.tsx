"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminReviewSubmission, adminPublishGuide, adminSetIssueStatus, adminSetQuestionStatus } from "@/lib/actions";
import type { IssueStatus, QuestionStatus } from "@/lib/types";

export function ReviewButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const act = (approve: boolean) =>
    start(async () => {
      const r = await adminReviewSubmission(id, approve, note || undefined);
      if (!r.ok) toast.error(r.error);
      else toast.success(approve ? "Approved" : "Rejected");
    });
  return (
    <span className="inline-flex items-center gap-2">
      <input className="input w-44" placeholder="note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn btn-sm" disabled={pending} onClick={() => act(true)} style={{ borderColor: "color-mix(in srgb, var(--ok) 60%, transparent)", color: "var(--ok)" }}>Approve</button>
      <button className="btn btn-sm" disabled={pending} onClick={() => act(false)} style={{ borderColor: "color-mix(in srgb, var(--bad) 60%, transparent)", color: "var(--bad)" }}>Reject</button>
    </span>
  );
}

export function GuidePublishButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const act = (publish: boolean) =>
    start(async () => {
      const r = await adminPublishGuide(id, publish);
      if (!r.ok) toast.error(r.error);
      else toast.success(publish ? "Published" : "Unpublished");
    });
  return <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => act(true)}>Publish</button>;
}

export function IssueStatusRow({ id, current }: { id: string; current: IssueStatus }) {
  const [pending, start] = useTransition();
  const [resolution, setResolution] = useState("");
  const set = (status: IssueStatus) =>
    start(async () => {
      const r = await adminSetIssueStatus(id, status, resolution || undefined);
      if (!r.ok) toast.error(r.error);
      else toast.success(`Marked ${status}`);
    });
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input className="input max-w-72" placeholder="resolution note (for fixed/wontfix/duplicate)" value={resolution} onChange={(e) => setResolution(e.target.value)} />
      {(["confirmed", "fixed", "wontfix", "duplicate", "open"] as IssueStatus[]).filter((s) => s !== current).map((s) => (
        <button key={s} className="btn btn-sm" disabled={pending} onClick={() => set(s)}>{s === "wontfix" ? "won't fix" : s}</button>
      ))}
    </div>
  );
}

export function QuestionStatusRow({ id, current }: { id: string; current: QuestionStatus }) {
  const [pending, start] = useTransition();
  const set = (status: QuestionStatus) =>
    start(async () => {
      const r = await adminSetQuestionStatus(id, status);
      if (!r.ok) toast.error(r.error);
      else toast.success(`Marked ${status}`);
    });
  return (
    <span className="inline-flex gap-1">
      {(["answered", "solved", "closed", "open"] as QuestionStatus[]).filter((s) => s !== current).map((s) => (
        <button key={s} className="btn btn-ghost btn-sm" disabled={pending} onClick={() => set(s)}>{s}</button>
      ))}
    </span>
  );
}
