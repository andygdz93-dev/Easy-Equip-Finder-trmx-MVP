import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DemoListing, getDemoListings } from "../lib/demoApi";
import { useDemoWatchlist } from "../lib/demoWatchlist";

const categories = [
  "All",
  "Excavator",
  "Dozer",
  "Skid Steer",
  "Wheel Loader",
  "Backhoe",
  "Telehandler",
];

const states = ["Any", "CA", "AZ", "TX", "IA", "NV", "CO", "WA", "OR", "UT"];

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

export const Demo = () => {
  const [category, setCategory] = useState("All");
  const [state, setState] = useState("Any");
  const [maxHours, setMaxHours] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const watchlist = useDemoWatchlist();

  const listingsQuery = useQuery({
    queryKey: ["demo-listings", state, maxHours, maxPrice],
    queryFn: () =>
      getDemoListings({
        state: state !== "Any" ? state : undefined,
        maxHours: maxHours ? Number(maxHours) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
  });

  const listings = listingsQuery.data?.listings ?? [];

  const filtered = useMemo(() => {
    if (category === "All") return listings;
    return listings.filter((listing) => listing.category === category);
  }, [category, listings]);

  const metrics = useMemo(() => {
    if (!filtered.length) {
      return { avgPrice: "N/A", avgScore: "N/A", avgHours: "N/A" };
    }
    const avgPrice =
      filtered.reduce((sum, listing) => sum + (listing.price ?? 0), 0) / filtered.length;
    const avgHours =
      filtered.reduce((sum, listing) => sum + (listing.hours ?? 0), 0) / filtered.length;
    const avgScore =
      filtered.reduce((sum, listing) => sum + getScoreSummary(listing).totalScore, 0) /
      filtered.length;
    return {
      avgPrice: formatCurrency(avgPrice),
      avgHours: `${Math.round(avgHours).toLocaleString()} hrs`,
      avgScore: `${Math.round(avgScore)} / 100`,
    };
  }, [filtered]);

  return (
    <div className="space-y-10">
      <section className="grid gap-6 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-xl shadow-orange-100/70 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
              Ranked Equipment Marketplace
            </p>
            <h2 className="demo-title text-3xl font-semibold text-slate-900 md:text-4xl">
              Surface the best equipment deals in minutes, not weeks.
            </h2>
            <p className="text-sm text-slate-600 md:text-base">
              Every listing is scored against price, hours, and preferred-region fit,
              giving investors a clear path to high-quality inventory.
            </p>
          </div>
          <div className="grid gap-4 rounded-2xl border border-black/10 bg-amber-50/70 p-6 text-sm shadow-inner">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Portfolio Snapshot
              </p>
              <p className="text-xl font-semibold text-slate-900">
                {filtered.length} listings tracked
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Avg Price</p>
                <p className="text-base font-semibold">{metrics.avgPrice}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Hours</p>
                <p className="text-base font-semibold">{metrics.avgHours}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Score</p>
                <p className="text-base font-semibold">{metrics.avgScore}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Category
            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Preferred State
            <select
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm"
              value={state}
              onChange={(event) => setState(event.target.value)}
            >
              {states.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Max Price
            <input
              type="number"
              min="0"
              placeholder="250000"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Max Hours
            <input
              type="number"
              min="0"
              placeholder="8000"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm"
              value={maxHours}
              onChange={(event) => setMaxHours(event.target.value)}
            />
          </label>
        </div>
      </section>

      {listingsQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-3xl bg-white/60" />
          ))}
        </div>
      ) : listingsQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Unable to load demo listings. Please refresh.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6 text-sm text-slate-600">
          No listings match the current filters. Try broadening your criteria.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((listing) => {
            const score = getScoreSummary(listing);
            const isBest = score.flags.includes("Best Option");
            return (
              <article
                key={listing.id}
                className={`group grid gap-4 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-lg shadow-orange-100/60 transition hover:-translate-y-1 ${
                  isBest ? "ring-2 ring-amber-400/70" : ""
                }`}
              >
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-slate-100">
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title || "Listing"}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center text-sm text-slate-500">
                      No image available.
                    </div>
                  )}
                  {listing.images?.length ? (
                    <div className="grid grid-cols-4 gap-2 bg-white/80 p-3">
                      {listing.images.slice(0, 4).map((image, index) => (
                        <img
                          key={`${listing.id}-thumb-${index}`}
                          src={image}
                          alt={`${listing.title} preview ${index + 1}`}
                          className="h-16 w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {listing.category}
                    </p>
                    <h3 className="demo-title text-xl font-semibold text-slate-900">
                      {listing.title || "Untitled listing"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {listing.state || "Unknown"} · {listing.source || "Unknown source"}
                    </p>
                  </div>
                  <div className="grid gap-2 text-right">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        score.totalScore >= 85
                          ? "bg-emerald-500 text-white"
                          : score.totalScore >= 70
                          ? "bg-amber-400 text-slate-900"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      Score {score.totalScore}
                    </span>
                    <span className="text-xs text-slate-500">
                      Confidence {score.confidenceScore}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                  <span>{formatCurrency(listing.price)}</span>
                  <span>{formatHours(listing.hours)}</span>
                  <span>{listing.state || "State N/A"}</span>
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
                <ul className="space-y-1 text-sm text-slate-600">
                  {(score.rationale.length ? score.rationale : ["Score available on detail view."])
                    .slice(0, 3)
                    .map((item, index) => (
                      <li key={`${listing.id}-rationale-${index}`} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={`/demo/listings/${listing.id}`}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View details
                  </Link>
                  <button
                    type="button"
                    onClick={() => watchlist.toggle(listing.id)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    {watchlist.isInWatchlist(listing.id)
                      ? "Remove from watchlist"
                      : "Add to watchlist"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
