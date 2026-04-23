import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  ApiError,
  addToWatchlist,
  evaluateDeal,
  getListing,
  getRequestId,
  getWatchlist,
  DealResult,
} from "../lib/api";
import { Listing, ScoreBreakdown, WatchlistItem } from "@easyfinderai/shared";

type ListingDetailData = Listing & { score: ScoreBreakdown };

const DECISION_STYLES: Record<string, string> = {
  BUY:       "bg-green-500/20 text-green-300 border border-green-500/40",
  NEGOTIATE: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  WALK:      "bg-rose-500/20 text-rose-300 border border-rose-500/40",
};

const fmt$ = (n: number) => `$${n.toLocaleString()}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const ListingDetail = () => {
  const { id } = useParams();
  const [actionError, setActionError] = useState<string | null>(null);
  const [deal, setDeal] = useState<DealResult | null>(null);
  const [dealLoading, setDealLoading] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

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

  const handleWatchlist = async () => {
    if (!id) return;
    setActionError(null);
    try {
      await addToWatchlist(id);
      await watchlistQuery.refetch();
    } catch (error) {
      const requestId = getRequestId(error);
      setActionError(requestId
        ? `Could not update watchlist. Request ID: ${requestId}`
        : "Could not update watchlist."
      );
    }
  };

  const handleDealAnalysis = async () => {
    if (!data) return;
    setDealLoading(true);
    setDealError(null);
    try {
      const result = await evaluateDeal({
        listing_id:   data.id,
        asking_price: data.price,
        category:     data.category ?? "unknown",
        hours:        data.hours ?? undefined,
        operable:     data.operable,
        source:       data.source,
      });
      setDeal(result);
    } catch (e: any) {
      setDealError(e.message ?? "Deal analysis failed.");
    } finally {
      setDealLoading(false);
    }
  };

  if (listingQuery.isLoading) return <p className="text-sm text-slate-400">Loading listing...</p>;

  if (listingQuery.isError) {
    if (listingQuery.error instanceof ApiError &&
        listingQuery.error.message.toLowerCase().includes("not found")) {
      return <p className="text-sm text-slate-400">Listing not found.</p>;
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
  if (!data) return <p className="text-sm text-slate-400">Listing not found.</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">

      {/* LEFT COLUMN */}
      <div className="space-y-6">

        {/* Main info */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{data.title}</h2>
            <Badge className="bg-accent text-slate-900">Score {data.score.total}</Badge>
          </div>
          <p className="text-sm text-slate-300">{data.description}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>{fmt$(data.price)}</span>
            <span>{data.hours.toLocaleString()} hrs</span>
            <span>{data.state}</span>
            {data.category && <span>{data.category}</span>}
            <span>{data.source}</span>
            <span className={data.operable ? "text-green-400" : "text-rose-400"}>
              {data.operable ? "Operable" : "Not operable"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleWatchlist} disabled={watchlistIds.has(data.id)}>
              {watchlistIds.has(data.id) ? "In watchlist" : "Add to watchlist"}
            </Button>
            <Button variant="outline" onClick={handleDealAnalysis} disabled={dealLoading}>
              {dealLoading ? "Analyzing…" : "Run Deal Analysis"}
            </Button>
          </div>
          {actionError && <div className="text-xs text-rose-200">{actionError}</div>}
        </Card>

        {/* Deal analysis */}
        {dealError && (
          <Card className="border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            {dealError}
          </Card>
        )}

        {deal && (
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Deal Analysis</h3>
              <span className={`rounded-md px-3 py-1 text-sm font-bold ${DECISION_STYLES[deal.decision]}`}>
                {deal.decision}
              </span>
            </div>

            {/* Key numbers */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-800 p-3">
                <div className="text-xs text-slate-400 mb-1">Fair Value</div>
                <div className="text-sm font-semibold">{fmt$(Math.round(deal.fair_value))}</div>
              </div>
              <div className="rounded-lg bg-slate-800 p-3">
                <div className="text-xs text-slate-400 mb-1">ROI at Ask</div>
                <div className="text-sm font-semibold">{fmtPct(deal.roi_at_ask)}</div>
              </div>
              <div className="rounded-lg bg-slate-800 p-3">
                <div className="text-xs text-slate-400 mb-1">Confidence</div>
                <div className="text-sm font-semibold">{fmtPct(deal.confidence)}</div>
              </div>
            </div>

            {/* Cost breakdown */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Cost Breakdown</div>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between"><span>Asking price</span><span>{fmt$(deal.costs.asking_price)}</span></div>
                {deal.costs.auction_premium > 0 && <div className="flex justify-between"><span>Auction premium</span><span>{fmt$(Math.round(deal.costs.auction_premium))}</span></div>}
                {deal.costs.transport_cost > 0 && <div className="flex justify-between"><span>Transport</span><span>{fmt$(Math.round(deal.costs.transport_cost))}</span></div>}
                <div className="flex justify-between"><span>Repair estimate</span><span>{fmt$(Math.round(deal.costs.repair_estimate))}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-1 font-semibold text-white">
                  <span>Total acquisition</span><span>{fmt$(Math.round(deal.costs.total_acquisition))}</span>
                </div>
              </div>
            </div>

            {/* Negotiation rounds */}
            {deal.negotiation.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Negotiation</div>
                <div className="space-y-1">
                  {deal.negotiation.map((r) => (
                    <div key={r.round_number} className="flex items-center justify-between text-xs text-slate-300">
                      <span>Round {r.round_number}: {fmt$(r.counter_price)}</span>
                      <span>ROI {fmtPct(r.achieved_roi)}</span>
                      <span className={r.accept ? "text-green-400" : "text-slate-500"}>
                        {r.accept ? "✓ accept" : "✗ reject"}
                      </span>
                    </div>
                  ))}
                </div>
                {deal.final_offer && (
                  <div className="mt-2 text-xs text-green-300">
                    Final offer: {fmt$(deal.final_offer)} — ROI {fmtPct(deal.final_roi!)}
                  </div>
                )}
              </div>
            )}

            {/* Flags */}
            {deal.flags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {deal.flags.map((f) => (
                  <span key={f} className="rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300 border border-rose-500/30">{f}</span>
                ))}
              </div>
            )}

            {/* Rationale */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Rationale</div>
              <ul className="space-y-1 text-xs text-slate-300">
                {deal.rationale.map((r, i) => (
                  <li key={i} className="flex gap-2"><span className="text-accent">→</span>{r}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold">Score Breakdown</h3>
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
          <h3 className="text-lg font-semibold">Score Explanation</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {data.score.rationale.length > 0
              ? data.score.rationale.map((item) => <li key={item}>- {item}</li>)
              : <li className="text-slate-500 italic">No rationale available.</li>
            }
          </ul>
        </Card>
      </div>

    </div>
  );
};
