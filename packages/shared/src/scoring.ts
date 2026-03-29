/**
 * SCORING_MODEL.md — EasyFinder Ranking & Recommendation System (v1)
 *
 * This file is the SINGLE source of truth for scoring logic.
 * It implements SCORING_MODEL.md §5, §6, §7, §8 exactly.
 *
 * Locked policy decisions (§2) enforced here:
 *   - Non-operable: allowed but scored with −60 penalty, never "Best Option"
 *   - Preferred states: mild boost only (65 vs 50), never dominates
 *   - Weights: price=0.35, hours=0.35, location=0.20, risk=0.10
 *
 * CI test (scoring.policy.test.ts) asserts these constants match this file.
 * Do NOT change weights, penalties, or thresholds without updating the test.
 */

import { Listing, ScoreBreakdown, ScoringConfig } from "./types.js";

// ── Locked Policy Constants (§2, §6, §8) ─────────────────────────────────────
// These are enforced by CI. Any change here must be intentional and reviewed.

export const POLICY = {
  WEIGHTS: {
    price:    0.35,
    hours:    0.35,
    location: 0.20,
    risk:     0.10,
  },
  LOCATION_PREFERRED_SCORE:     65,
  LOCATION_DEFAULT_SCORE:       50,
  RISK_BASELINE:                70,
  OPERABILITY_SCORE_PENALTY:   -60,
  OPERABILITY_RISK_PENALTY:    -40,
  CONFIDENCE_START:            100,
  CONFIDENCE_MISSING_PRICE:    -30,
  CONFIDENCE_MISSING_HOURS:    -25,
  CONFIDENCE_MISSING_STATE:    -10,
  CONFIDENCE_UNKNOWN_SOURCE:   -10,
  CONFIDENCE_STALE_LISTING:    -10,
  STALE_LISTING_DAYS:           30,
  BEST_OPTION_MIN_SCORE:        70,
  BEST_OPTION_MIN_CONFIDENCE:   60,
} as const;

// ── Default Configuration ─────────────────────────────────────────────────────
export const defaultScoringConfig: ScoringConfig = {
  id:   "default",
  name: "Default v1",
  weights: {
    price:    POLICY.WEIGHTS.price,
    hours:    POLICY.WEIGHTS.hours,
    location: POLICY.WEIGHTS.location,
    risk:     POLICY.WEIGHTS.risk,
  },
  preferredStates: ["CA", "TX", "WA"],
  maxHours:        12000,
  maxPrice:        500000,
  active:          true,
};

export const DefaultScoringConfig = defaultScoringConfig;

