# Deployment Guide

This guide explains how to deploy the QR Code Generator to Cloudflare Pages
at **www.batchqrcodes.com**.

## Custom domain setup (www.batchqrcodes.com)

`www` is the canonical domain — every absolute URL in the site (canonical
tags, `sitemap.xml`, `robots.txt`, Open Graph tags, JSON-LD) points there.
**Do not switch the canonical domain to the apex (`batchqrcodes.com`)
without also changing every one of those other files** — a mismatch
between what's configured as the custom domain and what those files claim
can leave crawlers (including Google Search Console) hitting a certificate
or redirect mismatch instead of a page. That's what happened the last time
this drifted, back on GitHub Pages.

### Adding the domain in Cloudflare

1. In the Cloudflare dashboard, add `batchqrcodes.com` as a site (this
   imports the zone so Cloudflare can manage its DNS).
2. In the Cloudflare Pages project's **Custom domains** settings, add
   `www.batchqrcodes.com` as the production domain, and configure the apex
   `batchqrcodes.com` to redirect to it — matching the canonical-domain
   requirement above.
3. Wait for the HTTPS certificate to issue. This can take a while after DNS
   propagates — check back rather than re-saving the custom domain field
   repeatedly, since each save restarts provisioning.

### Email forwarding

The site publishes `contact@batchqrcodes.com`. Once the domain's
nameservers point at Cloudflare, use **Cloudflare Email Routing** (free) to
forward that address to the real inbox — set it up and send a test email
*before* cutting DNS over, so forwarding is proven working ahead of time
rather than discovered broken after.

## Analytics and Search Console

The site carries **no advertising and sets no cookies**. That is a deliberate
position, not a gap waiting to be filled — see [MONETIZATION.md](MONETIZATION.md)
before adding either. Note in particular that the public copy and the privacy
policy were rewritten in August 2026 to *remove* pre-emptive AdSense claims that
described advertising the site never actually ran; re-introducing ads means
re-introducing that copy at the same time, not before.

### Cloudflare Web Analytics

Enabled through the dashboard, so **no repo change is required** and all 24 HTML
pages are covered without a script tag to keep in sync:

1. Cloudflare dashboard → the Pages project → **Analytics → Web Analytics** →
   enable. Cloudflare injects the beacon automatically into pages served through
   Pages, including the custom domain.
2. Confirm it is live by loading the site and looking for a request to
   `static.cloudflareinsights.com` in the browser's network tab.

It is cookieless and sets no persistent identifier, so **no consent banner or CMP
is needed** in the EEA/UK — and the privacy policy says exactly that, so keep the
two in step if the analytics provider ever changes.

The tradeoff: Cloudflare Web Analytics records pageviews only, with no custom
events. That is why `/pro.html` is a page rather than a button — visits to it
*are* the click-through metric.

If auto-injection is ever turned off, the fallback is to paste the beacon
`<script>` before `</body>` in every HTML file under `public/` plus the root
`index.html`. Prefer auto-injection; 24 hand-synced copies will drift.

### Search Console and Bing

Verify the domain in Google Search Console and Bing Webmaster Tools, and submit
`https://www.batchqrcodes.com/sitemap.xml` to both.

`/pro.html` should **not** appear as an indexed page — it is `noindex` and is
intentionally excluded from the sitemap. If Search Console reports it as indexed,
something removed that meta tag.

If coverage stalls or pages are dismissed as "low value content", the fix is more
written content. The `public/guides/` directory is where it goes.

## Automatic Deployment (Recommended)

Cloudflare Pages is connected directly to this GitHub repo and builds
automatically on every push to `main`.

### Setup Steps:

1. **Connect the repo** (one-time): Cloudflare dashboard → Workers & Pages →
   Create → Pages → Connect to Git → select `amotavasseli/qr-code-generator`.
2. **Build settings**: framework preset **Vite**, build command
   `npm run build`, output directory `dist`, production branch `main`.
3. **Push to `main`**: every push triggers a new build and deploy
   automatically. Cloudflare also builds preview deployments for other
   branches/PRs.
4. **Check deployment status**: the Cloudflare Pages project's
   **Deployments** tab shows build logs and the live/preview URLs.

## Manual Deployment

If you prefer to deploy from the command line instead of relying on the Git
integration, use the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/):

```bash
npm install
npm run build
npx wrangler pages deploy dist
```

This requires being logged in (`npx wrangler login`) or an API token, and
targets whichever Cloudflare Pages project you configure it against.

## Configuration

- `base: '/'` in `vite.config.ts` — the site is served from the root of the
  custom domain (see the custom domain section)
- `npm run build` — typechecks and builds the app to `dist/`, which is what
  Cloudflare Pages serves

### Static files served at the domain root

Everything in `public/` is copied verbatim into `dist/`, unbundled and
unrewritten. These must stay at the root to work:

| File | Purpose |
| --- | --- |
| `robots.txt` | Crawler directives, points at the sitemap |
| `sitemap.xml` | Lists all 23 indexable URLs for search engines |
| `site.css` | Shared styling for the static content pages |
| `pro.html` | Demand-signal page — **intentionally `noindex` and intentionally absent from `sitemap.xml`** |

The content pages (`about.html`, `privacy.html`, `terms.html`, `contact.html`,
`pro.html` and everything under `guides/`) are plain HTML rather than React
routes. This is deliberate: they are fully readable without JavaScript, which
matters because Googlebot defers JS rendering and AI crawlers do not execute JS
at all. When adding a new guide, remember to add it to `sitemap.xml` and link it
from `guides/index.html` and the homepage guide list.

`pro.html` is the exception to that last instruction — leave it out of
`sitemap.xml` and leave its `noindex` tag alone. See
[MONETIZATION.md](MONETIZATION.md) for why.

The header and footer markup is hand-duplicated across every one of these pages,
since there is no templating layer. A change to either is a mechanical edit
across all of them — check every page, not just the one you were looking at.

## Troubleshooting

### Site not loading after deployment

- Check the **Deployments** tab in the Cloudflare Pages project for build
  errors.
- Verify the custom domain is attached to the *production* deployment, not
  just a preview.
- DNS/certificate changes can take a while to propagate — wait rather than
  repeatedly re-saving the custom domain setting.

### 404 errors

- Confirm the build output directory is set to `dist` in the Pages project
  settings.
- Make sure the file actually exists under `public/` (for static pages) or
  is a route Vite builds (for the app itself).

### Build failures

- Check the **Deployments** tab in the Cloudflare Pages project for the
  full build log.
- Ensure dependencies install cleanly (`npm ci` locally reproduces what
  Cloudflare runs).
- Verify the `NODE_VERSION` environment variable in the Pages project
  matches a Node version this repo builds under (20+).

## Local Development

To test the app locally before deploying:

```bash
npm run dev
```

This starts the Vite dev server at `http://localhost:5173`. The static content
pages are served from the same origin during development, so
`http://localhost:5173/about.html` and `http://localhost:5173/guides/` work
exactly as they will in production.

To check the real production output instead — including the built asset hashes
and every static page as it will actually ship:

```bash
npm run build && npm run preview
```

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Vite Static Deploy Guide](https://vite.dev/guide/static-deploy)
