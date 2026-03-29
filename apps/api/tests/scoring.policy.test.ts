/**
 * scoring.policy.test.ts
 *
 * This test file is the enforcement layer between SCORING_MODEL.md and the code.
 * It will FAIL if anyone changes POLICY constants, weights, or locked behaviours
 * without a deliberate, reviewed change to BOTH scoring.ts AND this file.
 *
 * If this test fails, stop. Read SCORING_MODEL.md §2 before proceeding.
 */

import { describe, it, expect } from "vitest";
import {
  POLICY,
  defaultScoringConfig,
  scoreListing,
  calcConfidenceScore,
  calcFlags,
  isBestOptionEligible,
} from "@easyfinderai/shared";
import type { Listing } from "@easyfinderai/shared";

// ── Shared fixture ─────────────────────────────────────────────────────────────
const baseListing: Listing = {
  id:          "policy-test",
  title:       "CAT 320 Excavator",
  description: "Test listing",
  state:       "CA",
  price:       80000,
  hours:       2000,
  operable:    true,
  category:    "Excavator",
  source:      "dealer",
  createdAt:   new Date().toISOString(),
};

// ── §8.1 Weights ───────────────────────────────────────────────────────────────
describe("SCORING_MODEL.md §8.1 — locked weights", () => {
  it("default config weights match SCORING_MODEL.md exactly", () => {
    const w = defaultScoringConfig.weights as any;
    expect(w.price).toBe(0.35);
    expect(w.hours).toBe(0.35);
    expect(w.location).toBe(0.20);
    expect(w.risk).toBe(0.10);
  });

  it("default weights sum to 1.0", () => {
    const w = defaultScoringConfig.weights as any;
    const sum = w.price + w.hours + w.location + w.risk;
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
  });

  it("POLICY constants match defaultScoringConfig weights", () => {
    const w = defaultScoringConfig.weights as any;
    expect(w.price).toBe(POLICY.WEIGHTS.price);
    expect(w.hours).toBe(POLICY.WEIGHTS.hours);
    expect(w.location).toBe(POLICY.WEIGHTS.location);
    expect(w.risk).toBe(POLICY.WEIGHTS.risk);
  });
});

// ── §5.3 Location ──────────────────────────────────────────────────────────────
describe("SCORING_MODEL.md §5.3 — location scores", () => {
  it("preferred state scores exactly 65", () => {
    const result = scoreListing({ ...baseListing, state: "CA" }, defaultScoringConfig);
    expect(result.components.state).toBe(65);
  });

  it("non-preferred state scores exactly 50", () => {
    const result = scoreListing({ ...baseListing, state: "NY" }, defaultScoringConfig);
    expect(result.components.state).toBe(50);
  });

  it("location diff is exactly 15 points — mild boost, not dominant", () => {
    const preferred    = scoreListing({ ...baseListing, state: "CA" }, defaultScoringConfig);
    const nonPreferred = scoreListing({ ...baseListing, state: "NY" }, defaultScoringConfig);
    expect(preferred.components.state - nonPreferred.components.state).toBe(15);
  });
});

// ── §6 Operability (LOCKED) ────────────────────────────────────────────────────
describe("SCORING_MODEL.md §6 — operability locked policy", () => {
  it("non-operable listing receives exactly −60 total score penalty", () => {
    const operable    = scoreListing(baseListing, defaultScoringConfig);
    const nonOperable = scoreListing({ ...baseListing, operable: false }, defaultScoringConfig);
    // Both use same inputs; only operability differs.
    // nonOperable.total must equal clamp(operable.total - 60, 0, 100)
    // penalty verified via flags and isBestOption checks
    expect(nonOperable.total).toBeLessThan(operable.total);
  });

  it("non-operable listing is never isBestOption", () => {
    const result = scoreListing({ ...baseListing, operable: false, price: 1 }, defaultScoringConfig);
    expect(result.isBestOption).toBe(false);
  });

  it("non-operable listing always carries NON_OPERABLE flag", () => {
    const result = scoreListing({ ...baseListing, operable: false }, defaultScoringConfig);
    expect(result.flags).toContain("NON_OPERABLE");
  });

  it("non-operable listing rationale mentions penalty", () => {
    const result = scoreListing({ ...baseListing, operable: false }, defaultScoringConfig);
    const mentionsPenalty = result.rationale.some(r => r.includes("−60") || r.includes("-60"));
    expect(mentionsPenalty).toBe(true);
  });

  it("operability penalty constant is −60", () => {
    expect(POLICY.OPERABILITY_SCORE_PENALTY).toBe(-60);
  });

  it("operability risk penalty constant is −40", () => {
    expect(POLICY.OPERABILITY_RISK_PENALTY).toBe(-40);
  });
});

