import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), crx({ manifest }), tailwindcss()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: 'src/sidepanel/index.html',
        'extract-content': 'src/scripts/extract-content.ts',
        'extract-content-fallback': 'src/scripts/extract-content-fallback.ts',
        'extract-code-blocks': 'src/scripts/extract-code-blocks.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'extract-content') {
            return 'scripts/extract-content.js';
          }
          if (chunkInfo.name === 'extract-content-fallback') {
            return 'scripts/extract-content-fallback.js';
          }
          if (chunkInfo.name === 'extract-code-blocks') {
            return 'scripts/extract-code-blocks.js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
