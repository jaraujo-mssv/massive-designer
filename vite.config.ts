import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Connect } from 'vite'

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
  plugins: [react(), tailwindcss(), imageProxyPlugin()],
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
