import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '5173-i47u1c720s098nnh7ftb1-ab247ca4.us2.manus.computer'
    ]
  },
  plugins: [react()],
  optimizeDeps: { esbuildOptions: { target: "esnext" } },
  build: { target: "esnext" },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
  },
});
