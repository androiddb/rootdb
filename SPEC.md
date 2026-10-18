# RootDB — Product & Build Spec

> Source of truth, agreed 17 Oct 2026. Built per the skills in the Drive library
> (fullstack-dev · supabase · supabase-postgres-best-practices · senior-frontend ·
> vercel-react-best-practices · shadcn · deploy-to-vercel · karpathy-guidelines ·
> superpowers brainstorming → plan before code).

## 1. What it is

**RootDB is the centralised hub for Android rooting.** Search a phone → instantly see
**can it be rooted** and **what ROMs are available** for it. Public multi-tenant SaaS:
anyone can browse, anyone can sign up and contribute.

Core loop: `search → device page → root verdict + downloads → save device / contribute`.

Tagline-adjacent flavor (used sparingly): **“Your devices, your control.”**
No privacy preaching anywhere. Privacy is expressed through design, not copy.

## 2. Stack (chosen per your skills)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | senior-frontend + nextjs-official skills; server components, great Vercel fit |
| Styling | **Tailwind CSS v4 + shadcn/ui** | shadcn skill; component primitives for theme engine |
| Backend/data | **Supabase** (Postgres 17 + Auth + RLS) | supabase skills; RLS-first multi-tenant |
| Auth | **Supabase Auth: GitHub + Google + Apple OAuth** | your pick |
| Hosting/deploy | **Vercel** (preview first, prod after) | deploy-to-vercel skill |
| Repo | **github.com/androiddb/rootdb** | you'll paste a PAT; I create + push |
| Analytics | **Vercel Analytics + Speed Insights only** | cookieless, no personal data — the quiet privacy-by-default choice |

**Projects:** `RootDB Dev` = development · `RootDB` = production (env-var switch).
Both wiped clean on 17 Oct 2026 before build (all tables, views, functions,
sequences, auth users, storage objects/buckets, migration history).

## 3. Pages & features

### Public
- **`/` home** — hero + single search box (simple search, submits), trending devices,
  catalog stats. Search matches **marketing name, model, or codename** (“Pixel 7 Pro”,
  “cheetah”, “SM-S918B” all hit).
- **`/search?q=`** — results list **with filters**: brand, rootability verdict,
  has-ROMs, Android version.
- **`/device/[brand]/[model]`** — pretty URLs (`/device/google/pixel-7-pro`). Tab bar:
  - **Overview** — rootability verdict banner (Rootable / Partially / Not rootable /
    Unknown), **variant picker** — carrier/region/SoC variants each carry their own
    verdict (Verizon S23 = locked, international Exynos = rootable); every scoped
    list (ROMs, methods, questions, issues) can be variant-filtered. Bootloader
    status, key specs, warnings (Knox, warranty, anti-rollback), quick facts.
  - **Downloads** — ROMs grouped official/community (name, Android ver, status,
    download link, “reported working” count, last-confirmed), plus recoveries &
    tools (TWRP/OrangeFox, **kernels**, Magisk, stock firmware links) and any
    **apps / Magisk modules made for this device** (universal ones live in the
    global catalogs). Everything is provenance-gated (see §4a below).
  - **Questions** — community Q&A. Scoped: **device-general by default**; can be
    filed against a specific ROM, root method **or variant**; scope filter includes
    “all for this device”. Ask (signed in), answers, accepted answer, votes.
    Builds a searchable knowledge base.
  - **Issues** — user-filed problem reports with the **same scoping** (device-general
    default; per-ROM; per-root-method; **per-variant**; all). Lifecycle set by
    moderators (open → confirmed → fixed/wontfix/duplicate); old entries stay
    searchable (“does X work on Y” stays answered forever).

  **Hard rule:** no release announcements, no discussion threads, no forums.
  RootDB replaces XDA's *knowledge*, not its chaos — structured data only.
  - **Guides** — **interactive, block-based walkthroughs** (root, unlock, flash
    recovery, install ROM, unbrick). Blocks: `content` (markdown) · `question`
    (branches the flow — “Have you rooted your device?” → *No* unfolds the root
    tutorial inline) · `embed` (another guide) · `recommendation` (dynamic config —
    e.g. *recommended root method*: per-device recommendation where set, else
    fall back to the highest-weight global method, e.g. KernelSU Next).
    **Blocks are their own guides:** any *generic* (non-phone-specific) guide can
    be embedded in any other guide; **phone-specific guides can never be embedded
    cross-device** (enforced in DB). Everything goes **through the moderation
    queue before going live** — creation *and* edits, like all UGC on the site.
  - **Updates** — per-device timeline: new ROMs, new methods, verdict changes,
    “reported working” milestones.
- **`/updates`** — site-wide changelog/timeline (per-device on device pages).
- **`/modules`** — global catalog of **modules for every framework**: Magisk ·
  KernelSU · LSPosed · Xposed · Vector · … **Taxonomy rule: if it plugs into a
  framework it's a *module* — even when it's distributed as an APK** (LSPosed/
  Xposed modules). Modules carry a `framework` field + min-version; apps never
  do. Filterable by framework, version, device compatibility.
