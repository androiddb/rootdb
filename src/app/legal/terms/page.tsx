import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "Terms of Service" };

const TERMS = `# Terms of Service

**Effective: October 17, 2026** — RootDB ("we", "the service") operated under the androiddb GitHub organization.

## 1. What RootDB is

RootDB is a public index of device rootability, ROMs, root methods, apps, modules, guides, community Q&A and known issues. We **link out** to content hosted by third parties; we do **not** host ROM, recovery, kernel or tool binaries.

## 2. Your account

- Accounts are created via OAuth (GitHub, Google, Apple). You must be at least 13 years old.
- You are responsible for activity under your account.
- One username per person; keep it civil in public fields.

## 3. Contributions

When you submit content (device data, links, questions, answers, issues, guide text):

- You represent that you have the right to submit it.
- You grant RootDB a non-exclusive, worldwide, royalty-free license to store, display and distribute it in connection with the index.
- Catalog facts (names, versions, links) are treated as public information.

**Provenance gate:** unofficial ROMs, recoveries and kernels must include links to a public source repository and build configuration; the database rejects them otherwise. Official uploads require a verified maintainer account.

## 4. Acceptable use

You agree not to:

- Post malware, warez, or links to pirated commercial software.
- Scrape the service at abusive rates or attempt to bypass access controls.
- Impersonate device maintainers or misrepresent the provenance of a build.
- Submit content that infringes intellectual-property rights (see our DMCA & IP Policy).
- Use the platform for release announcement spam, SEO bait or unmoderated forum-style threads — that's what XDA does; RootDB deliberately does not.

## 5. Flashed at your own risk

Rootability verdicts, guides and catalog entries are informational, community-verified data points — **not** professional advice and **not** a promise. Flashing modified firmware can brick a device and may void warranties or trigger security features (e.g. Knox e-fuses, anti-rollback). You act at your own risk. We are not liable for damaged devices, lost data or locked bootloaders.

## 6. Moderation and enforcement

Moderators may edit, unpublish or remove content, and suspend accounts, for violations of these terms or to protect the integrity of the index. Lifecycle decisions (confirming/fixing issues, accepting answers, publishing guides) are judgment calls by the moderation team.

## 7. Service, warranty, liability

The service is provided "as is" without warranty of any kind. To the maximum extent permitted by law, we disclaim liability for indirect or consequential damages, and our aggregate liability is limited to AUD $100. Nothing in this section limits rights you have under Australian Consumer Law.

## 8. Changes

We may revise these terms with 30 days' notice for material changes, by updating this page. Continued use after the effective date constitutes acceptance.

## 9. Governing law

These terms are governed by the laws of New South Wales, Australia.

## Contact

legal@androiddb.dev — or file an issue on the public repository.`;

export default function TermsPage() {
  return <Markdown>{TERMS}</Markdown>;
}
