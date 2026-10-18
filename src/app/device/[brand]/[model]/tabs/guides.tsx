import Link from "next/link";
import { BookOpenCheck, Landmark } from "lucide-react";
import type { DeviceBundle } from "@/lib/server/device";
import type { Guide } from "@/lib/types";
import { deviceHref } from "@/lib/types";
import { difficultyLabel, asDate } from "@/lib/labels";

function GuideCard({ g, href }: { g: Guide; href: string }) {
  return (
    <Link href={`${href}/guides/${g.id}`} className="panel card-hover block p-4">
      <div className="flex flex-wrap items-center gap-2">
        <strong>{g.title}</strong>
        <span className="chip">{g.kind.replace(/_/g, " ")}</span>
        <span className="chip">{difficultyLabel(g.difficulty)}</span>
        {g.source === "admin" && <span className="chip chip-ok"><Landmark size={11} /> Curated</span>}
        {g.device_id === null && <span className="chip chip-accent">Generic</span>}
      </div>
      {g.summary && <p className="mt-1.5 line-clamp-2 text-sm muted">{g.summary}</p>}
      <p className="mt-2 text-xs muted">Interactive blocks · updated {asDate(g.created_at)}</p>
    </Link>
  );
}

export function GuidesTab({ bundle, href }: { bundle: DeviceBundle; variantId: string | null; href: string }) {
  const dev = bundle.guides;
  const generic = bundle.genericGuides;

  return (
    <div className="space-y-8">
      <p className="text-sm muted">
        Guides are interactive block wizards — read, answer branch questions, get the exact next step.{" "}
        <Link className="underline" href="/submit?type=guide">Write one</Link> (reviewed before going live).
      </p>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><BookOpenCheck size={19} style={{ color: "var(--accent)" }} /> For this device</h2>
        {dev.length === 0 ? (
          <div className="panel p-5 text-sm muted">
            No device-specific guides yet. Generic guides below often apply — and check <Link className="underline" href={`${href}?tab=downloads`}>Downloads</Link> for method steps.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dev.map((g) => <GuideCard key={g.id} g={g} href={href} />)}
          </div>
        )}
      </section>

      {generic.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Generic guides (apply anywhere)</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {generic.map((g) => <GuideCard key={g.id} g={g} href={href} />)}
          </div>
        </section>
      )}
    </div>
  );
}
