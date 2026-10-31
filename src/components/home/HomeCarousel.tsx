"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Shirt } from "lucide-react";

export type HomeCarouselItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  images: { src: string; alt: string }[];
  details: string[];
  favorite?: boolean;
};

type Props = {
  title: string;
  eyebrow: string;
  items: HomeCarouselItem[];
  loading: boolean;
  error: string;
  emptyMessage: string;
  layout: "garment" | "outfit" | "market";
  onToggleFavorite?: (item: HomeCarouselItem) => Promise<void>;
};

export default function HomeCarousel({
  title,
  eyebrow,
  items,
  loading,
  error,
  emptyMessage,
  layout,
  onToggleFavorite,
}: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);

  function move(direction: -1 | 1) {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.8,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <section
      aria-label={title}
      className="relative z-10 flex h-full flex-col rounded-2xl border border-[#E5E1D9] bg-white p-4 sm:p-5"
      style={{ boxShadow: "0 4px 18px rgba(11,73,61,0.04)" }}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b6b60]">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1 font-[family-name:var(--font-cormorant-garamond)] text-2xl leading-tight text-[#0B493D]">{title}</h2>
        </div>
        {items.length > 1 && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={`Desplazar ${title} hacia la izquierda`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E1D9] text-[#0B493D] transition hover:border-[#A8BC99] hover:bg-[#C6EFD6]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={`Desplazar ${title} hacia la derecha`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E1D9] text-[#0B493D] transition hover:border-[#A8BC99] hover:bg-[#C6EFD6]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm" style={{ color: "#9a9a8e" }}>Cargando...</p>
      ) : error ? (
        <p className="py-6 text-center text-sm" style={{ color: "#b85555" }}>{error}</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm" style={{ color: "#9a9a8e" }}>{emptyMessage}</p>
      ) : (
        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-color:#A8BC99_#F7F1E7] [scrollbar-width:thin]"
          aria-label={`${title}, ${items.length} elementos`}
        >
          {items.map((item) => (
            <article
              key={item.id}
              className="relative w-[min(68vw,10rem)] shrink-0 snap-start overflow-hidden rounded-xl border border-[#E5E1D9] bg-white transition duration-200 hover:border-[#A8BC99] hover:shadow-[0_8px_24px_rgba(11,73,61,0.08)]"
            >
              <Link
                href={item.href}
                aria-label={`${item.title}: ${item.description}`}
                className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
              >
                <div
                  className={`relative aspect-[4/5] w-full overflow-hidden ${
                    layout === "outfit" && item.images.length > 1
                      ? `grid ${item.images.length === 2 ? "grid-cols-1 grid-rows-2" : "grid-cols-2 grid-rows-2"} gap-1 p-1`
                      : "flex items-center justify-center"
                  }`}
                  style={{ background: "#F7F1E7" }}
                >
                  {item.images.length ? (
                    item.images.slice(0, 4).map((image, index) => (
                      <div
                        key={`${item.id}-${image.src}-${index}`}
                        className={`relative min-h-0 min-w-0 overflow-hidden ${layout === "outfit" && item.images.length > 1 ? "rounded-lg border border-[#E5E1D9] bg-white" : "h-full w-full"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.src}
                          alt={image.alt}
                          className={`h-full w-full object-contain transition duration-200 group-hover:scale-[1.02] ${layout === "outfit" ? "p-2" : "p-3"}`}
                        />
                        {layout === "outfit" && item.images.length > 1 && (
                          <span
                            className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                            style={{ background: "#0B493D", color: "#F7F1E7" }}
                          >
                            {index + 1}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <Shirt size={36} color="#6CAF7B" />
                  )}
                </div>
                <div className="min-h-24 bg-white px-3 py-2.5">
                  <h3 className="truncate text-sm font-semibold text-[#333333]">
                    {item.title}
                  </h3>
                  <p className="mt-1 truncate text-[11px] uppercase tracking-[0.1em] text-[#6b6b60]">
                    {item.category}
                  </p>
                  {item.details.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.details.slice(0, 2).map((detail) => (
                        <span
                          key={detail}
                          className="rounded-md px-1.5 py-1 text-[10px] font-semibold"
                          style={{ background: "#C6EFD6", color: "#0B493D" }}
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 line-clamp-2 text-xs leading-4 text-[#55524C]">
                    {item.description}
                  </p>
                </div>
              </Link>
              {onToggleFavorite && (
                <button
                  type="button"
                  disabled={pendingFavoriteId === item.id}
                  aria-label={item.favorite ? `Quitar ${item.title} de favoritos` : `Agregar ${item.title} a favoritos`}
                  aria-pressed={Boolean(item.favorite)}
                  onClick={async () => {
                    setPendingFavoriteId(item.id);
                    try {
                      await onToggleFavorite(item);
                    } finally {
                      setPendingFavoriteId(null);
                    }
                  }}
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E1D9] bg-white/95 text-[#0B493D] transition hover:border-[#FF8F7E] hover:text-[#b85555] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
                >
                  <Heart size={17} fill={item.favorite ? "currentColor" : "none"} aria-hidden="true" />
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
