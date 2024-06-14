import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/website',
  publicDir: path.join(__dirname, 'public'),
  server: {
    port: 4000,
    host: 'localhost',
  },
  preview: {
    port: 4000,
    host: 'localhost',
  },
  plugins: [tsconfigPaths(), react(), basicSsl()],
  build: {
    outDir: '../../dist/apps/website',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        entryFileNames: `assets/Main-[name]-[hash].js`,
      },
    },
  },
});