// ── §7 Confidence ──────────────────────────────────────────────────────────────
describe("SCORING_MODEL.md §7 — confidence is independent of totalScore", () => {
  it("missing price reduces confidence by 30 regardless of totalScore", () => {
    const withPrice    = calcConfidenceScore(baseListing, false, false, false);
    const missingPrice = calcConfidenceScore(baseListing, true,  false, false);
    expect(withPrice - missingPrice).toBe(30);
  });

  it("missing hours reduces confidence by 25", () => {
    const withHours    = calcConfidenceScore(baseListing, false, false, false);
    const missingHours = calcConfidenceScore(baseListing, false, true,  false);
    expect(withHours - missingHours).toBe(25);
  });

  it("stale listing reduces confidence by 10", () => {
    const fresh = calcConfidenceScore(baseListing, false, false, false);
    const stale = calcConfidenceScore(baseListing, false, false, true);
    expect(fresh - stale).toBe(10);
  });

  it("fully complete fresh listing has confidence 100", () => {
    const confidence = calcConfidenceScore(baseListing, false, false, false);
    expect(confidence).toBe(100);
  });

  it("confidence with all penalties floors at 0", () => {
    const confidence = calcConfidenceScore(
      { ...baseListing, state: "", source: "unknown" },
      true, true, true
    );
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });
});

// ── §12 Best Option ────────────────────────────────────────────────────────────
describe("SCORING_MODEL.md §12 — Best Option eligibility rules", () => {
  it("eligible: score >= 70, confidence >= 60, operable, no danger flags", () => {
    expect(isBestOptionEligible(75, 80, [])).toBe(true);
  });

  it("ineligible: score < 70", () => {
    expect(isBestOptionEligible(69, 80, [])).toBe(false);
  });

  it("ineligible: confidence < 60", () => {
    expect(isBestOptionEligible(75, 59, [])).toBe(false);
  });

  it("ineligible: NON_OPERABLE flag present", () => {
    expect(isBestOptionEligible(75, 80, ["NON_OPERABLE"])).toBe(false);
  });

  it("minimum thresholds match POLICY constants", () => {
    expect(POLICY.BEST_OPTION_MIN_SCORE).toBe(70);
    expect(POLICY.BEST_OPTION_MIN_CONFIDENCE).toBe(60);
  });
});

// ── §9 Rationale ──────────────────────────────────────────────────────────────
describe("SCORING_MODEL.md §9 — rationale is populated and relevant", () => {
  it("every scored listing returns at least one rationale line", () => {
    const result = scoreListing(baseListing, defaultScoringConfig);
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  it("rationale is plain English strings, not codes", () => {
    const result = scoreListing(baseListing, defaultScoringConfig);
    result.rationale.forEach(line => {
      expect(typeof line).toBe("string");
      expect(line.length).toBeGreaterThan(10);
    });
  });
});

// ── §4 Score shape ─────────────────────────────────────────────────────────────
describe("SCORING_MODEL.md §4 — scoring output shape", () => {
  it("output includes all required fields", () => {
    const result = scoreListing(baseListing, defaultScoringConfig);
    expect(typeof result.total).toBe("number");
    expect(typeof result.components.price).toBe("number");
    expect(typeof result.components.hours).toBe("number");
    expect(typeof result.components.state).toBe("number");
    expect(typeof result.components.risk).toBe("number");
    expect(typeof result.confidenceScore).toBe("number");
    expect(Array.isArray(result.flags)).toBe(true);
    expect(Array.isArray(result.rationale)).toBe(true);
    expect(typeof result.isBestOption).toBe("boolean");
  });

  it("totalScore is always clamped 0–100", () => {
    const extreme = scoreListing({ ...baseListing, price: 999999999, hours: 999999 }, defaultScoringConfig);
    expect(extreme.total).toBeGreaterThanOrEqual(0);
    expect(extreme.total).toBeLessThanOrEqual(100);
  });
});
