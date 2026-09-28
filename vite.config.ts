import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Connect } from 'vite'

/**
 * Per-person versions of video templates (dev server only, so their details never ship).
 * A project opts in with `"variants": { "dir": "output/hires", "renderName": "welcome-{id}" }` in its meta.json;
 * each JSON file in that dir is one variant's composition variables.
 *   GET /api/video/variants                                → { [projectId]: { dir, renderName, items: [{ id, variables }] } }
 *   GET /video-projects/<id>/index.html?variant=<variant>  → the composition with window.__hfVariables injected
 */
function videoVariantsPlugin() {
  const projectsDir = path.resolve(__dirname, 'public/video-projects');
  const SLUG = /^[a-z0-9][a-z0-9-]*$/i;

  type VariantConfig = { dir: string; renderName: string };
  const configFor = (id: string): VariantConfig | null => {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(projectsDir, id, 'meta.json'), 'utf8'));
      const v = typeof meta.variants === 'string' ? { dir: meta.variants } : meta.variants;
      if (!v?.dir) return null;
      return { dir: path.resolve(__dirname, v.dir), renderName: v.renderName ?? `${id}-{id}` };
    } catch {
      return null;
    }
  };
  const readVariables = (dir: string, variant: string) =>
    JSON.parse(fs.readFileSync(path.join(dir, `${variant}.json`), 'utf8')) as Record<string, unknown>;

  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname === '/api/video/variants') {
      const out: Record<string, unknown> = {};
      for (const id of fs.readdirSync(projectsDir)) {
        const config = configFor(id);
        if (!config || !fs.existsSync(config.dir)) continue;
        const items = fs
          .readdirSync(config.dir)
          .filter((f) => f.endsWith('.json'))
          .map((f) => f.slice(0, -5))
          .filter((v) => SLUG.test(v))
          .sort()
          .flatMap((v) => {
            try {
              return [{ id: v, variables: readVariables(config.dir, v) }];
            } catch {
              return [];
            }
          });
        out[id] = { dir: path.relative(__dirname, config.dir), renderName: config.renderName, items };
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(out));
      return;
    }

    const match = /^\/video-projects\/([^/]+)\/index\.html$/.exec(url.pathname);
    const variant = url.searchParams.get('variant');
    if (!match || !variant) return next();
    const config = configFor(match[1]);
    if (!config || !SLUG.test(variant)) return next();
    try {
      const vars = JSON.stringify(readVariables(config.dir, variant)).replace(/</g, '\\u003c');
      const html = fs
        .readFileSync(path.join(projectsDir, match[1], 'index.html'), 'utf8')
        .replace(/<head>/i, `<head>\n    <script>window.__hfVariables = ${vars};</script>`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(html);
    } catch {
      res.statusCode = 404;
      res.end('Unknown variant');
    }
  };

  return {
    name: 'video-variants',
    configureServer(server) { server.middlewares.use(handler); },
  };
}

function imageProxyPlugin() {
  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url?.startsWith('/api/image-proxy')) return next();

    const targetUrl = new URL(req.url, 'http://localhost').searchParams.get('url');
    if (!targetUrl) { res.statusCode = 400; res.end('Missing url'); return; }

    try {
      const upstream = await fetch(targetUrl);
      if (!upstream.ok) throw new Error(`${upstream.status}`);
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end(buffer);
    } catch {
      res.statusCode = 502; res.end('Proxy error');
    }
  };

  return {
    name: 'image-proxy',
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), imageProxyPlugin(), videoVariantsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-dnd': ['react-dnd', 'react-dnd-html5-backend'],
          'vendor-export': ['html2canvas', 'dom-to-image-more', 'modern-screenshot'],
        },
      },
    },
  },
})