- **`/apps`** — global catalog of standalone **root-era apps** only (no framework
  plug-ins). Searchable + filterable (requires-root?, Android range).
- Both catalogs link out — we never host binaries.
- **`/legal/terms` · `/legal/privacy` · `/legal/dmca`** — **readable** plain-English:
  one-line summary per section, table of contents, no legalese walls. DMCA page =
  full takedown procedure, counter-notice, repeat-infringer policy, agent contact.
  (Action item: register a DMCA agent with the US Copyright Office for true
  safe-harbor — ~$6, I'll note it in the handoff.)

### Signed-in (OAuth ×3)
- **Save/track devices** → `/saved` list with **“updated” badge** when a saved device
  gains a ROM/method. No emails.
- **Submit everything** → `/submit`: new device, ROM, root method, correction, guide
  → one moderation queue.
- **“Reported working”** one-tap confirmations on ROMs/root methods (count + last
  confirmed date).
- **Ask questions, answer, vote. File issues.**
- **Theme vault** (below), persistence in profile.
- **`/settings`** — profile (username, avatar), theme picker, **privacy section done
  right**: analytics opt-out that's honest + zero-friction, **export my data**
  (full JSON), **delete my account** (real cascade, not a soft-disable). No dark
  patterns; privacy options are the most pleasant options.

### Admin (`/admin`, role-gated: user < moderator < **owner = you**)
- Dashboard w/ queue counts.
- **Moderation queue**: approve/reject submissions with note; approve merges into
  catalog (auto-creates device/ROM/method rows).
- **Devices CRUD** (incl. rootability, methods, specs, warnings) **+ ROMs CRUD**.
- Guides editor (markdown). Q&A/issue moderation (pin, accept, close, set status).
- User roles manager. Roles live in `profiles.role` — **never** user_metadata
  (supabase skill security rule).

## 4. Data model (public schema, RLS ON every table)

`profiles` (1:1 auth.users, role, username, avatar, theme, analytics_opt_out) ·
`devices` (brand, model, codename, slug, specs jsonb, release info) ·
`device_rootability` (verdict, bootloader_status, **recommended_method_id →
root_methods (per-device override, falls back to highest-weight global)**,
knox/other warnings, unlock_url/wait_hours/anti_rollback, notes) ·
`device_variants` (label, model_numbers[], **own verdict + bootloader override —
Verizon S23 ≠ international S23**, unlock_url, warnings) ·
`root_methods` (**device_id NULLABLE — null = universal method** (Magisk, KernelSU,
KernelSU Next), **variant_id NULLABLE — null = all variants**, **weight int =
global recommendation ranking**, difficulty, summary, body_md, requires, links,
play_integrity_notes, admin_curated) ·
`roms` (device, name, android_version, official bool, status, download_url, notes) ·
`tools` (device, kind: recovery/**kernel**/magisk/firmware/other, name, version, url) ·
`software` (kind: **app | module**, name, slug, author → linked account,
description, source_repo_url, download_url, artifact: zip|apk|other, version,
requires_root, **framework: magisk|kernelsu|lsposed|xposed|vector|other
(modules only)**, min_framework_version, android_range, status) ·
`software_devices` (software ↔ device compatibility tags) ·
`guides` (device_id **nullable — null = generic/embeddable**, kind, title,
difficulty, source: admin/community, published, moderated via submissions) ·
`guide_blocks` (guide, position, type: **content | question | embed | recommendation**,
content_md, config jsonb (question answers+branch targets / recommendation
subject+fallback / module refs), embed_guide_id → guides with **DB-enforced
rule: embed target must be generic (device_id null) or same device**) ·
`questions` + `answers` (device, **nullable rom_id + root_method_id scope**, accepted
flag, vote counts) ·
`issues` (device, **nullable rom_id + root_method_id scope**, severity, status,
resolution note) ·
`confirmations` (“reported working”: user, target rom/method/**software**, android
info) ·
`saved_devices` · `submissions` (type, payload jsonb, status, reviewer note) ·
`device_updates` (timeline feed, mostly system-generated on catalog changes) ·
`votes` (question/answer helpful).

RLS: public read on catalog; owners write their own rows; moderators/admins via
`profiles.role`; server-only service key in route handlers where needed.
Indexes on search fields (name/model/codename trigram), FKs, RLS predicates.

### 4a. Developer verification & provenance (uploads gate)

- **`linked_accounts`** — a user proves ownership of a **GitHub and/or GitLab**
  account via OAuth linking in `/settings` (read-only identity check).
- **Official ROM / maintainer uploads:** the uploader must (1) own the
  GitHub/GitLab account that (2) is listed as the official maintainer for that
  ROM on that device. Checked against public rosters where machine-readable
  (e.g. LineageOS wiki devices/API), otherwise admin-confirmed manually via the
  moderation queue. Success ⇒ **Verified Developer** badge + `official_verified`
  provenance on the entry.
- **Unofficial ROMs, recoveries, and kernels:** must publish **source
  repositories + build config** — recorded on the entry, enforced by moderation.
- **Apps & Magisk modules:** official uploads gated the same way (own the repo
  account); community link-submissions allowed but moderated, and must point at
  the project's real home (GitHub/release page), not reupload mirrors.
- Provenance is stored on every row: `official_verified` · `community` ·
  `link_submission`, plus `submitted_by`. Device/download pages render it as a
  visible badge.
- Anyone can still **submit links / corrections** for anything — provenance
  rules apply to *publishing as the dev*, not to librarians.

## 5. Theme system (“way too many themes”)

**Anonymous visitors:** simple ☀/🌙-style toggle flipping **Catppuccin Mocha ↔ Latte**
and **Nord Dark ↔ Light**. Default theme = **Catppuccin Mocha** (my call).
**Signed-in users:** the full vault below, saved to `profiles.theme`.

Mechanics: `data-theme` attribute + CSS custom properties (12+ color tokens, surface
levels, border style incl. bevels, radius scale, shadow style, font stack, texture/
pattern layer). Parody = tokens + border/radius/typography/density, not re-skinned
components. Pixel/display fonts vendored via fontsource (no CDN dependency).

**Vault (launch set — 30):**
- Core: Catppuccin (Mocha · Macchiato · Frappé · Latte) · Nord Dark · Nord Light ·
  Material 3 · Liquid Glass · Classic Apple Light · Classic Apple Dark
- Windows: WinUI (11) · Windows 10 Light · Windows 10 Dark · Windows 7 Aero ·
  Windows XP Luna · Windows 98 · Windows 95 “Hot Dog Stand” · MS-DOS (Norton blue)
- Boot/terminal: **GRUB** · **Limine** · Linux TTY (green phosphor) · Amber CRT
- *nix desktop: KDE Breeze Light · KDE Breeze Dark · Ubuntu Yaru
- Retro: Mac OS 9 Platinum · Amiga Workbench · Commodore 64 · BeOS · Game Boy DMG
- Apps/games: **Minecraft** · **Roblox** · **Discord** · Steam

## 6. Legal & privacy posture

- TOS / Privacy / DMCA in **plain readable English** (summaries + full text), linked
  in footer and at signup.
- DMCA: designated-agent contact, takedown + counter-notice flows, repeat-infringer
  clause. Submissions UI reminds: link out, don't host infringing files.
- Data collection: Vercel Analytics/Speed Insights only. No cookies beyond auth
  session, no fingerprinting, no ad tech. Settings make privacy the best UX.

## 7. Seed data (dev + prod)

~48 devices, illustrative-but-plausible, marked as community-curated:
Pixel 1→9 highlights, Nexus 5/6P/5X, Galaxy S8→S24 + Note highlights, OnePlus 1→12
highlights, Xiaomi/Redmi/POCO populars, Nothing Phone 1/2, Motorola G/Edge, Sony
Xperia, ASUS ROG/Zenfone, Fairphone 4/5, LG legacy bangers (V20, G8). Each: verdict,
bootloader status, 1–3 root methods, 1–4 ROMs, tools, warnings where real (Samsung
Knox, Xiaomi unlock wait, Verizon Pixel lock). A few seeded guides, sample Q&A +
issue rows so tabs never render empty.

## 7a. My calls (you passed on the pick — included in v1)

You skipped the “missing pieces” pick, so per the brainstorming skill these are
**my calls, as defaults**: searchable **aliases** (POCO F3 = Redmi K40 = Mi 11X) +
variant notes (Snapdragon/Exynos/carrier) · **broken-link reports** on every
download (a correction type that feeds the queue) · quiet **anti-abuse rails**
(new accounts' first submissions always reviewed; per-user pending caps) ·
**unlock metadata** on rootability (official unlock URL, wait hours, anti-rollback
warning) · **maintainer credit** rendered on device pages (“Officially maintained
by @dev”) · **Play Integrity/banking notes** field on root methods. All are
fields or small UI — nothing structural. Say the word and any of them comes out.

## 8. Build order

1. Repo scaffold (Next.js + TS + Tailwind v4 + shadcn/ui) + env config per skill
   checklists (typed env, `.env.example`, health route).
2. Supabase **Dev**: migration = schema + RLS + indexes → verify with queries
   (supabase skill: verify, don't assume) → seed.
3. Core: home + search (+filters) + device tabs (all six).
4. Auth (3 providers; buttons live immediately, wired as you supply OAuth creds),
   profiles, saved devices, confirmations.
5. Submissions + moderation queue + full admin.
6. Theme engine (anon switcher + vault) + settings incl. privacy section.
7. Legal pages, analytics, polish (loading/error/empty states, a11y, OG/meta).
8. `npm run build` clean → GitHub repo `androiddb/rootdb` (via your PAT) → Vercel
   project → env vars (Dev) → preview deploy → smoke-check routes → production
   exchange when you're ready.

## 9. What I need from you (collected as we go, none blocking today)

1. **GitHub PAT** (fine-grained, `administration`+`contents` on a new repo, or
   classic `repo`+`delete_repo` scoped to org androiddb) — when I push.
2. **OAuth app credentials**: GitHub OAuth App, Google Cloud OAuth client, Apple
   Services ID — I'll give you the exact callback URLs → sign-in screens go live.
3. Later: custom domain; DMCA agent registration; moderator usernames.
