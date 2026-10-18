"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { toggleSave } from "@/lib/actions";

export function UnsaveButton({ deviceId }: { deviceId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-ghost btn-sm"
      disabled={pending}
      title="Remove from saved"
      onClick={() => start(async () => { const r = await toggleSave(deviceId, "/saved"); if (!r.ok) toast.error(r.error); })}
    >
      <X size={14} />
    </button>
  );
}
