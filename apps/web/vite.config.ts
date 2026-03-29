import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Single unified server block — host binding ensures Vite is reachable
  // from your local network (important for Termux where localhost alone
  // sometimes only binds to the loopback interface, not your WiFi IP)
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
  },
});
