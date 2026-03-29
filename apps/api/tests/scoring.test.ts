import { describe, it, expect } from "vitest";
import { scoreListing, defaultScoringConfig, POLICY } from "@easyfinderai/shared";
import type { Listing } from "@easyfinderai/shared";

const baseListing = {
  id: "l1", title: "Test Loader", description: "Test",
  state: "CA", price: 100000, hours: 2000, operable: true,
  category: "Loader", imageUrl: "https://example.com/img.png",
  source: "mock", createdAt: new Date().toISOString(),
} satisfies Listing;

describe("scoring engine", () => {
  it("non-operable scores lower than operable", () => {
    const op  = scoreListing(baseListing, defaultScoringConfig);
    const nop = scoreListing({ ...baseListing, operable: false }, defaultScoringConfig);
    expect(nop.total).toBeLessThan(op.total);
    expect(nop.flags).toContain("NON_OPERABLE");
    expect(nop.isBestOption).toBe(false);
  });
  it("hours and price influence score", () => {
    expect(scoreListing({ ...baseListing, hours: 1000 }, defaultScoringConfig).total)
      .toBeGreaterThan(scoreListing({ ...baseListing, hours: 9000 }, defaultScoringConfig).total);
    expect(scoreListing({ ...baseListing, price: 30000 }, defaultScoringConfig).total)
      .toBeGreaterThan(scoreListing({ ...baseListing, price: 220000 }, defaultScoringConfig).total);
  });
  it("preferred states boost", () => {
    expect(scoreListing({ ...baseListing, state: "CA" }, defaultScoringConfig).total)
      .toBeGreaterThan(scoreListing({ ...baseListing, state: "NY" }, defaultScoringConfig).total);
  });
});
