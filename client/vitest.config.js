import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  plugins: [react(), svgr({
    svgrOptions: {
      exportType: 'named',
      ref: true,
      svgo: false,
      titleProp: true,
    },
    include: '**/*.svg',
  })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.jsx',
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'components': path.resolve(__dirname, './src/components'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'images': path.resolve(__dirname, './src/images'),
      'functions': path.resolve(__dirname, './src/functions'),
      'constants': path.resolve(__dirname, './src/constants'),
      'audio': path.resolve(__dirname, './src/audio'),
      'utils': path.resolve(__dirname, './src/utils'),
      'tests': path.resolve(__dirname, './src/tests'),
    },
  },
});
