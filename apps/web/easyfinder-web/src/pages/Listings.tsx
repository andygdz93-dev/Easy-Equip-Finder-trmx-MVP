import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  addToWatchlist,
  evaluateDeal,
  getListings,
  getRequestId,
  getWatchlist,
  DealResult,
} from "../lib/api";
import { Listing, ScoreBreakdown, WatchlistItem } from "@easyfinderai/shared";

const DECISION_COLORS: Record<string, string> = {
  BUY:       "bg-green-500/20 text-green-300 border border-green-500/40",
  NEGOTIATE: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  WALK:      "bg-rose-500/20 text-rose-300 border border-rose-500/40",
};


const CATEGORY_BENCHMARKS: Record<string, { p50: number; p90: number }> = {
  excavator:              { p50: 95000,  p90: 160000 },
  wheel_loader:           { p50: 88000,  p90: 145000 },
  bulldozer:              { p50: 92000,  p90: 155000 },
  crane:                  { p50: 130000, p90: 210000 },
  crawler_crane:          { p50: 130000, p90: 210000 },
  telehandler:            { p50: 75000,  p90: 130000 },
  articulated_dump_truck: { p50: 110000, p90: 180000 },
  default:                { p50: 85000,  p90: 140000 },
};

function getBenchmark(category?: string) {
  if (!category) return CATEGORY_BENCHMARKS.default;
  const key = category.toLowerCase().replace(/\\s+/g, "_");
  return CATEGORY_BENCHMARKS[key] ?? CATEGORY_BENCHMARKS.default;
}

export const Listings = () => {
  const [state, setState] = useState("");
  const [maxHours, setMaxHours] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [operableOnly, setOperableOnly] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deals, setDeals] = useState<Record<string, DealResult>>({});

  const listingsQuery = useQuery<{
    total: number;
    listings: Array<Listing & { score: ScoreBreakdown }>;
  }>({
    queryKey: ["listings", state, maxHours, maxPrice, operableOnly],
    queryFn: () =>
      getListings({
        state: state || undefined,
        maxHours: maxHours ? Number(maxHours) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        operable: operableOnly,
      }),
  });

  const watchlistQuery = useQuery<{ items: WatchlistItem[] }>({
    queryKey: ["watchlist"],
    queryFn: () => getWatchlist(),
  });

  const watchlistIds = useMemo(() => {
    const items = watchlistQuery.data?.items ?? [];
    return new Set(items.map((item: WatchlistItem) => item.listingId));
  }, [watchlistQuery.data]);

  // Auto-evaluate deals when listings load
  useEffect(() => {
    const listings = listingsQuery.data?.listings ?? [];
    if (!listings.length) return;
    listings.forEach((listing) => {
      if (deals[listing.id]) return; // already evaluated
      const bench = getBenchmark(listing.category);
      evaluateDeal({
        listing_id:   listing.id,
        asking_price: listing.price,
        category:     listing.category ?? "unknown",
        hours:        listing.hours ?? undefined,
        operable:     listing.operable,
        source:       listing.source,
        market_p50:   bench.p50,
        market_p90:   bench.p90,
      }).then((result) => {
        setDeals((prev) => ({ ...prev, [listing.id]: result }));
      }).catch(() => {}); // silent fail per card
    });
  }, [listingsQuery.data]);

  const handleAdd = async (listingId: string) => {
    setActionError(null);
    try {
      await addToWatchlist(listingId);
      await watchlistQuery.refetch();
    } catch (error) {
      const requestId = getRequestId(error);
      setActionError(
        requestId
          ? `Could not update watchlist. Request ID: ${requestId}`
          : "Could not update watchlist."
      );
    }
  };

  const listings = listingsQuery.data?.listings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm"
          value={state}
          onChange={(event) => setState(event.target.value)}
        >
          <option value="">All states</option>
          <option value="CA">CA</option>
          <option value="AZ">AZ</option>
          <option value="TX">TX</option>
          <option value="IA">IA</option>
        </select>
        <Input
          type="number"
          min="0"
          placeholder="Max hours"
          value={maxHours}
          onChange={(event) => setMaxHours(event.target.value)}
        />
        <Input
          type="number"
          min="0"
          placeholder="Max price"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={operableOnly}
            onChange={(event) => setOperableOnly(event.target.checked)}
          />
          Operable only
        </label>
      </div>

      {actionError && (
        <Card className="border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
          {actionError}
        </Card>
      )}

      {listingsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-40 animate-pulse" />
          ))}
        </div>
      ) : listingsQuery.isError ? (
        <Card className="border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
          Failed to load listings.
          {getRequestId(listingsQuery.error) && (
            <span className="ml-2 text-xs text-rose-200">
              Request ID: {getRequestId(listingsQuery.error)}
            </span>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((listing) => {
            const deal = deals[listing.id];
            return (
              <Card key={listing.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">{listing.title}</h3>
                    <p className="text-xs text-slate-400">{listing.source}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge className="bg-accent text-slate-900">{listing.score.total}</Badge>
                    {deal ? (
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${DECISION_COLORS[deal.decision]}`}>
                        {deal.decision}
                      </span>
                    ) : (
                      <span className="rounded px-2 py-0.5 text-xs text-slate-600 border border-slate-700 animate-pulse">
                        …
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>${listing.price.toLocaleString()}</span>
                  <span>{listing.hours.toLocaleString()} hrs</span>
                  <span>{listing.state}</span>
                  <span className={listing.operable ? "text-green-400" : "text-rose-400"}>
                    {listing.operable ? "Operable" : "Not operable"}
                  </span>
                </div>

                {deal && (
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>Fair value: <span className="text-slate-200">${Math.round(deal.fair_value).toLocaleString()}</span></span>
                    <span>ROI: <span className="text-slate-200">{(deal.roi_at_ask * 100).toFixed(1)}%</span></span>
                    {deal.final_offer && (
                      <span>Counter: <span className="text-yellow-300">${deal.final_offer.toLocaleString()}</span></span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Link to={`/listings/${listing.id}`}>
                    <Button variant="secondary">View details</Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => handleAdd(listing.id)}
                    disabled={watchlistIds.has(listing.id) || watchlistQuery.isLoading}
                  >
                    {watchlistIds.has(listing.id) ? "In watchlist" : "Add to watchlist"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
