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
});
