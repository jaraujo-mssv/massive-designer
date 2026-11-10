// Builds server/index.ts into dist-server/index.mjs for `npm start`. Vite's SSR build, without the app's config: it
// bundles the server, api/ and the src/ files they import (resolving their .js imports to .ts), and leaves every
// package in node_modules as an import, so the server runs on the production dependencies alone.
import { build } from 'vite';

await build({
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  build: {
    ssr: 'server/index.ts',
    outDir: 'dist-server',
    emptyOutDir: true,
    target: 'node24',
    minify: false,
    rollupOptions: { output: { entryFileNames: 'index.mjs' } },
  },
});
console.log('✓ dist-server/index.mjs');
