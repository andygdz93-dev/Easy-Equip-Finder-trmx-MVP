import { expect, it, vi } from "vitest";

it("requires api base url", async () => {
  vi.resetModules();
  delete process.env.VITE_API_URL;
  await expect(import("../src/env")).rejects.toThrow(
    /VITE_API_URL is required/
  );
});
