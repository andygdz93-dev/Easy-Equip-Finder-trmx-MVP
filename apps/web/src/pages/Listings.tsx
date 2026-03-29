import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  addToWatchlist,
  getListings,
  getRequestId,
  getWatchlist,
} from "../lib/api";
import { Listing, ScoreBreakdown, WatchlistItem } from "@easyfinderai/shared";

export const Listings = () => {
  const [state, setState] = useState("");
  const [maxHours, setMaxHours] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [operableOnly, setOperableOnly] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

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
          {listings.map((listing) => (
            <Card key={listing.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{listing.title}</h3>
                  <p className="text-xs text-slate-400">{listing.source}</p>
                </div>
                <Badge className="bg-accent text-slate-900">{listing.score.total}</Badge>
              </div>
              <p className="text-sm text-slate-300">{listing.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span>${listing.price.toLocaleString()}</span>
                <span>{listing.hours.toLocaleString()} hrs</span>
                <span>{listing.state}</span>
                <span>{listing.operable ? "Operable" : "Not operable"}</span>
              </div>
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
          ))}
        </div>
      )}
    </div>
  );
};
