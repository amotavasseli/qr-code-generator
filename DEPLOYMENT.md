# Deployment Guide

This guide explains how to deploy the QR Code Generator to GitHub Pages at
**www.batchqrcodes.com**.

## Custom domain setup (www.batchqrcodes.com)

`www` is the canonical domain — every absolute URL in the site (canonical
tags, `sitemap.xml`, `robots.txt`, Open Graph tags, JSON-LD) points there, and
`public/CNAME` contains `www.batchqrcodes.com`, which is what tells GitHub
Pages which domain to serve.

**Do not change `public/CNAME` to the apex (`batchqrcodes.com`) without also
changing every one of those other files.** GitHub Pages reads the custom
domain from whichever `CNAME` file is in the artifact on each deploy, so a
mismatch between that file and what's registered in **Settings → Pages**
causes GitHub to silently re-issue the domain setting on every push — which
can interrupt certificate provisioning and leave HTTPS half-configured. That
is exactly what happened before this domain got standardized on `www`: the
apex briefly 301-redirected to `www` while the HTTPS certificate only covered
`*.github.io`, so anything fetching over HTTPS (including Google's AdSense and
Search Console crawlers) got a certificate mismatch instead of a page.

### DNS records to add at your registrar

One CNAME record for `www`, which is what actually serves the site:

```
CNAME    www    amotavasseli.github.io
```

Plus four A records for the apex, so `batchqrcodes.com` (no `www`) at least
resolves instead of erroring outright — GitHub will redirect it to `www`:

```
A    @    185.199.108.153
A    @    185.199.109.153
A    @    185.199.110.153
A    @    185.199.111.153
```

Then in the repository's **Settings → Pages**, set the custom domain to
`www.batchqrcodes.com` and tick **Enforce HTTPS** once the certificate is
issued (this can take up to 24 hours after DNS propagates — check back rather
than re-saving the field repeatedly, since each save restarts provisioning).

### Email forwarding

The site publishes `contact@batchqrcodes.com`. Set up free email forwarding to
your real inbox at the registrar — Cloudflare Email Routing and Porkbun both
offer it at no cost. Nothing in this repo needs to change.

## AdSense checklist

The repo contains the scaffolding; these steps happen outside it.

1. **Before applying** — confirm the site is live on the custom domain with
   HTTPS, and that `/privacy.html`, `/terms.html`, `/about.html` and
   `/contact.html` all load.
2. **`public/ads.txt`** currently holds a placeholder publisher ID
   (`pub-0000000000000000`). Replace it with your real ID after approval and
   redeploy. It must remain at the domain root — `https://www.batchqrcodes.com/ads.txt`.
3. **Ad units** — the HTML files contain `<!-- AD SLOT: ... -->` comments marking
   the intended positions (below the tool, mid-guide, end-of-guide). Add the
   AdSense script and unit code at those points only after approval.
4. **Consent for EEA/UK/Switzerland traffic** — serving personalised ads there
   requires a Google-certified CMP integrated with IAB TCF. A hand-written cookie
   banner does **not** satisfy this and non-compliance can suspend the account.
   Enable Google's own **Privacy & messaging** (Funding Choices) in the AdSense
   console; it is free and certified. No repo change required.
5. **Search Console** — verify the domain and submit
   `https://www.batchqrcodes.com/sitemap.xml`.

If the application is rejected for "low value content", the fix is more written
content, not more ad code. The `public/guides/` directory is where it goes.

## Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the `main` branch.

### Setup Steps:

1. **Enable GitHub Pages**:
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Build and deployment", set Source to "GitHub Actions"

2. **Merge the PR**:
   - Once this PR is merged to `main`, the workflow will automatically run
   - The site will be deployed to: `https://www.batchqrcodes.com`

3. **Check Deployment Status**:
   - Go to the "Actions" tab in your repository
   - Look for the "Deploy to GitHub Pages" workflow
   - Once complete, your site will be live!

## Manual Deployment

If you prefer to deploy manually:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

This will build the app and push it to the `gh-pages` branch, which GitHub Pages will serve.

## Configuration

The deployment is configured in `package.json`:

- `base: '/'` in `vite.config.ts` — the site is served from the root of the
  custom domain (see the custom domain section)
- `predeploy`: Typechecks and builds the app before deploying
- `deploy`: Uses the gh-pages package to publish the `dist` folder

### Static files served at the domain root

Everything in `public/` is copied verbatim into `dist/`, unbundled and
unrewritten. These must stay at the root to work:

| File | Purpose |
| --- | --- |
| `CNAME` | Tells GitHub Pages which custom domain to serve |
| `ads.txt` | AdSense publisher verification |
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

- Ensure GitHub Pages is enabled in repository settings
- Check that the Source is set correctly (GitHub Actions or gh-pages branch)
- Wait a few minutes for GitHub Pages to update

### 404 errors

- Verify the `homepage` field in `package.json` matches your repository name
- For custom domains, update the `homepage` field accordingly

### Build failures

- Check the Actions tab for error details
- Ensure all dependencies are properly installed
- Verify Node.js version compatibility (v18 recommended)

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

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Static Deploy Guide](https://vite.dev/guide/static-deploy)
- [gh-pages Package](https://www.npmjs.com/package/gh-pages)
