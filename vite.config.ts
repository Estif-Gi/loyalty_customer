import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Listen on all local and loopback addresses
    port: 8081,
    strictPort: false, // Automatically fallback to next port if 8081 is busy
  },
  preview: {
    host: true,
    port: 8081,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "react-router",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "react-router",
      "@tanstack/react-query",
      "@tanstack/query-core",
      "zustand",
      "lucide-react",
    ],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
}));