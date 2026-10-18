import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "DMCA & IP Policy" };

const DMCA = `# DMCA & Intellectual Property Policy

**Effective: October 17, 2026**

RootDB respects the intellectual property of device makers, ROM maintainers, kernel developers and everyone else whose work the index *describes and links to*. This page is deliberately detailed so a takedown or its rebuttal lands with everything we need to act on in one pass.

## 1. What RootDB does — and doesn't — host

- **Hosted by us**: text the community writes — device descriptions, rootability notes, questions, answers, issue reports, guide prose, and username/avatar material.
- **Not hosted by us**: ROM images, firmware, recoveries, kernels, tools, APKs and module artifacts. Those live on their maintainers' servers or mirrors; RootDB catalog entries link out.
- Being an index changes what a takedown can reach: we can remove or correct **catalog entries and links**, and remove **hosted text** — we cannot delete a file we never hosted. If your complaint is about the binary itself, it must also go to the actual host; we'll happily remove the index entry in parallel.

## 2. Submitting a DMCA takedown notice

Send a notice containing **all** of the following (17 U.S.C. §512(c)(3)):

1. Your name, address, phone and email.
2. Identification of the copyrighted work claimed to be infringed (specific files, repos, releases — "my ROM" is not identifiable; "PixelExperience v15.0 plus edition for panther, release 20260315" is).
3. The exact URL(s) on RootDB of the material you want removed, and whether you seek removal of the index entry only or also hosted text.
4. A statement that you have a good-faith belief the use is not authorized by the copyright owner, its agent, or the law.
5. A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on their behalf.
6. Your physical or electronic signature.

**Where:** legal@androiddb.dev with subject "DMCA", or the postal address listed in the repository's LEGAL.md.

**Timing:** we process complete notices within **5 business days**. Incomplete notices get one reply asking for the missing element; 14 days without completion closes the ticket.

## 3. What we do when a valid notice arrives

- Remove or disable the identified index entries/links and/or hosted text.
- Notify the submitter whose content was affected, with a copy of the notice.
- Log the notice against repeat-offender counting.

## 4. Counter-notification

If your material was removed and you believe that's a mistake (you own it, you have a license, fair use, or the claimant isn't who they say they are), send a counter-notification with:

1. Your name, address, phone and email.
2. The material that was removed and where it appeared on RootDB before removal.
3. A statement under penalty of perjury that you have a good-faith belief the material was removed due to mistake or misidentification.
4. A statement consenting to the jurisdiction of your local federal district court (or, if outside the U.S., the U.S. District Court for the Northern District of California) and that you'll accept service of process from the original complainant.
5. Your signature.

On a valid counter-notice we forward it to the complainant and may restore the material **10–14 business days** later unless the complainant notifies us they've filed a court action.

## 5. Maintainers & the provenance gate

Some specifics because phone modding has recurring IP flashpoints:

- **Proprietary blobs** (e.g. vendor firmware images) may only be *linked to*, and only where the vendor's own distribution permits. Mirror hosting of full proprietary firmware is outside RootDB's scope precisely so we can stay a clean index.
- **Modifications of a maintainer's work**: catalog entries for unofficial ports carry the public-source requirement. If your work was ported without the license-required attribution, tell us — that's a fast-path correction, no full DMCA needed; the entry's source links get fixed or the entry comes down.
- **Trademarks** (project names like "LineageOS"): index entries may reference them nominatively. Entries that imply official endorsement without it get corrected or archived.

## 6. Repeat offenders

Submitters whose content is the subject of **two** valid takedown notices get their contribution privileges suspended; a third results in account termination. Counter-notified restorations don't count toward that total.

## 7. Misuse

Filing a knowingly false claim or counter-claim exposes you to liability (§512(f)). Don't use the DMCA channel for disputes about correctness of verdicts — that's a moderation issue and goes through the normal contribution queue.

## Contact

legal@androiddb.dev — subject prefix "DMCA" so it hits the right queue.`;

export default function DmcaPage() {
  return <Markdown>{DMCA}</Markdown>;
}
