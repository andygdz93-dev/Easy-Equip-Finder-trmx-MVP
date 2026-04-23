import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clsx } from "clsx";

type ImageGalleryProps = {
  images: string[];
  alt: string;
  maxThumbs?: number;
  autoCycle?: boolean;
  cycleMs?: number;
  className?: string;
  imagesKey?: string | number;
  heroClassName?: string;
  heroImageClassName?: string;
  thumbsClassName?: string;
  thumbClassName?: string;
  thumbImageClassName?: string;
  emptyState?: ReactNode;
  fallbackSrc?: string;
  heroTestId?: string;
  heroImageTestId?: string;
  thumbsTestId?: string;
  thumbImageTestId?: string;
  getThumbTestId?: (index: number) => string;
};

function swap<T>(arr: T[], i: number, j: number) {
  const copy = arr.slice();
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export default function ImageGallery({
  images,
  alt,
  maxThumbs = 4,
  autoCycle = true,
  cycleMs = 2500,
  className,
  imagesKey,
  heroClassName,
  heroImageClassName,
  thumbsClassName,
  thumbClassName,
  thumbImageClassName,
  emptyState,
  fallbackSrc,
  heroTestId,
  heroImageTestId,
  thumbsTestId,
  thumbImageTestId,
  getThumbTestId,
}: ImageGalleryProps) {
  const normalizedImages = useMemo(() => (images ?? []).filter(Boolean), [images]);
  const resetKey = imagesKey ?? normalizedImages.join("|");
  const [gallery, setGallery] = useState<string[]>(normalizedImages);
  const [hoverHero, setHoverHero] = useState<string | null>(null);
  const [cycleNonce, setCycleNonce] = useState(0);

  useEffect(() => {
    setGallery(normalizedImages);
    setHoverHero(null);
    setCycleNonce(0);
  }, [resetKey, normalizedImages]);

  const activeHero = hoverHero ?? gallery[0] ?? fallbackSrc;
  const thumbnails = gallery.slice(0, maxThumbs);
  const canCycle = autoCycle && gallery.length > 1 && !hoverHero;

  useEffect(() => {
    if (!canCycle) return undefined;
    const interval = window.setInterval(() => {
      setGallery((current) =>
        current.length > 1 ? [...current.slice(1), current[0]] : current
      );
    }, cycleMs);

    return () => window.clearInterval(interval);
  }, [canCycle, cycleMs, cycleNonce, gallery.length]);

  const handleThumbClick = (index: number) => {
    setGallery((current) => {
      if (index <= 0 || index >= current.length) return current;
      return swap(current, 0, index);
    });
    setHoverHero(null);
    setCycleNonce((value) => value + 1);
  };

  if (!activeHero) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <div className={clsx("space-y-3", className)}>
      <div
        className={clsx(
          "w-full overflow-hidden rounded-xl bg-slate-100",
          heroClassName
        )}
        data-testid={heroTestId}
      >
        <img
          src={activeHero}
          alt={alt}
          data-testid={heroImageTestId}
          className={clsx("h-full w-full", heroImageClassName)}
          loading="lazy"
          onError={
            fallbackSrc
              ? (event) => {
                  (event.currentTarget as HTMLImageElement).src = fallbackSrc;
                }
              : undefined
          }
        />
      </div>

      {thumbnails.length > 0 && (
        <div
          className={clsx("grid grid-cols-4 gap-2", thumbsClassName)}
          data-testid={thumbsTestId}
        >
          {thumbnails.map((src, idx) => {
            const actualIndex = idx;
            const isSelected = actualIndex === 0;
            return (
              <button
                key={`${src}-${actualIndex}`}
                type="button"
                data-testid={getThumbTestId?.(actualIndex)}
                className={clsx(
                  "overflow-hidden rounded-lg transition-opacity",
                  isSelected
                    ? "ring-2 ring-emerald-400"
                    : "opacity-80 hover:opacity-100",
                  thumbClassName
                )}
                onMouseEnter={() => setHoverHero(src)}
                onMouseLeave={() => setHoverHero(null)}
                onClick={() => handleThumbClick(actualIndex)}
              >
                <img
                  src={src}
                  alt={`${alt} thumbnail ${actualIndex}`}
                  data-testid={thumbImageTestId}
                  className={clsx("h-full w-full object-cover", thumbImageClassName)}
                  loading="lazy"
                  onError={
                    fallbackSrc
                      ? (event) => {
                          (event.currentTarget as HTMLImageElement).src = fallbackSrc;
                        }
                      : undefined
                  }
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
