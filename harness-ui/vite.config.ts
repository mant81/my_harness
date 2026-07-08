import { defineConfig } from "vite";
export default defineConfig({
  root: "src/web",
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:5174", changeOrigin: true } },
  },
  build: { outDir: "../../dist", emptyOutDir: true },
});
