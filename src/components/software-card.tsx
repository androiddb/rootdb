import { ExternalLink, User } from "lucide-react";
import type { Software } from "@/lib/types";
import { ProvenanceBadge, StatusBadge } from "@/components/badges";
import { FRAMEWORK_META } from "@/lib/labels";

export function FullSoftwareCard({ sw: s }: { sw: Software }) {
  return (
    <article className="panel card-hover flex flex-col p-4">
      <div className="flex flex-wrap items-center gap-2">
        <strong>{s.name}</strong>
        {s.kind === "module" && s.framework && <span className="chip chip-accent">{FRAMEWORK_META[s.framework]?.label ?? s.framework}</span>}
        <span className="chip">{s.artifact.toUpperCase()}</span>
        {s.requires_root && <span className="chip chip-warn">root</span>}
        <StatusBadge status={s.status} />
        <ProvenanceBadge provenance={s.provenance} />
      </div>
      {s.description && <p className="mt-1.5 flex-1 text-sm muted">{s.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs muted">
        {s.author_name && (
          <span className="inline-flex items-center gap-1">
            <User size={11} />
            {s.author_profile ? <a className="underline" href={s.author_profile} target="_blank" rel="noreferrer">{s.author_name}</a> : s.author_name}
          </span>
        )}
        {s.version && <span>v{s.version}</span>}
        {s.min_framework_version && <span>framework ≥ {s.min_framework_version}</span>}
        {s.android_range && <span>{s.android_range}</span>}
        <span className="ml-auto flex items-center gap-2">
          {s.source_repo_url && <a className="underline" href={s.source_repo_url} target="_blank" rel="noreferrer">source</a>}
          <a className="btn btn-sm" href={s.download_url} target="_blank" rel="noreferrer">Get <ExternalLink size={12} /></a>
        </span>
      </div>
    </article>
  );
}
