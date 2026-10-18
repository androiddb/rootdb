import type { DeviceBundle } from "@/lib/server/device";
import { UPDATE_KIND_LABEL } from "@/lib/types";
import { asDate } from "@/lib/labels";

export function UpdatesTab({ bundle }: { bundle: DeviceBundle; variantId: string | null; href: string }) {
  const rows = bundle.updates;
  return (
    <div>
      <p className="mb-4 text-sm muted">
        Every change to this device&rsquo;s index row — new ROM listings, verdict changes, published guides — lands here and on your saved feed.
      </p>
      {rows.length === 0 ? (
        <div className="panel p-8 text-center text-sm muted">Nothing yet. Save this device to catch what lands next.</div>
      ) : (
        <ol className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.map((u) => (
            <li key={u.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
              <span className="chip chip-accent shrink-0">{UPDATE_KIND_LABEL[u.kind]}</span>
              <span className="min-w-0 flex-1">{u.title}</span>
              {u.body && <span className="basis-full text-xs muted">{u.body}</span>}
              <time className="shrink-0 text-xs muted">{asDate(u.created_at)}</time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
