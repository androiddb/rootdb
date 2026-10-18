"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { submitContribution, withdrawSubmission } from "@/lib/actions";
import type { SubmissionType } from "@/lib/types";

const isHttp = (s: string) => /^https?:\/\//i.test(s);

export function SubmitForm({
  type, devices, fromHref, defaultTitle,
}: {
  type: string; devices: { id: string; name: string; brand: string }[]; fromHref?: string; defaultTitle?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [f, setF] = useState<Record<string, string>>({
    name: defaultTitle ?? "", title: defaultTitle ?? "", device_id: "", url: "", download_url: "",
    source_repo_url: "", build_config_url: "", maintainer: "", maintainer_url: "", android_version: "",
    kind: "", framework: "magisk", artifact: "zip", requires_root: "1", description: "", notes: "", body: "",
    severity: "medium", brand: "", model: "", codename: "", soc: "", release_year: "", difficulty: "moderate", summary: "",
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  function validate(): string | null {
    const urlFields: [string, string][] = [];
    if (type === "rom") urlFields.push(["download_url", f.download_url], ["source_repo_url", f.source_repo_url], ["build_config_url", f.build_config_url]);
    if (type === "app" || type === "module") urlFields.push(["download_url", f.download_url], ["source_repo_url", f.source_repo_url]);
    if (type === "root_method") urlFields.push(["url", f.url]);
    if (type === "broken_link") urlFields.push(["url", f.url]);
    for (const [k, v] of urlFields) if (v && !isHttp(v)) return `${k.replace(/_/g, " ")} must be an http(s) URL`;
    if (type === "rom" && !isHttp(f.download_url)) return "A download URL is required for ROMs.";
    if (type === "rom" && (!isHttp(f.source_repo_url) || !isHttp(f.build_config_url)))
      return "Community ROMs REQUIRE public source + build config links (that the DB literally enforces).";
    if ((type === "app" || type === "module") && !isHttp(f.download_url)) return "A download link is required.";
    if ((type === "app" || type === "module") && !isHttp(f.source_repo_url)) return "A public source repo is required (provenance gate).";
    if (type === "new_device" && !f.brand.trim()) return "Brand is required.";
    if ((type === "correction" || type === "broken_link") && !f.body.trim()) return "Tell us what&rsquo;s wrong.";
    return null;
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = { notes: f.notes || undefined, from: fromHref || undefined };
    if (f.device_id) payload.device_id = f.device_id;
    if (type === "new_device") {
      Object.assign(payload, {
        brand: f.brand.trim(), name: f.name.trim(), model: f.model || undefined, codename: f.codename || undefined,
        soc: f.soc || undefined, release_year: f.release_year ? parseInt(f.release_year, 10) || undefined : undefined,
      });
    } else if (type === "rom") {
      Object.assign(payload, {
        name: f.name.trim(), download_url: f.download_url, source_repo_url: f.source_repo_url, build_config_url: f.build_config_url,
        android_version: f.android_version || undefined, official: false,
        maintainers: f.maintainer ? [{ name: f.maintainer, url: f.maintainer_url || undefined }] : [],
      });
    } else if (type === "app" || type === "module") {
      Object.assign(payload, {
        kind: type, name: f.name.trim(), download_url: f.download_url, source_repo_url: f.source_repo_url,
        description: f.description || undefined,
        ...(type === "module" ? { framework: f.framework, artifact: f.artifact, requires_root: f.requires_root === "1" } : {}),
      });
    } else if (type === "root_method") {
      Object.assign(payload, { name: f.name.trim(), url: f.url || undefined, difficulty: f.difficulty, summary: f.summary || undefined });
    } else {
      Object.assign(payload, { title: f.title.trim() || f.name.trim(), url: f.url || undefined, body: f.body.trim() });
    }
    return payload;
  }

  return (
    <form
      className="panel space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const v = validate();
        if (v) return toast.error(v);
        start(async () => {
          const r = await submitContribution(type as SubmissionType, buildPayload());
          if (!r.ok) { toast.error(r.error); return; }
          toast.success("Submitted — a moderator will review it");
          router.refresh();
          router.push("/submit");
        });
      }}
    >
      <h2 className="text-lg font-bold capitalize">{type.replace(/_/g, " ")}</h2>

      {/* device picker used by most types */}
      {type !== "new_device" && (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide muted">Device</label>
          <select className="select" value={f.device_id} onChange={(e) => set("device_id", e.target.value)} required={type !== "broken_link"}>
            <option value="">— pick the device this is about —</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.brand} {d.name}</option>)}
          </select>
        </div>
      )}

      {type === "new_device" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Brand * (e.g. Google)" value={f.brand} onChange={(e) => set("brand", e.target.value)} required />
            <input className="input" placeholder="Name * (e.g. Pixel 9 Pro)" value={f.name} onChange={(e) => set("name", e.target.value)} required />
            <input className="input" placeholder="Model (e.g. G8MN0)" value={f.model} onChange={(e) => set("model", e.target.value)} />
            <input className="input" placeholder="Codename (e.g. caiman)" value={f.codename} onChange={(e) => set("codename", e.target.value)} />
            <input className="input" placeholder="SoC (e.g. Tensor G4)" value={f.soc} onChange={(e) => set("soc", e.target.value)} />
            <input className="input" placeholder="Release year" value={f.release_year} onChange={(e) => set("release_year", e.target.value)} inputMode="numeric" />
          </div>
          <p className="text-xs muted">Moderators fill in variants (Verizon/Snapdragon/etc) and the rootability verdict on review.</p>
        </>
      )}

      {(type === "rom" || type === "app" || type === "module" || type === "root_method") && (
        <div className="grid grid-cols-1 gap-2">
          <input className="input" placeholder="Name *" value={f.name} onChange={(e) => set("name", e.target.value)} required />
          <input className="input" placeholder={type === "root_method" ? "Primary link (guide/thread/repo)" : "Download URL *"} value={f.download_url || f.url} onChange={(e) => (type === "root_method" ? set("url", e.target.value) : set("download_url", e.target.value))} required={type !== "root_method"} />
          {(type === "rom" || type === "app" || type === "module") && (
            <>
              <input className="input" placeholder="Public source repo * (https://github.com/…)" value={f.source_repo_url} onChange={(e) => set("source_repo_url", e.target.value)} required />
              {type === "rom" && <input className="input" placeholder="Build config * (manifest / build.yml link)" value={f.build_config_url} onChange={(e) => set("build_config_url", e.target.value)} required />}
            </>
          )}
          {type === "rom" && (
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Android version (e.g. 15)" value={f.android_version} onChange={(e) => set("android_version", e.target.value)} />
              <input className="input" placeholder="Maintainer name" value={f.maintainer} onChange={(e) => set("maintainer", e.target.value)} />
              <input className="input col-span-2" placeholder="Maintainer link (profile/repo)" value={f.maintainer_url} onChange={(e) => set("maintainer_url", e.target.value)} />
            </div>
          )}
          {type === "module" && (
            <div className="grid grid-cols-3 gap-2">
              <select className="select" value={f.framework} onChange={(e) => set("framework", e.target.value)}>
                {["magisk", "kernelsu", "apatch", "lsposed", "xposed", "vector", "other"].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <select className="select" value={f.artifact} onChange={(e) => set("artifact", e.target.value)}>
                <option value="zip">ZIP</option><option value="apk">APK</option><option value="other">other</option>
              </select>
              <select className="select" value={f.requires_root} onChange={(e) => set("requires_root", e.target.value)}>
                <option value="1">needs root</option><option value="0">no root needed</option>
              </select>
            </div>
          )}
          {(type === "app" || type === "module") && <input className="input" placeholder="One-line description" value={f.description} onChange={(e) => set("description", e.target.value)} />}
          {type === "root_method" && (
            <div className="grid grid-cols-2 gap-2">
              <select className="select" value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
                <option value="easy">Difficulty: Easy</option><option value="moderate">Moderate</option><option value="advanced">Advanced</option><option value="expert">Expert</option>
              </select>
              <input className="input" placeholder="One-line summary" value={f.summary} onChange={(e) => set("summary", e.target.value)} />
            </div>
          )}
        </div>
      )}

      {(type === "correction" || type === "broken_link" || type === "guide") && (
        <div className="grid grid-cols-1 gap-2">
          <input className="input" placeholder="Title *" value={f.title} onChange={(e) => set("title", e.target.value)} required />
          {type === "broken_link" && <input className="input" placeholder="The dead link" value={f.url} onChange={(e) => set("url", e.target.value)} required />}
          <textarea className="textarea" rows={4} placeholder={type === "guide" ? "Outline the guide — moderators build the block structure with you" : "What's wrong / what should it say?"} value={f.body} onChange={(e) => set("body", e.target.value)} required />
        </div>
      )}

      <textarea className="textarea" rows={2} placeholder="Extra context for the moderator (optional)" value={f.notes} onChange={(e) => set("notes", e.target.value)} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs muted">10 pending submissions per account cap — the queue stays honest.</p>
        <button className="btn btn-primary" disabled={pending}><Send size={14} /> Submit for review</button>
      </div>
    </form>
  );
}

export function WithdrawButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-ghost btn-sm"
      disabled={pending}
      onClick={() => start(async () => { const r = await withdrawSubmission(id); if (!r.ok) toast.error(r.error); else toast.success("Withdrawn"); })}
    >
      <X size={13} /> Withdraw
    </button>
  );
}
