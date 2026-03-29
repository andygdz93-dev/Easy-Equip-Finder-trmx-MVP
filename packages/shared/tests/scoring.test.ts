import { describe, expect, it } from "vitest";
import { defaultScoringConfig, scoreListing } from "../src/scoring.js";
import { Listing } from "../src/types.js";

const baseListing: Listing = {
  id: "listing-1",
  title: "CA Excavator 1",
  description: "Well-maintained excavator ready for work.",
  state: "CA",
  price: 90000,
  hours: 1800,
  operable: true,
  category: "Excavator",
  imageUrl: "https://example.com/image.jpg",
  source: "auctionplanet",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("scoreListing", () => {
  it("returns zero when listing is not operable", () => {
    const result = scoreListing(
      { ...baseListing, operable: false },
      defaultScoringConfig
    );

    expect(result.total).toBe(0);
    expect(result.components.operable).toBe(0);
    expect(result.rationale[0]).toMatch(/not operable/i);
  });

  it("prefers listings in preferred states", () => {
    const preferred = scoreListing(
      { ...baseListing, state: "CA" },
      defaultScoringConfig
    );
    const nonPreferred = scoreListing(
      { ...baseListing, state: "NV" },
      defaultScoringConfig
    );

    expect(preferred.total).toBeGreaterThan(nonPreferred.total);
    expect(preferred.components.state).toBeGreaterThan(
      nonPreferred.components.state
    );
  });

  it("rewards lower hours and lower price", () => {
    const lower = scoreListing(
      { ...baseListing, hours: 1000, price: 65000 },
      defaultScoringConfig
    );
    const higher = scoreListing(
      { ...baseListing, hours: 6000, price: 190000 },
      defaultScoringConfig
    );

    expect(lower.total).toBeGreaterThan(higher.total);
    expect(lower.components.hours).toBeGreaterThan(higher.components.hours);
    expect(lower.components.price).toBeGreaterThan(higher.components.price);
  });
});
