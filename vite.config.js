import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;

// Replaces <!--include:name--> markers with the matching file from src/partials.
// Keeps the shared head tags, header and footer as plain HTML (no client-side rendering needed).
const htmlPartials = () => ({
  name: 'html-partials',
  transformIndexHtml: {
    order: 'pre',
    handler: (html, ctx) => {
      // Absolute URLs (canonical, hreflang, Open Graph image) need a known host: set SITE_URL with a trailing slash.
      const site = process.env.SITE_URL ?? '';
      const page = ctx.path.split('/').pop() || 'index.html';
      let out = html.replace(/<!--include:([\w-]+)-->/g, (_, name) => readFileSync(resolve(root, 'src/partials', `${name}.html`), 'utf8'));
      if (!site) out = out.replace(/^[ \t]*<(?:link|meta)[^>]*data-site-url[^>]*>\n/gm, '');
      return out.replaceAll('%SITE_URL%', site).replaceAll('%PAGE%', page === 'index.html' ? '' : page).replaceAll(' data-site-url', '');
    },
  },
});

export default defineConfig({
  // Relative base so the build works from any static host path (e.g. GitHub Pages project sites).
  base: './',
  plugins: [htmlPartials()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        shop: resolve(root, 'shop.html'),
        product: resolve(root, 'product.html'),
        thenAndNow: resolve(root, 'then-and-now.html'),
      },
    },
  },
});
