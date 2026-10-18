// RootDB domain types — mirrored from the live Supabase schema (migrations 0001+).
// Keep these exact column-for-column; pages depend on PostgREST returning these shapes.

export type Verdict = "rootable" | "partially" | "not_rootable" | "unknown";
export type Bootloader = "official" | "limited" | "locked" | "unknown";
export type Difficulty = "easy" | "moderate" | "advanced" | "expert";
export type CatalogStatus = "active" | "discontinued" | "archived" | "unknown";
export type Provenance = "official_verified" | "community" | "link_submission";
export type SoftwareKind = "app" | "module";
export type ArtifactType = "zip" | "apk" | "other";
export type ModuleFramework = "magisk" | "kernelsu" | "apatch" | "lsposed" | "xposed" | "vector" | "other";
export type ProfileRole = "user" | "moderator" | "admin";
export type QuestionStatus = "open" | "answered" | "solved" | "closed";
export type IssueStatus = "open" | "confirmed" | "fixed" | "wontfix" | "duplicate";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type GuideKind = "root" | "unlock_bootloader" | "flash_recovery" | "install_rom" | "unbrick" | "other";
export type GuideBlockType = "content" | "question" | "embed" | "recommendation";
export type SubmissionType = "new_device" | "rom" | "root_method" | "app" | "module" | "guide" | "correction" | "broken_link";
export type SubmissionStatus = "pending" | "approved" | "rejected" | "withdrawn";
export type UpdateKind = "device_added" | "rom_added" | "rom_updated" | "method_added" | "software_added" | "guide_added" | "verdict_changed" | "confirmed_milestone";

export const VERDICT_META: Record<Verdict, { label: string; tone: "good" | "warn" | "bad" | "muted"; blurb: string }> = {
  rootable: { label: "Rootable", tone: "good", blurb: "This device can be rooted with documented methods." },
  partially: { label: "Partially rootable", tone: "warn", blurb: "Rooting is possible with limitations or extra risk — read the notes." },
  not_rootable: { label: "Not rootable", tone: "bad", blurb: "No known working root for this device/variant." },
  unknown: { label: "Verdict unknown", tone: "muted", blurb: "Not enough verified data to call it yet." },
};

export const BOOTLOADER_META: Record<Bootloader, { label: string; tone: "good" | "warn" | "bad" | "muted" }> = {
  official: { label: "Officially unlockable", tone: "good" },
  limited: { label: "Unlockable with limits", tone: "warn" },
  locked: { label: "Bootloader locked", tone: "bad" },
  unknown: { label: "Bootloader unknown", tone: "muted" },
};

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  is_verified_dev: boolean;
  theme: string;
  analytics_opt_out: boolean;
}

export interface Device {
  id: string;
  slug: string;
  brand: string;
  name: string;
  model: string | null;
  codename: string | null;
  aliases: string[];
  release_year: number | null;
  android_versions: string[];
  soc: string | null;
  ram_options: string[] | null;
  specs: Record<string, unknown>;
  variant_notes: string | null;
  popularity: number;
  search_text?: string | null;
  created_at?: string;
}

export interface DeviceRootability {
  device_id: string;
  verdict: Verdict;
  bootloader: Bootloader;
  recommended_method_id: string | null;
  unlock_url: string | null;
  unlock_wait_hours: number | null;
  anti_rollback: boolean;
  warnings: string[];
  notes: string | null;
  updated_at: string;
}

export interface DeviceVariant {
  id: string;
  device_id: string;
  label: string;
  model_numbers: string[];
  verdict: Verdict | null;
  bootloader: Bootloader | null;
  bootloader_notes: string | null;
  unlock_url: string | null;
  warnings: string[];
  sort_order: number;
}

export interface Rom {
  id: string;
  device_id: string;
  variant_id: string | null;
  name: string;
  android_version: string | null;
  official: boolean;
  status: CatalogStatus;
  download_url: string;
  notes: string | null;
  maintainers: { name: string; url?: string }[];
  provenance: Provenance;
  source_repo_url: string | null;
  build_config_url: string | null;
  confirmed_count: number;
  last_confirmed_at: string | null;
  updated_at: string;
}

