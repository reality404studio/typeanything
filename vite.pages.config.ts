import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/deep-work-typing/",
  build: {
    emptyOutDir: true,
    outDir: "../dist-pages",
    rollupOptions: {
      input: {
        draw: resolve(import.meta.dirname, "github-pages/draw/index.html"),
        type: resolve(import.meta.dirname, "github-pages/index.html"),
      },
    },
  },
  plugins: [react()],
  publicDir: "../public",
  root: "github-pages",
});
