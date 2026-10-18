import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Device, Verdict } from "@/lib/types";
import { UPDATE_KIND_LABEL } from "@/lib/types";
import { DeviceCard } from "@/components/device-card";
import { UnsaveButton } from "./saved-client";
import { asDate } from "@/lib/labels";

export const metadata: Metadata = { title: "Saved devices" };

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: saved } = await supabase
    .from("saved_devices")
    .select("device_id,last_seen_at,created_at, device:devices!saved_devices_device_id_fkey(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const rows = (saved ?? []) as { device_id: string; last_seen_at: string; device: Device | Device[] }[];
  const devices = rows.map((r) => ({ ...r, device: (Array.isArray(r.device) ? r.device[0] : r.device) as Device }));
  const deviceIds = devices.map((d) => d.device_id);

  const verdictMap = new Map<string, Verdict>();
  const romCountMap = new Map<string, number>();
  if (deviceIds.length) {
    const [{ data: root }, { data: roms }] = await Promise.all([
      supabase.from("device_rootability").select("device_id,verdict").in("device_id", deviceIds),
      supabase.from("roms").select("device_id").in("device_id", deviceIds),
    ]);
    for (const r of root ?? []) verdictMap.set(r.device_id, r.verdict as Verdict);
    for (const r of roms ?? []) romCountMap.set(r.device_id, (romCountMap.get(r.device_id) ?? 0) + 1);
  }

  // updates for saved devices since last seen
  const { data: updates } = deviceIds.length
    ? await supabase.from("device_updates").select("*").in("device_id", deviceIds).order("created_at", { ascending: false }).limit(40)
    : { data: [] };
  const unseenByDevice = new Map<string, number>();
  for (const u of updates ?? []) {
    const savedRow = devices.find((d) => d.device_id === u.device_id);
    if (savedRow && new Date(u.created_at as string) > new Date(savedRow.last_seen_at)) {
      unseenByDevice.set(u.device_id, (unseenByDevice.get(u.device_id) ?? 0) + 1);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Bookmark size={22} style={{ color: "var(--accent)" }} /> Saved devices</h1>
      <p className="mt-1 text-sm muted">Your watchlist — updates surface here. Stored in your account, never used for anything else.</p>

      {devices.length === 0 ? (
        <div className="panel mt-6 p-8 text-center">
          <p className="text-lg font-semibold">Nothing saved yet.</p>
          <p className="mt-1 text-sm muted">Hit <Bookmark size={13} className="inline -translate-y-px" /> on any device page — say your daily driver and your next target.</p>
          <Link href="/search" className="btn btn-primary mt-4">Browse devices</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map(({ device: d, device_id }) => (
              <div key={device_id} className="relative">
                <DeviceCard device={d} verdict={verdictMap.get(device_id) ?? null} romCount={romCountMap.get(device_id) ?? 0} />
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  {(unseenByDevice.get(device_id) ?? 0) > 0 && <span className="chip chip-accent">{unseenByDevice.get(device_id)} new</span>}
                  <UnsaveButton deviceId={device_id} />
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-10 mb-3 text-lg font-bold">Recent updates on your devices</h2>
          <ol className="panel divide-y" style={{ borderColor: "var(--border)" }}>
            {(updates ?? []).length === 0 ? (
              <li className="p-4 text-sm muted">No updates yet.</li>
            ) : (
              (updates ?? []).slice(0, 20).map((u) => {
                const dev = devices.find((d) => d.device_id === u.device_id)?.device;
                return (
                  <li key={u.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
                    <span className="chip chip-accent shrink-0">{UPDATE_KIND_LABEL[u.kind as keyof typeof UPDATE_KIND_LABEL]}</span>
                    {dev && <Link href={`/device/${dev.slug.split("-")[0]}/${dev.slug.split("-").slice(1).join("-")}`} className="shrink-0 font-semibold hover:underline">{dev.name}</Link>}
                    <span className="min-w-0 flex-1 truncate muted">{u.title as string}</span>
                    <time className="shrink-0 text-xs muted">{asDate(u.created_at as string)}</time>
                  </li>
                );
              })
            )}
          </ol>
        </>
      )}
    </div>
  );
}
