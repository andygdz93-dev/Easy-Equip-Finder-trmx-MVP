import { FastifyInstance } from "fastify";
import { z } from "zod";
import { listings, getScoringConfig } from "../store.js";
import { scoreListing } from "@easyfinderai/shared";
import type { Listing } from "@easyfinderai/shared";
import { ok, fail } from "../response.js";
import { demoListings } from "../demo/demoListings.js";
import { getRealListings } from "../db.js";

const querySchema = z.object({
  state:    z.string().length(2).optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  maxHours: z.coerce.number().int().positive().optional(),
  // Optional buyer-supplied filter. Default: show ALL listings including
  // non-operable (SCORING_MODEL.md §6 locked policy — they score low, not hidden).
  operable: z.enum(["true"]).optional(),
});

// Map a PostgreSQL row to the shared Listing shape.
// state defaults to "UNKNOWN" (not "TX") so missing state is surfaced as a
// confidence penalty rather than silently misrepresenting location.
const dbRowToListing = (row: any): Listing => ({
  id:          String(row.id),
  title:       row.equipment,
  description: `${row.equipment} — Market Value: $${Number(row.market_value).toLocaleString()}`,
  state:       normalizeState(row.state),
  price:       Number(row.price),
  hours:       Number(row.hours_used) || 0,
  operable:    row.operable !== false,
  category:    row.equipment,
  source:      "database",
  createdAt:   row.scraped_at
    ? new Date(row.scraped_at).toISOString()
    : new Date().toISOString(),
  ...(row.market_value        && { marketValue: Number(row.market_value) }),
  ...(row.year                && { year:        Number(row.year) }),
  ...(row.condition_score     && { condition:   Number(row.condition_score) }),
  ...(row.distance_from_buyer && { distance:    Number(row.distance_from_buyer) }),
});

const getSourceListings = () =>
  process.env.DEMO_MODE === "true" ? demoListings : listings;

export default async function listingRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const query = querySchema.parse(request.query);
    const demoMode = process.env.DEMO_MODE === "true";

    const dbRows         = await getRealListings();
    const sourceListings = dbRows ? dbRows.map(dbRowToListing) : getSourceListings();
    const isRealData     = !!dbRows;

    // Non-operable listings remain in results unless buyer explicitly opts out
    // with ?operable=true. The scoring engine applies the -60 penalty (§6 locked).
    const filtered = sourceListings.filter((listing) => {
      if (query.operable && !listing.operable) return false;
      if (query.state    && listing.state !== query.state) return false;
      if (query.maxPrice && listing.price > query.maxPrice) return false;
      if (query.maxHours && listing.hours > query.maxHours) return false;
      return true;
    });

    const scoringConfig = getScoringConfig();
    const scored = filtered
      .map((listing) => ({
        listing,
        result: scoreListing(listing, scoringConfig),
      }))
      .sort((a, b) => b.result.total - a.result.total || a.listing.price - b.listing.price);

    return ok(request, {
      total:  scored.length,
      source: isRealData ? "database" : "demo",
      listings: scored.map(({ listing, result }) => ({
        ...listing,
        score:           result,
        totalScore:      result.total,
        scoreBreakdown:  result.components,
        rationale:       result.rationale,
        confidenceScore: result.confidenceScore,
        flags:           result.flags,
        isBestOption:    result.isBestOption,
      })),
    });
  });

  app.get("/:id", async (request, reply) => {
    const id = z.string().parse((request.params as { id: string }).id);

    const dbRows         = await getRealListings();
    const sourceListings = dbRows ? dbRows.map(dbRowToListing) : getSourceListings();

    const listing = sourceListings.find((item) => item.id === id);
    if (!listing) {
      return fail(request, reply, "NOT_FOUND", "Listing not found.", 404);
    }

    const scoringConfig = getScoringConfig();
    const result        = scoreListing(listing, scoringConfig);

    return ok(request, {
      ...listing,
      score:           result,
      totalScore:      result.total,
      scoreBreakdown:  result.components,
      rationale:       result.rationale,
      confidenceScore: result.confidenceScore,
      flags:           result.flags,
      isBestOption:    result.isBestOption,
    });
  });
}

// ── State normalization (from EasyfinderAI-v2/normalizers/listing.js) ─────────
// Handles full state names ("California"), abbreviations ("CA"), and
// location strings ("Houston, TX") from scraped listings.
export function normalizeState(raw: string | null | undefined): string {
  if (!raw) return "UNKNOWN";
  const s = String(raw).trim();

  const abbrevMatch = s.match(/,\s*([A-Z]{2})\b/) || s.match(/\b([A-Z]{2})\b$/);
  if (abbrevMatch) return abbrevMatch[1].toUpperCase();

  const map: Record<string, string> = {
    Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",
    Colorado:"CO",Connecticut:"CT",Delaware:"DE",Florida:"FL",Georgia:"GA",
    Hawaii:"HI",Idaho:"ID",Illinois:"IL",Indiana:"IN",Iowa:"IA",Kansas:"KS",
    Kentucky:"KY",Louisiana:"LA",Maine:"ME",Maryland:"MD",Massachusetts:"MA",
    Michigan:"MI",Minnesota:"MN",Mississippi:"MS",Missouri:"MO",Montana:"MT",
    Nebraska:"NE",Nevada:"NV","New Hampshire":"NH","New Jersey":"NJ",
    "New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND",
    Ohio:"OH",Oklahoma:"OK",Oregon:"OR",Pennsylvania:"PA","Rhode Island":"RI",
    "South Carolina":"SC","South Dakota":"SD",Tennessee:"TN",Texas:"TX",
    Utah:"UT",Vermont:"VT",Virginia:"VA",Washington:"WA","West Virginia":"WV",
    Wisconsin:"WI",Wyoming:"WY"
  };

  for (const [name, abbr] of Object.entries(map)) {
    if (s.includes(name)) return abbr;
  }

  return s.length === 2 ? s.toUpperCase() : "UNKNOWN";
}
