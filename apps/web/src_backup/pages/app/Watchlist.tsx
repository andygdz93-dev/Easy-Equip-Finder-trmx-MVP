import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/card";
import {
  ListingWithScore,
  getListings,
  getRequestId,
  getWatchlist,
  removeFromWatchlist,
} from "../../lib/api";
import { WatchlistItem } from "@easyfinderai/shared";
import { formatListingHours, formatListingPrice } from "../../lib/formatters";

export const Watchlist = () => {
  const watchlistQuery = useQuery<{ items: WatchlistItem[] }>({
    queryKey: ["watchlist"],
    queryFn: () => getWatchlist(),
  });

  const listingsQuery = useQuery<ListingWithScore[]>({
    queryKey: ["listings"],
    queryFn: () => getListings({}),
  });

  const listingMap = useMemo(() => {
    const items = listingsQuery.data ?? [];
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
      {watchedListings.map((listing) => {
        const listingId = listing.id ?? "";
        return (
        <Card key={listingId || listing.title || "listing"} className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{listing.title}</h3>
              <p className="text-xs text-slate-400">{listing.state}</p>
            </div>
            <span className="text-xs text-slate-300">Score {listing.totalScore}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span>
              {formatListingPrice(listing.price)}
            </span>
            {formatListingHours(listing.hours) && <span>{formatListingHours(listing.hours)}</span>}
            <span>
              {listing.operable === undefined
                ? "—"
                : listing.operable
                ? "Operable"
                : "Not operable"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <Link className="text-sm text-sky-300 hover:text-sky-200" to={`/app/listings/${listingId}`}>
              View details
            </Link>
            <button
              className="text-xs text-rose-300 hover:text-rose-200"
              onClick={async () => {
                if (!listingId) return;
                await removeFromWatchlist(listingId);
                await watchlistQuery.refetch();
              }}
            >
              Remove
            </button>
          </div>
        </Card>
        );
      })}
    </div>
  );
};