// ── Utilities ─────────────────────────────────────────────────────────────────
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const safeNum = (val: unknown, fallback = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

const daysSince = (isoDate: string): number =>
  (Date.now() - new Date(isoDate).getTime()) / 86_400_000;

// ── §5.1 Price Score ──────────────────────────────────────────────────────────
function calcPriceScore(
  price: number | null,
  config: ScoringConfig,
  benchmarks?: { priceP50: number; priceP90: number }
): { score: number; missing: boolean } {
  if (price === null || price <= 0) return { score: 50, missing: true };

  if (benchmarks) {
    const { priceP50, priceP90 } = benchmarks;
    if (price <= priceP50) {
      return { score: Math.min(100, Math.round(80 + 20 * (1 - price / priceP50))), missing: false };
    } else if (price <= priceP90) {
      const pct = (price - priceP50) / (priceP90 - priceP50);
      return { score: Math.round(80 - pct * 45), missing: false };
    } else {
      const over = (price - priceP90) / priceP90;
      return { score: Math.max(0, Math.round(35 - over * 35)), missing: false };
    }
  }

  const maxPrice = config.maxPrice > 0 ? config.maxPrice : 500_000;
  return { score: clamp(Math.round(100 - (price / maxPrice) * 100), 0, 100), missing: false };
}

// ── §5.2 Hours Score ──────────────────────────────────────────────────────────
function calcHoursScore(
  hours: number | null,
  config: ScoringConfig,
  benchmarks?: { hoursP50: number; hoursP90: number }
): { score: number; missing: boolean } {
  if (hours === null || hours < 0) return { score: 50, missing: true };

  if (benchmarks) {
    const { hoursP50, hoursP90 } = benchmarks;
    if (hours <= hoursP50) {
      return { score: Math.min(100, Math.round(80 + 20 * (1 - hours / hoursP50))), missing: false };
    } else if (hours <= hoursP90) {
      const pct = (hours - hoursP50) / (hoursP90 - hoursP50);
      return { score: Math.round(80 - pct * 45), missing: false };
    } else {
      const over = (hours - hoursP90) / hoursP90;
      return { score: Math.max(0, Math.round(35 - over * 35)), missing: false };
    }
  }

  const maxHours = config.maxHours > 0 ? config.maxHours : 12_000;
  return { score: clamp(Math.round(100 - (hours / maxHours) * 100), 0, 100), missing: false };
}

// ── §5.3 Location Score ───────────────────────────────────────────────────────
function calcLocationScore(state: string, preferredStates: string[]): number {
  return preferredStates.map(s => s.toUpperCase()).includes(state?.toUpperCase())
    ? POLICY.LOCATION_PREFERRED_SCORE
    : POLICY.LOCATION_DEFAULT_SCORE;
}

// ── §5.4 Risk Score ───────────────────────────────────────────────────────────
function calcRiskScore(
  listing: Listing,
  missingPrice: boolean,
  missingHours: boolean,
  isStale: boolean
): number {
  let risk = POLICY.RISK_BASELINE;

  const source = (listing.source || "").toLowerCase();
  if (source === "verified_partner") risk += 15;
  else if (source === "dealer")      risk += 5;
  else if (source === "unknown")     risk -= 15;
  else if (source === "auction")     risk -= 5;

  const l = listing as any;
  if (l.hasServiceHistory)   risk += 8;
  if (l.hasInspectionReport) risk += 10;
  if (l.goodPhotos)          risk += 5;

  if (missingPrice) risk -= 10;
  if (missingHours) risk -= 8;
  if (isStale)      risk -= 10;

  if (!listing.operable) risk += POLICY.OPERABILITY_RISK_PENALTY;

  return clamp(Math.round(risk), 0, 100);
}

// ── §7 Confidence Score ───────────────────────────────────────────────────────
export function calcConfidenceScore(
  listing: Listing,
  missingPrice: boolean,
  missingHours: boolean,
  isStale: boolean
): number {
  let confidence = POLICY.CONFIDENCE_START;
  if (missingPrice)                                       confidence += POLICY.CONFIDENCE_MISSING_PRICE;
  if (missingHours)                                       confidence += POLICY.CONFIDENCE_MISSING_HOURS;
  if (!listing.state)                                     confidence += POLICY.CONFIDENCE_MISSING_STATE;
  if ((listing.source || "").toLowerCase() === "unknown") confidence += POLICY.CONFIDENCE_UNKNOWN_SOURCE;
  if (isStale)                                            confidence += POLICY.CONFIDENCE_STALE_LISTING;
  return clamp(Math.round(confidence), 0, 100);
}

// ── §4 Flags ──────────────────────────────────────────────────────────────────
export function calcFlags(
  listing: Listing,
  missingPrice: boolean,
  missingHours: boolean,
  isStale: boolean
): string[] {
  const flags: string[] = [];
  if (!listing.operable)  flags.push("NON_OPERABLE");
  if (missingPrice)       flags.push("MISSING_PRICE");
  if (missingHours)       flags.push("MISSING_HOURS");
  if (isStale)            flags.push("STALE_LISTING");
  if ((listing.source || "").toLowerCase() === "unknown") flags.push("UNKNOWN_SOURCE");
  return flags;
}

// ── §12 Best Option eligibility ───────────────────────────────────────────────
export function isBestOptionEligible(
  totalScore: number,
  confidenceScore: number,
  flags: string[]
): boolean {
  if (flags.includes("NON_OPERABLE"))                      return false;
  if (totalScore      < POLICY.BEST_OPTION_MIN_SCORE)      return false;
  if (confidenceScore < POLICY.BEST_OPTION_MIN_CONFIDENCE) return false;
  return true;
}

// ── §9 Rationale builder ──────────────────────────────────────────────────────
function buildRationale(
  listing: Listing,
  priceScore: number,
  hoursScore: number,
  locationScore: number,
  missingPrice: boolean,
  missingHours: boolean,
  isStale: boolean,
  config: ScoringConfig
): string[] {
  const lines: string[] = [];

  if (missingPrice) {
    lines.push("Price missing — confidence reduced, neutral score applied.");
  } else {
    if (priceScore >= 80)      lines.push("Price is below category benchmark — strong value.");
    else if (priceScore >= 45) lines.push("Price is within the mid-range for this category.");
    else                       lines.push("Price is above category benchmark — reduced value score.");
  }

  if (missingHours) {
    lines.push("Hours missing — confidence reduced, neutral score applied.");
  } else {
    if (hoursScore >= 80)      lines.push("Hours are below category median — excellent condition signal.");
    else if (hoursScore >= 45) lines.push("Hours are moderate for this category.");
    else                       lines.push("Hours are above category p90 — high usage detected.");
  }

  const inPreferred = config.preferredStates
    .map(s => s.toUpperCase())
    .includes(listing.state?.toUpperCase());

  lines.push(
    inPreferred
      ? `Mild location preference applied (${listing.state} is in preferred states).`
      : "No location preference — neutral location score."
  );

  if (!listing.operable) {
    lines.push("Non-operable listing: high repair risk (−60 score penalty applied).");
    lines.push("Not eligible for Best Option.");
  }

  const l = listing as any;
  if (l.hasInspectionReport) lines.push("Inspection report present — reduces risk.");
  if (l.hasServiceHistory)   lines.push("Service history documented — positive risk signal.");

  const source = (listing.source || "").toLowerCase();
  if (source === "verified_partner") lines.push("Verified partner listing — risk score boosted.");

  if (isStale) lines.push(`Listing is stale (>${POLICY.STALE_LISTING_DAYS} days) — penalty applied.`);

  return lines;
}

// ── §8 Main entry point ───────────────────────────────────────────────────────
export interface ScoringOptions {
  benchmarks?: {
    priceP50:  number;
    priceP90:  number;
    hoursP50:  number;
    hoursP90:  number;
  };
}

export function scoreListing(
  listing: Listing,
  config:  ScoringConfig,
  options: ScoringOptions = {}
): ScoreBreakdown & { confidenceScore: number; flags: string[]; isBestOption: boolean } {

  const rawPrice = (listing as any).price;
  const rawHours = (listing as any).hours;
  const missingPrice = rawPrice === null || rawPrice === undefined || rawPrice <= 0;
  const missingHours = rawHours === null || rawHours === undefined || rawHours < 0;
  const isStale = listing.createdAt ? daysSince(listing.createdAt) > POLICY.STALE_LISTING_DAYS : false;

  const priceBench  = options.benchmarks ? { priceP50: options.benchmarks.priceP50, priceP90: options.benchmarks.priceP90 } : undefined;
  const hoursBench  = options.benchmarks ? { hoursP50: options.benchmarks.hoursP50, hoursP90: options.benchmarks.hoursP90 } : undefined;

  const priceResult   = calcPriceScore(missingPrice ? null : safeNum(rawPrice), config, priceBench);
  const hoursResult   = calcHoursScore(missingHours ? null : safeNum(rawHours), config, hoursBench);
  const locationScore = calcLocationScore(listing.state, config.preferredStates);
  const riskScore     = calcRiskScore(listing, priceResult.missing, hoursResult.missing, isStale);

  const w = {
    price:    (config.weights as any).price    ?? POLICY.WEIGHTS.price,
    hours:    (config.weights as any).hours    ?? POLICY.WEIGHTS.hours,
    location: (config.weights as any).location ?? POLICY.WEIGHTS.location,
    risk:     (config.weights as any).risk     ?? POLICY.WEIGHTS.risk,
  };

  const baseTotal =
    w.price    * priceResult.score +
    w.hours    * hoursResult.score +
    w.location * locationScore     +
    w.risk     * riskScore;

  const operabilityPenalty = listing.operable ? 0 : POLICY.OPERABILITY_SCORE_PENALTY;
  const totalScore         = clamp(Math.round(baseTotal + operabilityPenalty), 0, 100);

  const confidenceScore = calcConfidenceScore(listing, priceResult.missing, hoursResult.missing, isStale);
  const flags           = calcFlags(listing, priceResult.missing, hoursResult.missing, isStale);
  const bestOption      = isBestOptionEligible(totalScore, confidenceScore, flags);

  const rationale = buildRationale(
    listing, priceResult.score, hoursResult.score, locationScore,
    priceResult.missing, hoursResult.missing, isStale, config
  );

  return {
    total: totalScore,
    components: {
      operable: listing.operable ? 100 : 0,
      price:    Math.round(priceResult.score),
      hours:    Math.round(hoursResult.score),
      state:    locationScore,
      risk:     Math.round(riskScore),
    },
    rationale,
    confidenceScore,
    flags,
    isBestOption: bestOption,
  };
}