export interface RootMethod {
  id: string;
  device_id: string | null;
  variant_id: string | null;
  name: string;
  weight: number;
  difficulty: Difficulty;
  summary: string | null;
  body_md: string | null;
  requires: string[];
  links: { label: string; url: string }[];
  play_integrity_notes: string | null;
  admin_curated: boolean;
  provenance: Provenance;
  confirmed_count: number;
  last_confirmed_at: string | null;
  updated_at: string;
}

export interface Tool {
  id: string;
  device_id: string;
  variant_id: string | null;
  kind: string; // recovery | kernel | utility | edl | sp_flash | ...
  name: string;
  version: string | null;
  url: string;
  notes: string | null;
  provenance: Provenance;
  created_at?: string;
}

export interface Software {
  id: string;
  kind: SoftwareKind;
  framework: ModuleFramework | null;
  artifact: ArtifactType;
  name: string;
  slug: string;
  description: string | null;
  author_name: string | null;
  author_profile: string | null;
  source_repo_url: string | null;
  download_url: string;
  version: string | null;
  requires_root: boolean;
  min_framework_version: string | null;
  android_range: string | null;
  status: CatalogStatus;
  provenance: Provenance;
  confirmed_count: number;
  last_confirmed_at: string | null;
  updated_at: string;
}

export interface Guide {
  id: string;
  device_id: string | null;
  kind: GuideKind;
  title: string;
  summary: string | null;
  difficulty: Difficulty;
  source: "admin" | "community";
  author_id: string | null;
  published: boolean;
  created_at: string;
}

export interface GuideBlock {
  id: string;
  guide_id: string;
  position: number;
  block_type: GuideBlockType;
  content_md: string | null;
  config: {
    // question blocks
    answers?: { id: string; label: string; goto: string | number }[];
    // embed blocks
    title?: string;
    // recommendation blocks
    recommend?: "root_method" | "rom" | "app" | "module";
    limit?: number;
  };
  embed_guide_id: string | null;
}

export interface Question {
  id: string;
  device_id: string;
  rom_id: string | null;
  root_method_id: string | null;
  variant_id: string | null;
  author_id: string;
  title: string;
  body_md: string | null;
  status: QuestionStatus;
  upvotes: number;
  created_at: string;
  answers?: Answer[];
  author?: Pick<Profile, "username" | "display_name" | "role" | "is_verified_dev"> | null;
}

export interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  body_md: string;
  is_accepted: boolean;
  upvotes: number;
  created_at: string;
  author?: Pick<Profile, "username" | "display_name" | "role" | "is_verified_dev"> | null;
}

export interface Issue {
  id: string;
  device_id: string;
  rom_id: string | null;
  root_method_id: string | null;
  variant_id: string | null;
  author_id: string;
  title: string;
  body_md: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  resolution_note: string | null;
  upvotes: number;
  created_at: string;
  author?: Pick<Profile, "username" | "display_name" | "role" | "is_verified_dev"> | null;
}

export interface Submission {
  id: string;
  user_id: string;
  type: SubmissionType;
  payload: Record<string, unknown>;
  status: SubmissionStatus;
  reviewer_note: string | null;
  created_at: string;
}

export interface DeviceUpdate {
  id: string;
  device_id: string | null;
  software_id: string | null;
  kind: UpdateKind;
  title: string;
  body: string | null;
  created_at: string;
}

export const UPDATE_KIND_LABEL: Record<UpdateKind, string> = {
  device_added: "Device added",
  rom_added: "ROM listed",
  rom_updated: "ROM updated",
  method_added: "Root method listed",
  software_added: "App/module listed",
  guide_added: "Guide published",
  verdict_changed: "Verdict changed",
  confirmed_milestone: "Confirmed ✓",
};

/** slug like "google-pixel-7-pro" -> /device/google/pixel-7-pro (brand = prefix to first dash) */
export function deviceHref(d: { slug: string }) {
  const [brand, ...rest] = d.slug.split("-");
  return `/device/${brand}/${rest.join("-")}`;
}

/** Inverse of deviceHref: brand+model path params -> slug */
export function slugFromParams(brand: string, model: string) {
  return `${brand}-${model}`;
}
