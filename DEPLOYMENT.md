# Deployment Guide

This guide explains how to deploy the QR Code Generator to GitHub Pages at
**batchqrcodes.com**.

## Custom domain setup (batchqrcodes.com)

The repo is already configured for the custom domain:

- `public/CNAME` contains `batchqrcodes.com` and is copied into `build/` by the
  build, which is what tells GitHub Pages to serve the domain.
- `homepage` in `package.json` is `"."`, so CRA emits relative asset paths.
  Combined with relative internal links, that makes every page work at the
  domain root, under the dev server, and when opened directly off disk.

### DNS records to add at your registrar

For the apex domain, four A records (apex domains cannot use CNAME):

```
A    @    185.199.108.153
A    @    185.199.109.153
A    @    185.199.110.153
A    @    185.199.111.153
```

Plus one record for the `www` subdomain:

```
CNAME    www    amotavasseli.github.io
```

Then in the repository's **Settings → Pages**, set the custom domain to
`batchqrcodes.com` and tick **Enforce HTTPS** once the certificate is issued
(this can take up to 24 hours after DNS propagates).

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
   redeploy. It must remain at the domain root — `https://batchqrcodes.com/ads.txt`.
3. **Ad units** — the HTML files contain `<!-- AD SLOT: ... -->` comments marking
   the intended positions (below the tool, mid-guide, end-of-guide). Add the
   AdSense script and unit code at those points only after approval.
4. **Consent for EEA/UK/Switzerland traffic** — serving personalised ads there
   requires a Google-certified CMP integrated with IAB TCF. A hand-written cookie
   banner does **not** satisfy this and non-compliance can suspend the account.
   Enable Google's own **Privacy & messaging** (Funding Choices) in the AdSense
   console; it is free and certified. No repo change required.
5. **Search Console** — verify the domain and submit
   `https://batchqrcodes.com/sitemap.xml`.

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
   - The site will be deployed to: `https://batchqrcodes.com`

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

- `homepage`: `"."` — emits relative asset paths (see the custom domain section)
- `predeploy`: Builds the app before deploying
- `deploy`: Uses gh-pages package to deploy the build folder

### Static files served at the domain root

Everything in `public/` is copied verbatim into `build/`. These must stay at the
root to work:

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
npm start
```

This will start the development server at `http://localhost:3000`. The static
content pages are served from the same origin during development, so
`http://localhost:3000/about.html` and `http://localhost:3000/guides/` work
exactly as they will in production.

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Create React App Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [gh-pages Package](https://www.npmjs.com/package/gh-pages)
