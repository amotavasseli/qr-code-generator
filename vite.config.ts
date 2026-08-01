import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The site is served from the root of www.batchqrcodes.com, so assets resolve
// from '/' rather than CRA's relative `homepage: "."`.
//
// Only index.html is a Vite entry. Everything else under public/ — the guide
// library, about/contact/privacy/terms, site.css, robots.txt, sitemap.xml,
// CNAME — is hand-authored static HTML that Vite copies to dist/ untouched.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  build: {
    outDir: 'dist'
  }
});
