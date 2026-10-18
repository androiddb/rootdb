import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "Privacy Policy" };

const PRIVACY = `# Privacy Policy

**Effective: October 17, 2026**

This policy describes exactly what RootDB collects, why, how it's stored, and the controls you have — including the two buttons that do what they say (export, delete).

## 1. What we collect

### Account data (only if you sign in)
- **OAuth identity**: the user id, email address and public profile info (name, avatar) provided by GitHub, Google or Apple. We never see your provider password.
- **Profile**: username, display name, theme preference, analytics opt-out flag.
- **Verified developer links**: the GitHub/Google/Apple accounts you connect to prove maintainer status.

### Content you create
- Saved devices, votes, confirmations, questions, answers, issues, submissions, guide blocks you author.

### Telemetry (opt-out at any time)
- **Vercel Analytics**: aggregate page-view and performance metrics collected at the edge. No cookies, no fingerprinting, no cross-site tracking, nothing sold or shared. Disable it in **Settings → Analytics** — the change applies instantly, including to data collection from that moment on.

### Logs
- Short-lived infrastructure logs (IP address, user agent, request path) retained by Vercel and Supabase for operation and abuse prevention, per their respective retention policies.

## 2. What we deliberately don't collect

- No ad-tech trackers, no third-party advertising SDKs, no data broker enrichment.
- No installation telemetry. RootDB never sees your phone, your IMEI, or what's on it.
- No messaging between users — so no private-message contents exist to store.

## 3. How it's used

- Run the index: verdicts, catalogs, Q&A, issue triage, moderation.
- Attribute public contributions (username shown beside what you post).
- Detect abuse (automation, spam, provenance fraud).

We do **not** sell or share personal data with advertisers. Period.

## 4. Where it's stored

- **Supabase** (Postgres, row-level security enforced on every table) — account and content data.
- **Vercel** — application hosting and analytics.

Both process data in the United States and/or their standard regions under their DPAs; Surfing the site from AU/EU/UK doesn't change what we collect — it grants you the rights in §6.

## 5. Retention & deletion

- Content (questions, answers, issues, guide blocks) is retained while it's useful to the index, and survives account deletion **anonymized** (attributed to "deleted account") so community threads keep making sense.
- Profile, saved devices, votes, confirmations and submissions are deleted on account deletion.
- The **Settings → Danger zone → Delete my account** button performs real deletion: it removes your auth identity and personal rows server-side. Not a soft-delete, not a delay-queue.

## 6. Your controls

| Control | Where | What it does |
| --- | --- | --- |
| Analytics opt-out | Settings | Stops Vercel Analytics for your account immediately |
| Export | Settings | Downloads a JSON of everything we hold about you |
| Delete | Settings | Destroys the account and personal data (§5) |
| Correct | Settings | Edit username/display name; ask us for anything else |

If you're in the EU/UK (GDPR) or California (CPRA) or Australia (APP), the export + delete controls satisfy *access* and *erasure* requests; for *portability* the export is machine-readable JSON. To object to processing or lodge a complaint, contact us (below) first so we can fix it.

## 7. Children

The service is not directed at children under 13 and we do not knowingly collect their data.

## 8. Changes

Material changes are announced on the site 30 days before taking effect. The effective date at the top says which version you're reading.

## Contact

privacy@androiddb.dev — or the public issue tracker.`;

export default function PrivacyPage() {
  return <Markdown>{PRIVACY}</Markdown>;
}
