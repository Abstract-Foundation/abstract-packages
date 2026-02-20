import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    proxy: {
      "/policy": "http://127.0.0.1:4174",
      "/handoff": "http://127.0.0.1:4174",
      "/healthz": "http://127.0.0.1:4174",
      "/security": "http://127.0.0.1:4174",
    },
  },
});
