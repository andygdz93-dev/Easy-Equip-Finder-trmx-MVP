import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  ApiError,
  addToWatchlist,
  getListing,
  getRequestId,
  getWatchlist,
} from "../lib/api";
import { Listing, ScoreBreakdown, WatchlistItem } from "@easyfinderai/shared";

type ListingDetailData = Listing & { score: ScoreBreakdown };

export const ListingDetail = () => {
  const { id } = useParams();
  const [actionError, setActionError] = useState<string | null>(null);

  const listingQuery = useQuery<ListingDetailData>({
    queryKey: ["listing", id],
    queryFn: () => getListing(id ?? ""),
    enabled: Boolean(id),
  });

  const watchlistQuery = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => getWatchlist(),
  });

  const watchlistIds = new Set(
    (watchlistQuery.data?.items ?? []).map((item: WatchlistItem) => item.listingId)
  );

  if (listingQuery.isLoading) {
    return <p className="text-sm text-slate-400">Loading listing...</p>;
  }

  if (listingQuery.isError) {
    if (listingQuery.error instanceof ApiError) {
      if (listingQuery.error.message.toLowerCase().includes("not found")) {
        return <p className="text-sm text-slate-400">Listing not found.</p>;
      }
    }
    return (
      <Card className="border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
        Could not load listing.
        {getRequestId(listingQuery.error) && (
          <span className="ml-2 text-xs text-rose-200">
            Request ID: {getRequestId(listingQuery.error)}
          </span>
        )}
      </Card>
    );
  }

  const data = listingQuery.data;
  if (!data) {
    return <p className="text-sm text-slate-400">Listing not found.</p>;
  }

  const handleWatchlist = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await addToWatchlist(id);
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

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{data.title}</h2>
          <Badge className="bg-accent text-slate-900">Score {data.score.total}</Badge>
        </div>
        <p className="text-sm text-slate-300">{data.description}</p>
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <span>${data.price.toLocaleString()}</span>
          <span>{data.hours.toLocaleString()} hrs</span>
          <span>{data.state}</span>
          {data.category && <span>{data.category}</span>}
          <span>{data.source}</span>
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={handleWatchlist}
            disabled={watchlistIds.has(data.id)}
          >
            {watchlistIds.has(data.id) ? "In watchlist" : "Add to watchlist"}
          </Button>
        </div>
        {actionError && (
          <div className="text-xs text-rose-200">{actionError}</div>
        )}
        <div className="grid gap-3 text-xs text-slate-300">
          {Object.entries(data.score.components).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="capitalize">{key}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Score explanation</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {data.score.rationale.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
