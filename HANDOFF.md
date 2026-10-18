# RootDB — Handoff (session → session)
> Everything a new Agent Mode session needs to continue without losing state. Written 2026-10-18.

## What this is
**RootDB** — public multi-tenant SaaS (Next.js App Router + TS strict + Tailwind v4 + shadcn/ui + Supabase + Vercel).
Search any Android phone (name / model / codename / alias / **variant model number**) → rootability verdict, variants, ROM catalog, Q&A, issues, guides. Mission: replace XDA as the reference hub.

- Repo of record (to be created): **github.com/androiddb/rootdb**
- Temp deploy domain: **rootdb.kleb.win** (already attached to the Vercel project; DNS already set by owner)
- Canonical URL must stay env-driven: `NEXT_PUBLIC_SITE_URL` with code default `https://rootdb.kleb.win`
- Stack versions: Next 16 (App Router), React 19, TS strict, @supabase/* SSR pattern, Postgres 17 w/ strict RLS

Directories: `src/` app code · `db/migrations/0001–0004` (+ seeds 0002a/b/c) · `scripts/build_seed.py` regenerates seeds · `tests/variant-match.corpus.mjs` · `SPEC.md` = agreed product spec · `README.md`, `AGENTS.md`

## Infra (already provisioned)
- Supabase org **RootDB** `sjaurgyadwiqsthkmzkz`
  - **Dev** `hrrbvmywokxopwvlxlcx` — migrations 0001–0003 applied + seeds + 46 device_variants (46/46 with model_numbers); variant-search page works. Publishable key: `sb_publishable_76RYeRTMAXxr3zFAgAd9aA_fjsgqSem`
  - **Prod** `mlihiqzlpauedskswhiu` — needs: enum purge, then 0001→0002a,b,c→0003→0004 → seeds (run local `npm run db:apply` pattern or via Supabase connector `create_migration`/`execute_query`)
- Vercel project **rootdb** (team `klebb`, id `prj_6tfJDEWMmPugl6evwDECzRIbRZNp`)
  - Env wiring DONE: preview → Dev Supabase (`hrrbvmywokxopwvlxlcx`), production → Prod Supabase, `NEXT_PUBLIC_ENV=test` (preview)
  - Domains attached & verified: **rootdb.kleb.win** (temp), + auto aliases
  - **Still GitLab-linked** (`gitlab.com/rootdb/rootdb`, branch main) → must be relinked to GitHub `androiddb/rootdb` once created (`update_project`, `link` params — see "the deploy command sequence" below)
- Owner's Google Drive holds the creds file **`Read then delete.txt`** (GitHub PAT for `androiddb` org) → read → use → `delete_file` after the push completes

## Product invariants (do not regress)
- **Variants are first-class and differentiated by MODEL NUMBER.** Verizon S23 ≠ stock S23: per-variant rootability/bootloader verdict; catalog rows variant-scoped (`variant_id` null = all variants); per-variant chips everywhere show `label · MODEL# +n` in mono.
- Shared matcher: `src/lib/variant-match.ts` (rules R1 label-prefix, R2 label-word-token, R3 exact model# ≥5 chars, R4 near-exact ≥7 chars). NO catch-all; owner shorthand (`sms911`, `s911u`) deliberately misses. Frozen corpus `tests/variant-match.corpus.mjs` = **54/54 PASS**. Search page + device page both import it (single source of truth).
- Q&A = community w/ accepted answers; Issues = moderator lifecycle, searchable forever; both attach device-general / per-ROM / per-root-method / per-variant + "all" filter; NO release announcements/forums.
- Provenance gate (SPEC §4a): official uploads need maintainer verification (Verified Developer badge); unofficial ROM/recovery/kernel REQUIRE public source repos + build config (DB check); community links moderated.
- Taxonomy: plugs-into-framework ⇒ **module** (`framework` enum), even as APK (LSPosed/Xposed/Vector); apps never carry framework. /apps + /modules global catalogs, link-out only.
- Guides = interactive block system (content-md | question-branching | embed | recommendation-dynamic), moderation-before-live; generic blocks embeddable anywhere, device-specific NOT cross-device embeddable.
- Auth = GitHub + Google + Apple OAuth ONLY (`@supabase/ssr`; **deferred** for the non-prod test — owner wires OAuth later on own box).
- Themes: anon dark/light, default Catppuccin Mocha; signed-in = 30-theme vault persisted to profile.
- Privacy: no messaging; analytics opt-out + JSON export + real deletion (`0003_account_delete.sql`); still collects Vercel Analytics.
- Legal pages: /legal/{terms,privacy,dmca} mandatory, DMCA detailed.
- Search UX: front page simple; /search filters (brand, verdict, has-ROMs, Android ver); variant model-number searches MUST return device + matched-variant badge + variant-scoped verdict on card + `?variant=` deep link.

## Build & verify (workspace machine)
```bash
cd rootdb && npm install --no-audit --no-fund   # ALWAYS first — never bare `npx tsc` (installs bogus tsc@2.0.4)
npx tsc --noEmit                                 # must be silent
node tests/variant-match.corpus.mjs              # → 54/54 PASS
npx next build                                   # → all # dynamic routes OK
```
Live probe (dev preview): `nohup npx next dev -H 0.0.0.0 -p 3000 >/tmp/next-dev.log 2>&1 &` then
`curl -s localhost:3000/search?q=SM-S911U | grep -c -E 'Matched a variant|Not rootable|your model'`

## The deploy command sequence (first session where connectors are healthy)
1. `list_connector_tools("google_drive")` → `read_file_text` on `Read then delete.txt` → capture PAT in-memory. **Do not echo it.**
2. PAT is for org `androiddb`: create repo `androiddb/rootdb` (private OK for now).
3. `git` push `/home/user/rootdb` → `androiddb/rootdb` main (workspace machine has git; PAT as http basic user, blank pass URL: `https://x-access-token:PAT@github.com/androiddb/rootdb.git`).
4. `list_connector_tools("vercel")` → `update_project` id `rootdb`: `{link:{type:"github", org:"androiddb", repo:"rootdb"}, productionBranch:"main"}` (drop old GitLab link — same call replaces).
5. `create_env_var` NEXT_PUBLIC_SITE_URL=`https://rootdb.kleb.win` (preview+production, plain, not secret) — idempotent.
6. (Optional now) redeploy: `create_deployment` git source main → wait READY via `get_deployment`; verify https://rootdb.kleb.win serves the new app; run `/search?q=SM-S911U` probe against it.
7. `google_drive` `delete_file` on `Read then delete.txt`, then confirm with `list_files query trashed=false`.
8. OAuth: owner fixes later (Google/GitHub/Apple clients → Supabase Auth providers; redirect `https://hrrbvmywokxopwvlxlcx.supabase.co/auth/v1/callback` (dev) and prod equivalent; Site URL per env).
9. Prod go-live later: purge enums on prod → apply 0001–0004 + seeds to prod project → env NEXT_PUBLIC_ENV=production already set.

## Known pitfalls (learned the expensive way)
- **Connector tool glitch workaround**: call `list_connector_tools` FIRST in the reply, then call connector tools as `vercel__x` / `google_drive__x` with `input` object param. `psql` is NOT on the box — Supabase writes go through the Supabase connector (`execute_query` / `create_migration`) after `list_connector_tools("supabase")`.
- **0004 silent-partial-apply** already hit Dev once (marker without function change). Verify by behavior: REST `devices?search_text=ilike.*sms911u*` should hit S23. The app does NOT depend on this anymore (matcher sweeps `device_variants` directly), but re-apply via a NEW migration name before prod reuse.
- Don't trust a migration by marker row — always probe behavior.
- "SM-S911U" appearing in search HTML is suggestion JSON, not proof of a card — grep for `Galaxy`/`Matched a variant`.
- Dev server processes local files don't survive turn boundaries (re-run `npx next dev` before curl probes); workspace files DO persist.
- `edit_file` needs exact-unique old_text; for multi-occurring strings use python anchor edits.
- Skills-in-Drive consulted per SKILLS mandate; `SPEC.md` is binding for any open product question. If the user reverse-decides anything, update `SPEC.md` FIRST, then code.

## Owner prefs (consequential)
- Direct, no-bloat answers; the owner corrects course bluntly — accept corrections, no defensiveness.
- Privacy-paranoid by design (duck.com aliases). Never dump secrets into chat/logs.
- Owner may batch messages after net hiccups; treat repeated lines as one instruction.