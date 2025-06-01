import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { version } from "./package.json";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  build: {
    outDir: "dist-react",
    target: 'esnext',
    rollupOptions: {
      // Manual chunk splitting for better caching
      output: {
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-ui': ['@tanstack/react-table', 'lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-date': ['date-fns'],
          // Large feature chunks
          'feature-artwork': [
            './src/ui/pages/Artworks/index.ts',
            './src/ui/pages/DetailedArtwork/index.ts',
            './src/ui/pages/RegisterArtwork/index.ts'
          ],
          // API and store
          'store-api': [
            './src/ui/store/api/artworkApi.ts',
            './src/ui/store/api/userApi.ts',
            './src/ui/store/api/statisticsApi.ts',
            './src/ui/store/api/storageApi.ts',
            './src/ui/store/api/nfcApi.ts'
          ]
        }
      }
    },
    // Bundle analysis
    reportCompressedSize: true,
    // Chunk size warning threshold
    chunkSizeWarningLimit: 1000
  },
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "src/ui/components"),
      "@pages": path.resolve(__dirname, "./src/ui/pages"),
      "@hooks": path.resolve(__dirname, "./src/ui/hooks"),
      "@typings": path.resolve(__dirname, "./src/ui/typings"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      '@tanstack/react-table',
      'date-fns'
    ]
  }
});
