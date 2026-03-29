import { z } from "zod";

export const userRoleSchema = z.enum(["demo", "buyer", "seller", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const listingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  state: z.string(),
  price: z.number(),
  hours: z.number(),
  operable: z.boolean(),
  category: z.string(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  source: z.string(),
  createdAt: z.string(),
});
type ListingBase = z.infer<typeof listingSchema>;
export type ListingRequired = Required<Omit<ListingBase, "imageUrl" | "images">> &
  Pick<ListingBase, "imageUrl" | "images">;
export type Listing = ListingRequired;

export const scoringConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  // Weights must sum to 1.0 — enforced at runtime and in CI tests.
  // Schema matches SCORING_MODEL.md §8.1 exactly: price, hours, location, risk.
  weights: z.object({
    price:    z.number(),
    hours:    z.number(),
    location: z.number(),
    risk:     z.number(),
  }).refine(
    (w) => Math.abs(w.price + w.hours + w.location + w.risk - 1.0) < 0.01,
    { message: "Scoring weights must sum to 1.0 (±0.01)" }
  ),
  preferredStates: z.array(z.string()),
  maxHours: z.number(),
  maxPrice: z.number(),
  active: z.boolean().default(false),
});
export type ScoringConfig = z.infer<typeof scoringConfigSchema>;

export const scoreBreakdownSchema = z.object({
  total: z.number(),
  // Components mirror SCORING_MODEL.md §4 scoring outputs exactly.
  components: z.object({
    operable: z.number(),
    price:    z.number(),
    hours:    z.number(),
    state:    z.number(),
    risk:     z.number(),
  }),
  rationale: z.array(z.string()),
});
type ScoreBreakdownBase = z.infer<typeof scoreBreakdownSchema>;
export type ScoreBreakdownRequired = Required<ScoreBreakdownBase>;
export type ScoreBreakdown = ScoreBreakdownRequired;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: userRoleSchema,
});
type UserBase = z.infer<typeof userSchema>;
export type UserRequired = Required<UserBase>;
export type User = UserRequired;

// Explicitly named alias for clarity when sharing user data externally.
export const userPublicSchema = userSchema;
export type UserPublic = User;

export const watchlistItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  listingId: z.string(),
  createdAt: z.string(),
});
export type WatchlistItem = z.infer<typeof watchlistItemSchema>;

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiResponseSchema = z
  .object({
    data: z.unknown().optional(),
    error: apiErrorSchema.optional(),
    requestId: z.string().optional(),
  })
  .refine((value) => value.data !== undefined || value.error !== undefined, {
    message: "Response must include data or error.",
  });
export type ApiResponse<T> = {
  data?: T;
  error?: ApiError;
  requestId?: string;
};
