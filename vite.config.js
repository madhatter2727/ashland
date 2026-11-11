import { defineConfig } from 'vite';
const SITE = process.env.SITE_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : '');
export default defineConfig({
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
  plugins: [{ name: 'site-url', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE) }],
});
