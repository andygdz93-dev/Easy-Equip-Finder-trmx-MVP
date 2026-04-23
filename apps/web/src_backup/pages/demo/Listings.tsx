import { useState } from "react";
import { Link } from "react-router-dom";
import type { Listing, ScoreBreakdown } from "@easyfinderai/shared";
import { demoListings, defaultScoringConfig, scoreListing } from "@easyfinderai/shared";
import { useDemoWatchlist } from "../../lib/demoWatchlist";
import { formatCategory, formatListingHours, formatListingPrice } from "../../lib/formatters";
import ImageGallery from "../../components/ImageGallery";

export default function DemoListings() {
  const watchlist = useDemoWatchlist();
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const ranked = demoListings
    .map((listing) => ({
      listing,
      score: scoreListing(listing, defaultScoringConfig),
    }))
    .sort((a, b) => (b.score.total ?? 0) - (a.score.total ?? 0));

  const visibleListings = showWatchlistOnly
    ? ranked.filter(({ listing }) =>
        listing.id ? watchlist.isInWatchlist(listing.id) : false
      )
    : ranked;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* HEADER */}
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-100">EasyFinder Ranked Inventory</h1>
        <p className="mt-2 text-slate-300">
          AI-assisted heavy equipment sourcing, tuned for capital efficiency.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
          <span>
            Saved listings: <strong className="text-slate-100">{watchlist.ids.length}</strong>
          </span>
          <Link
            to="/demo/watchlist"
            className="rounded-full border border-amber-200/40 px-3 py-1 text-xs font-semibold text-amber-100 hover:border-amber-200/70"
          >
            View watchlist
          </Link>
          <button
            type="button"
            onClick={() => setShowWatchlistOnly((prev) => !prev)}
            className="rounded-full border border-slate-500 px-3 py-1 text-xs font-semibold text-slate-100 hover:border-slate-300"
          >
            {showWatchlistOnly ? "Show all listings" : "Show watchlist only"}
          </button>
        </div>
      </section>

      {/* LISTINGS GRID */}
      <section className="grid place-items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleListings.map(({ listing, score }) => {
          const listingId = listing.id ?? "";
          return (
          <ListingCard
            key={listingId || listing.title || "listing"}
            listing={listing}
            score={score.total ?? 0}
            reasons={score.reasons ?? []}
            confidence={score.confidence ?? 0}
            isSaved={listingId ? watchlist.isInWatchlist(listingId) : false}
            onToggleWatchlist={() => {
              if (!listingId) return;
              watchlist.toggle(listingId);
            }}
          />
          );
        })}
      </section>
    </div>
  );
}

/* ---------------- CARD ---------------- */

function ListingCard({
  listing,
  score,
  reasons = [],
  confidence,
  isSaved,
  onToggleWatchlist,
}: {
  listing: Listing;
  score: number;
  reasons: ScoreBreakdown["reasons"];
  confidence: number;
  isSaved: boolean;
  onToggleWatchlist: () => void;
}) {
  const images = listing.images?.length
    ? listing.images
    : listing.imageUrl
    ? [listing.imageUrl]
    : [];
  const displayPrice = formatListingPrice(listing.price);
  const displayHours = formatListingHours(listing.hours);

  return (
    <div
      className="w-full max-w-[460px] justify-self-center overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
      data-testid="listing-card"
    >
      {/* IMAGE */}
      <div className="p-4 md:p-5">
        <ImageGallery
          images={images}
          alt={listing.title || "Listing image"}
          maxThumbs={4}
          imagesKey={listing.id ?? listing.title}
          autoCycle
          cycleMs={2500}
          heroClassName="h-48"
          heroTestId="demo-card-hero"
          heroImageTestId="listing-hero"
          thumbsClassName="mt-3"
          thumbsTestId="demo-card-thumbs"
          thumbImageTestId="listing-thumb"
          fallbackSrc="/demo-images/other/1.jpg"
        />
      </div>

      {/* CONTENT */}
      <div className="space-y-2 p-4 md:p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {formatCategory(listing.category)}
        </p>

        <h3 className="text-base font-semibold leading-tight text-slate-900 md:text-lg">{listing.title}</h3>

        <div className="text-sm text-slate-600">
          {displayPrice} {displayHours ? `• ${displayHours}` : ""} • {listing.state ?? "—"}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black">
              Score {Math.round(score ?? 0)}
            </span>
            <span
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600"
              title={`Confidence ${(confidence * 100).toFixed(0)}% based on data completeness.`}
            >
              Confidence {(confidence * 100).toFixed(0)}%
            </span>
          </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onToggleWatchlist}
              className="bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 px-4 py-2 rounded"
            >
              {isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
            </button>
            <Link
              to={`/demo/listings/${listing.id}`}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              View Details
            </Link>
          </div>
          </div>
          <ul className="list-disc space-y-1 pl-4 text-xs text-slate-500">
            {reasons.slice(0, 3).map((reason, index) => (
              <li key={`${index}-${typeof reason === "string" ? reason : reason.message}`}>{typeof reason === "string" ? reason : reason.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
