"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowBigUp, BadgeCheck, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { castVote, confirmWorks, toggleSave } from "@/lib/actions";

export function VoteButton({
  targetType,
  targetId,
  count,
  voted,
  authed,
}: {
  targetType: "question" | "answer" | "issue";
  targetId: string;
  count: number;
  voted: boolean;
  authed: boolean;
}) {
  const [pending, start] = useTransition();
  const path = usePathname();
  const router = useRouter();
  return (
    <button
      className={`btn btn-sm ${voted ? "btn-primary" : ""}`}
      disabled={pending}
      title={authed ? (voted ? "Remove vote" : "Upvote") : "Sign in to vote"}
      onClick={() =>
        authed
          ? start(async () => {
              const r = await castVote(targetType, targetId, path);
              if (!r.ok) toast.error(r.error);
            })
          : router.push(`/login?next=${path}`)
      }
    >
      <ArrowBigUp size={15} fill={voted ? "currentColor" : "none"} /> {count}
    </button>
  );
}

export function ConfirmButton({
  targetType,
  targetId,
  count,
  confirmed,
  authed,
}: {
  targetType: "rom" | "root_method" | "software";
  targetId: string;
  count: number;
  confirmed: boolean;
  authed: boolean;
}) {
  const [pending, start] = useTransition();
  const path = usePathname();
  const router = useRouter();
  return (
    <button
      className={`btn btn-sm ${confirmed ? "btn-primary" : ""}`}
      disabled={pending}
      title={authed ? "I have this working" : "Sign in to confirm"}
      onClick={() =>
        authed
          ? start(async () => {
              const r = await confirmWorks(targetType, targetId, path);
              if (!r.ok) toast.error(r.error);
              else toast.success(confirmed ? "Confirmation removed" : "Marked as working");
            })
          : router.push(`/login?next=${path}`)
      }
    >
      <BadgeCheck size={15} /> {confirmed ? "Working ✓" : "Works for me"} · {count}
    </button>
  );
}

export function SaveButton({ deviceId, href, saved, authed }: { deviceId: string; href: string; saved: boolean; authed: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [hint, setHint] = useState(false);
  return (
    <button
      className={`btn btn-sm ${saved ? "btn-primary" : ""}`}
      disabled={pending}
      onClick={() => {
        if (!authed) return router.push(`/login?next=${href}`);
        start(async () => {
          const r = await toggleSave(deviceId, href);
          if (!r.ok) toast.error(r.error);
          else {
            toast.success(saved ? "Removed from saved" : "Saved — updates will surface on your /saved page");
            if (!saved && !hint) setHint(true);
          }
        });
      }}
    >
      {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {saved ? "Saved" : "Save"}
    </button>
  );
}
