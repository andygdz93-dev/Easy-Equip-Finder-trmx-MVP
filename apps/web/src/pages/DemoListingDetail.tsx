import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DemoListing, getDemoListing, getDemoListings } from "../lib/demoApi";
import { useDemoWatchlist } from "../lib/demoWatchlist";

const formatCurrency = (value?: number) =>
  Number.isFinite(value) ? `$${Number(value).toLocaleString()}` : "N/A";

const formatHours = (value?: number) =>
  Number.isFinite(value) ? `${Number(value).toLocaleString()} hrs` : "N/A";

const getScoreSummary = (listing: DemoListing) => {
  const totalScore = listing.totalScore ?? listing.score?.total ?? 0;
  const breakdown = listing.scoreBreakdown ?? listing.score?.components;
  const rationale = listing.rationale ?? listing.score?.rationale ?? [];
  const confidenceScore =
    listing.confidenceScore ?? Math.min(95, Math.max(55, Math.round(totalScore * 0.9)));
  const flags = listing.flags ?? [];
  return { totalScore, breakdown, rationale, confidenceScore, flags };
};

const getRankNarrative = (listing: DemoListing, rank?: number, total?: number) => {
  const score = getScoreSummary(listing);
  const drivers: string[] = [];
  if (score.breakdown?.hours && score.breakdown.hours >= 80) {
    drivers.push("low operating hours");
  }
  if (score.breakdown?.price && score.breakdown.price >= 80) {
    drivers.push("competitive pricing");
  }
  if (score.breakdown?.state && score.breakdown.state >= 100) {
    drivers.push("preferred state placement");
  }
  if (!drivers.length) {
    drivers.push("balanced price and usage profile");
  }
  const rankText =
    rank && total ? `Ranked #${rank} of ${total} listings.` : "Ranking computed from the current inventory set.";
  return `${rankText} It stands out for ${drivers.join(", ")}.`;
};

export const DemoListingDetail = () => {
  const { id } = useParams();
  const watchlist = useDemoWatchlist();
  const [activeImage, setActiveImage] = useState(0);

  const listingQuery = useQuery({
    queryKey: ["demo-listing", id],
    queryFn: () => getDemoListing(id ?? ""),
    enabled: Boolean(id),
  });

  const rankingQuery = useQuery({
    queryKey: ["demo-listings-ranking"],
    queryFn: () => getDemoListings({}),
  });

  const ranking = useMemo(() => {
    const listings = rankingQuery.data?.listings ?? [];
    const sorted = [...listings].sort((a, b) => {
      const aScore = getScoreSummary(a).totalScore;
      const bScore = getScoreSummary(b).totalScore;
      if (bScore !== aScore) return bScore - aScore;
      return (a.price ?? 0) - (b.price ?? 0);
    });
    const index = sorted.findIndex((item) => item.id === id);
    return {
      rank: index >= 0 ? index + 1 : undefined,
      total: sorted.length || undefined,
    };
  }, [id, rankingQuery.data?.listings]);

  if (listingQuery.isLoading) {
    return <div className="rounded-2xl bg-white/70 p-6 shadow">Loading listing...</div>;
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Unable to load listing details.
      </div>
    );
  }

  const listing = listingQuery.data;
  const score = getScoreSummary(listing);
  const images = listing.images?.length
    ? listing.images
    : listing.imageUrl
    ? [listing.imageUrl]
    : [];

  useEffect(() => {
    setActiveImage(0);
  }, [listing.id]);

  const activeImageUrl = images[activeImage] ?? images[0];
  const handlePrev = () => {
    if (!images.length) return;
    setActiveImage((index) => (index - 1 + images.length) % images.length);
  };
  const handleNext = () => {
    if (!images.length) return;
    setActiveImage((index) => (index + 1) % images.length);
  };

  return (
    <div className="space-y-8">
      <Link to="/demo" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← Back to ranked listings
      </Link>

      <section className="grid gap-6 rounded-3xl border border-black/10 bg-white/90 p-8 shadow-xl shadow-orange-100/60 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-black/10 bg-slate-100/80 p-4">
            <div className="relative overflow-hidden rounded-2xl">
              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt={`${listing.title} gallery ${activeImage + 1}`}
                  className="h-64 w-full object-cover sm:h-72"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  No images available.
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow"
                  >
                    Prev
                  </button>
                  <div className="rounded-full bg-white/90 px-3 py-1 text-xs text-slate-600 shadow">
                    {activeImage + 1} / {images.length}
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    key={`${listing.id}-image-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`overflow-hidden rounded-xl border ${
                      index === activeImage ? "border-amber-500" : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${listing.title} thumbnail ${index + 1}`}
                      className="h-16 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{listing.category}</p>
          <h2 className="demo-title text-3xl font-semibold text-slate-900">
            {listing.title || "Listing"}
          </h2>
          <p className="text-sm text-slate-600">{listing.description || "No description provided."}</p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span>{formatCurrency(listing.price)}</span>
            <span>{formatHours(listing.hours)}</span>
            <span>{listing.state || "State N/A"}</span>
            <span>{listing.source || "Source N/A"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {score.flags.length ? (
              score.flags.map((flag) => (
                <span
                  key={flag}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    flag === "Best Option"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {flag}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No flags</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => watchlist.toggle(listing.id)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            {watchlist.isInWatchlist(listing.id) ? "Remove from watchlist" : "Add to watchlist"}
          </button>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/10 bg-amber-50/70 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Score</p>
            <p className="demo-title text-4xl font-semibold text-slate-900">
              {score.totalScore}
            </p>
            <p className="text-xs text-slate-500">Confidence {score.confidenceScore}%</p>
            <p className="mt-3 text-sm text-slate-600">
              {getRankNarrative(listing, ranking.rank, ranking.total)}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Score Breakdown</p>
            <div className="mt-3 space-y-3">
              {[
                { key: "operable", label: "Operable", value: score.breakdown?.operable ?? 0 },
                { key: "hours", label: "Hours", value: score.breakdown?.hours ?? 0 },
                { key: "price", label: "Price", value: score.breakdown?.price ?? 0 },
                { key: "state", label: "State Fit", value: score.breakdown?.state ?? 0 },
              ].map((item) => (
                <div key={item.key} className="space-y-1 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-amber-400"
                      style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ranking Rationale</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {(score.rationale.length ? score.rationale : ["Score details pending."]).map(
              (item, index) => (
                <li key={`${listing.id}-detail-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>{item}</span>
                </li>
              )
            )}
          </ul>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Listing Details</p>
          <dl className="mt-4 grid gap-4 text-sm text-slate-600">
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</dt>
              <dd className="text-base font-semibold text-slate-900">{listing.category}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</dt>
              <dd className="text-base font-semibold text-slate-900">{listing.state}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatCurrency(listing.price)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Hours</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatHours(listing.hours)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Operable</dt>
              <dd className="text-base font-semibold text-slate-900">
                {listing.operable ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Listed</dt>
              <dd className="text-base font-semibold text-slate-900">
                {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : "N/A"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
};
