# Monetization position and checkpoint

The purpose of this file is to stop the "stay free for now" decision from
quietly becoming "stay free forever because nobody ever looked again." It
records what was decided, what number would change it, and what would end it.

Update the log at the bottom rather than rewriting the decisions above.

## Baseline

- **Analytics started:** 2026-08-03 (Cloudflare Web Analytics). There is no
  traffic data before this date — the site ran unmeasured until then, so any
  "growth" comparison against earlier months is meaningless.
- **Domain:** www.batchqrcodes.com, live on Cloudflare Pages.
- **Content at baseline:** homepage plus 18 guide pages, 23 URLs in the sitemap.
- **Revenue at baseline:** zero, by choice. No ads, no paid tier.

## Position

**The core generator stays free, permanently.** Not as a growth tactic — it is
simultaneously the SEO asset and the entire trust differentiator. The incumbent
QR services sell dynamic codes that route through their domain, which is exactly
why printed codes die when a subscription lapses. "Static, yours, nothing can
switch it off" is the pitch. Putting the codes behind a paywall would destroy the
thing being sold.

Therefore: **any paid tier gates workflow depth around the generator, never the
codes themselves.** Saved presets, label-stock layouts, an offline build,
paperwork. Never a cap on how many codes you get.

**No advertising.** Considered and rejected. AdSense will not pay meaningfully
below serious volume, ad scripts damage Core Web Vitals on a page where the
interaction *is* the product, and a third-party ad network reading the same
browser directly contradicts the privacy claim the site is built on. If this is
ever revisited, note that the site copy and the privacy policy were deliberately
rewritten in August 2026 to remove pre-emptive AdSense claims — they described
advertising that did not exist. Re-adding ads means re-adding that copy *at the
same time*, not before.

**One-time payment is preferred over subscription** if anything is ever charged
for. "Pay once, nothing expires" is coherent with the rest of the positioning;
a monthly fee is precisely the thing the site criticises competitors for.

## What is being measured

| Signal | Where | Why |
| --- | --- | --- |
| Organic sessions, total and by page | Cloudflare Web Analytics | Is anything ranking at all, and which guides pull |
| Referrers / search sources | Cloudflare Web Analytics | Distinguishes real organic from direct and referral |
| `/pro.html` pageviews | Cloudflare Web Analytics | CTA click-through — the page is noindex, so essentially every visit came from an internal CTA |
| `/pro.html` form submissions | Form provider | Actual stated demand, the only signal that means anything about willingness to pay |

`/pro.html` is deliberately `noindex` and deliberately absent from
`sitemap.xml`. It is measurement apparatus, not content. Do not "fix" this by
adding it to the sitemap — a thin page about unbuilt features would only dilute
the quality signal of the guide library.

Cloudflare Web Analytics has no custom events, which is why the demand signal is
a *page* rather than a button: pageviews are the event.

## Revisit trigger

Reassess monetization when **either**:

- organic sessions reach **≥ 1,000/month**, or
- `/pro.html` form submissions reach **≥ 25**

whichever happens first.

## Hard checkpoint: 2026-10-26

Twelve weeks from baseline. Review then **even if neither trigger fired** —
especially if neither fired, since that is itself the answer.

At the checkpoint, re-run `/go-no-go` with the real numbers rather than
re-deciding from intuition.

## Kill rule

If at the 2026-10-26 checkpoint organic is **under ~200 sessions/month** and form
submissions are in **single digits**, then the niche is not paying for further
feature work. In that case:

- Build none of the four Pro ideas.
- Either write more guide content (the cheapest remaining lever, and the one
  that compounds) or stop investing in the site entirely.
- Do not respond by adding ads. Low traffic is precisely the condition under
  which ad revenue is worthless and the reputational cost is highest.

## Realistic ceiling — read this before setting expectations

**"QR code generator" is unwinnable.** Canva, Adobe, and a dozen funded SaaS
competitors own that SERP, and no amount of on-page work changes it.

The reachable tail is what the guides already target: *bulk QR codes from CSV*,
*name QR files from a spreadsheet column*, *print a sheet of identical QR codes*,
*QR codes for asset labels*. Low volume, high intent, and worth far more per
visitor than the head term. A few hundred sessions a month from those terms is a
success, not a disappointment — judge results against that, not against head-term
volume.

## The four Pro candidates

Listed on `/pro.html`. Scoped deliberately for low ongoing maintenance:

| Idea | Build cost | Ongoing cost | Note |
| --- | --- | --- | --- |
| Saved presets | Low | ~None | `localStorage` only; no backend, no account |
| Print-ready label sheets | Medium | ~None | PDF generation + a label-SKU dimension table |
| Offline build | Low | ~None | **A single self-contained HTML file, not Electron.** Electron means three OS builds, code signing, notarization and auto-update — exactly the maintenance this constraint exists to avoid |
| Commercial licence | ~None | Manual per sale | No code at all; the cost is invoicing by hand |

These are hypotheses being tested, not commitments.

## Log

- **2026-08-03** — Baseline set. Cloudflare Web Analytics enabled; false AdSense
  and Google Analytics claims removed from `index.html`, `about.html`,
  `privacy.html`, `terms.html` and `contact.html`; `privacy.html` corrected from
  GitHub Pages to Cloudflare Pages; `/pro.html` added as the demand signal.
