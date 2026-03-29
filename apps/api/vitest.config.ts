import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: {
      JWT_SECRET: "test-secret-for-ci-only",
      DEMO_MODE: "true",
    },
  },
});
