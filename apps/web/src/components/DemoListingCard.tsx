import { Listing } from "@easyfinderai/shared";
import { useNavigate } from "react-router-dom";
import { useDemoWatchlist } from "../lib/demoWatchlist";
import { formatCategory, formatListingHours, formatListingPrice } from "../lib/formatters";
import ImageGallery from "./ImageGallery";

type Props = {
  listing: Listing;
};

export default function DemoListingCard({ listing }: Props) {
  const navigate = useNavigate();
  const watchlist = useDemoWatchlist();

  const images = listing.images?.length
    ? listing.images
    : listing.imageUrl
    ? [listing.imageUrl]
    : [];
  const listingId = listing.id ?? "";
  const isSaved = listingId ? watchlist.isInWatchlist(listingId) : false;
  const displayPrice = formatListingPrice(listing.price);
  const displayHours = formatListingHours(listing.hours);

  return (
    <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* IMAGE */}
      <div className="p-4 md:p-5">
        <ImageGallery
          images={images}
          alt={listing.title ?? "Listing image"}
          imagesKey={listing.id ?? listing.title}
          autoCycle
          cycleMs={2500}
          maxThumbs={4}
          heroClassName="h-48"
          heroImageClassName="bg-slate-100 object-contain"
          thumbsClassName="mt-3"
          thumbClassName="h-10 sm:h-12"
          fallbackSrc="/demo-images/other/1.jpg"
          heroTestId="demo-card-hero"
        />
      </div>

      {/* CONTENT */}
      <div className="space-y-2 p-4 md:p-5">
        <div className="text-xs uppercase tracking-wide text-gray-500">
          {formatCategory(listing.category)}
        </div>

        <h3 className="text-base font-semibold leading-tight text-slate-900 md:text-lg">
          {listing.title ?? "Untitled listing"}
        </h3>

        <div className="text-sm text-gray-600">
          {displayPrice} {displayHours ? `· ${displayHours}` : ""} · {listing.state ?? "—"}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            className="rounded-md bg-black px-3 py-2 text-sm text-white"
            onClick={() => {
              if (!listingId) return;
              navigate(`/demo/listings/${listingId}`);
            }}
          >
            View Details
          </button>

          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => {
              if (!listingId) return;
              watchlist.toggle(listingId);
            }}
          >
            {isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
