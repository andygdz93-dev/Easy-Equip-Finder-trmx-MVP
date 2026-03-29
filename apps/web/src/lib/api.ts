import {
  Listing,
  ScoreBreakdown,
  ScoringConfig,
  WatchlistItem,
} from "@easyfinderai/shared";
import { env } from "../env";

type ApiEnvelope<T> = {
  data?: T;
  error?: { code: string; message: string };
  requestId?: string;
};

export class ApiError extends Error {
  requestId?: string;

  constructor(message: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.requestId = requestId;
  }
}

const baseUrl = env.apiBaseUrl.replace(/\/$/, "");

const apiRequest = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok) {
    const message = payload.error?.message ?? "Request failed";
    throw new ApiError(message, payload.requestId);
  }

  if (payload.data === undefined) {
    throw new ApiError("Malformed response from server.", payload.requestId);
  }

  return payload.data;
};

export const getRequestId = (error: unknown) =>
  error instanceof ApiError ? error.requestId : undefined;

export type ListingFilters = {
  state?: string;
  maxHours?: number;
  maxPrice?: number;
  operable?: boolean;
};

export const getHealth = () =>
  apiRequest<{ ok: boolean; service: string; env: string; demoMode: boolean; uptimeSec: number; startedAt: string }>(
    "/api/health"
  );

export const getListings = (filters: ListingFilters) => {
  const params = new URLSearchParams();
  if (filters.state) params.set("state", filters.state);
  if (filters.maxHours) params.set("maxHours", String(filters.maxHours));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.operable) params.set("operable", "true");
  const query = params.toString();
  return apiRequest<{ total: number; listings: Array<Listing & { score: ScoreBreakdown }> }>(
    `/api/listings${query ? `?${query}` : ""}`
  );
};

export const getListing = (id: string) =>
  apiRequest<Listing & { score: ScoreBreakdown }>(`/api/listings/${id}`);

export const getScoringConfig = () =>
  apiRequest<{ config: ScoringConfig }>("/api/scoring-configs");

export const getWatchlist = () =>
  apiRequest<{ items: WatchlistItem[] }>("/api/watchlist");

export const addToWatchlist = (listingId: string) =>
  apiRequest<{ item: WatchlistItem }>("/api/watchlist", {
    method: "POST",
    body: JSON.stringify({ listingId }),
  });

// Legacy helper for any remaining internal usage.
export const apiFetch = <T>(path: string, options: RequestInit = {}) =>
  apiRequest<T>(path, options);
