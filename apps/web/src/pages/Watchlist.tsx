import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { getListings, getRequestId, getWatchlist } from "../lib/api";
import { Listing, ScoreBreakdown, WatchlistItem } from "@easyfinderai/shared";

type ListingWithScore = Listing & { score: ScoreBreakdown };

export const Watchlist = () => {
  const watchlistQuery = useQuery<{ items: WatchlistItem[] }>({
    queryKey: ["watchlist"],
    queryFn: () => getWatchlist(),
  });

  const listingsQuery = useQuery<{
    total: number;
    listings: Array<Listing & { score: ScoreBreakdown }>;
  }>({
    queryKey: ["listings"],
    queryFn: () => getListings({ operable: true }),
  });

  const listingMap = useMemo(() => {
    const items = listingsQuery.data?.listings ?? [];
    return new Map(items.map((listing) => [listing.id, listing]));
  }, [listingsQuery.data]);

  if (watchlistQuery.isLoading || listingsQuery.isLoading) {
    return <p className="text-sm text-slate-400">Loading watchlist...</p>;
  }

  if (watchlistQuery.isError || listingsQuery.isError) {
    const requestId =
      getRequestId(watchlistQuery.error) ?? getRequestId(listingsQuery.error);
    return (
      <Card className="border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
        Could not load watchlist.
        {requestId && (
          <span className="ml-2 text-xs text-rose-200">Request ID: {requestId}</span>
        )}
      </Card>
    );
  }

  const items = watchlistQuery.data?.items ?? [];
  const watchedListings = items
    .map((item) => listingMap.get(item.listingId!))
    .filter(Boolean) as ListingWithScore[];

  if (!items.length) {
    return <p className="text-sm text-slate-400">Your watchlist is empty.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {watchedListings.map((listing) => (
        <Card key={listing.id} className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{listing.title}</h3>
              <p className="text-xs text-slate-400">{listing.state}</p>
            </div>
            <span className="text-xs text-slate-300">Score {listing.score.total}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span>${listing.price.toLocaleString()}</span>
            <span>{listing.hours.toLocaleString()} hrs</span>
            <span>{listing.operable ? "Operable" : "Not operable"}</span>
          </div>
          <Link className="text-sm text-sky-300 hover:text-sky-200" to={`/listings/${listing.id}`}>
            View details
          </Link>
        </Card>
      ))}
    </div>
  );
};
