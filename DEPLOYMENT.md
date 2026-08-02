# Deployment Guide

This guide explains how to deploy the QR Code Generator to Cloudflare Pages
at **www.batchqrcodes.com**.

> **Migration in progress:** the site is moving from GitHub Pages to
> Cloudflare Pages. The GitHub Actions workflow
> (`.github/workflows/deploy-to-github-pages.yml`) and the `gh-pages`
> package/scripts below are kept as a working fallback until the Cloudflare
> Pages deploy and domain cutover are verified, then removed in a follow-up
> change. `public/CNAME` is a GitHub Pages-only file — Cloudflare ignores
> it — and will be deleted in that same follow-up.

## Custom domain setup (www.batchqrcodes.com)

`www` is the canonical domain — every absolute URL in the site (canonical
tags, `sitemap.xml`, `robots.txt`, Open Graph tags, JSON-LD) points there.
**Do not switch the canonical domain to the apex (`batchqrcodes.com`)
without also changing every one of those other files** — a mismatch
between what's configured as the custom domain and what those files claim
can leave crawlers (including Google's AdSense and Search Console) hitting
a certificate or redirect mismatch instead of a page. That's what happened
the last time this drifted, back on GitHub Pages.

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

## AdSense checklist

The repo contains the scaffolding; these steps happen outside it.

1. **Before applying** — confirm the site is live on the custom domain with
   HTTPS, and that `/privacy.html`, `/terms.html`, `/about.html` and
   `/contact.html` all load.
2. **Consent for EEA/UK/Switzerland traffic** — serving personalised ads there
   requires a Google-certified CMP integrated with IAB TCF. A hand-written cookie
   banner does **not** satisfy this and non-compliance can suspend the account.
   Enable Google's own **Privacy & messaging** (Funding Choices) in the AdSense
   console; it is free and certified. No repo change required.
5. **Search Console** — verify the domain and submit
   `https://www.batchqrcodes.com/sitemap.xml`.

If the application is rejected for "low value content", the fix is more written
content, not more ad code. The `public/guides/` directory is where it goes.

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
| `sitemap.xml` | Lists all 14 URLs for search engines |
| `site.css` | Shared styling for the static content pages |

The content pages (`about.html`, `privacy.html`, `terms.html`, `contact.html`
and everything under `guides/`) are plain HTML rather than React routes. This is
deliberate: they are fully readable without JavaScript, which matters because
Googlebot defers JS rendering and AI crawlers do not execute JS at all. When
adding a new guide, remember to add it to `sitemap.xml` and link it from
`guides/index.html` and the homepage guide list.

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
