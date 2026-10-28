"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Shirt } from "lucide-react";

export type HomeCarouselItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  images: { src: string; alt: string }[];
  details: string[];
};

type Props = {
  title: string;
  eyebrow: string;
  items: HomeCarouselItem[];
  loading: boolean;
  error: string;
  emptyMessage: string;
  layout: "garment" | "outfit";
};

export default function HomeCarousel({
  title,
  eyebrow,
  items,
  loading,
  error,
  emptyMessage,
  layout,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const currentIndex = items.length ? activeIndex % items.length : 0;

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  function move(direction: -1 | 1) {
    setActiveIndex((index) => (index + direction + items.length) % items.length);
  }

  return (
    <section
      aria-label={title}
      className="relative z-10 flex h-full flex-col rounded-[24px] p-4 sm:p-5"
      style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
            {eyebrow}
          </p>
          <h2 className="text-xl font-light mt-1" style={{ color: "#2C3E2D" }}>{title}</h2>
        </div>
        <span className="text-xs whitespace-nowrap" style={{ color: "#9a9a8e" }}>
          {items.length ? `${currentIndex + 1} / ${items.length}` : ""}
        </span>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm" style={{ color: "#9a9a8e" }}>Cargando...</p>
      ) : error ? (
        <p className="py-6 text-center text-sm" style={{ color: "#b85555" }}>{error}</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm" style={{ color: "#9a9a8e" }}>{emptyMessage}</p>
      ) : (
        <>
          <Link
            href={items[currentIndex].href}
            aria-label={`${items[currentIndex].title}: ${items[currentIndex].description}`}
            className="block overflow-hidden rounded-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ outlineColor: "#2C3E2D" }}
          >
            <div
              className={`mx-auto overflow-hidden ${layout === "outfit"
                ? `h-[340px] w-full max-w-[272px] ${items[currentIndex].images.length <= 1 ? "flex items-center justify-center" : `grid ${items[currentIndex].images.length === 2 ? "grid-cols-1 grid-rows-2" : "grid-cols-2 grid-rows-2"} gap-1 p-1`}`
                : "flex h-[280px] w-full max-w-[260px] items-center justify-center sm:h-[320px]"}`}
              style={{ background: "linear-gradient(135deg,#eaf4eb,#f4ede2)" }}
            >
              {items[currentIndex].images.length ? (
                items[currentIndex].images.slice(0, 4).map((image, index) => (
                  <div
                    key={`${items[currentIndex].id}-${image.src}-${index}`}
                    className={`relative min-h-0 min-w-0 overflow-hidden ${layout === "outfit" && items[currentIndex].images.length > 1 ? "rounded-xl bg-white/70" : "h-full w-full"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt={image.alt}
                      className={`h-full w-full ${layout === "outfit" ? "object-contain p-2" : "object-contain p-4"}`}
                    />
                    {layout === "outfit" && items[currentIndex].images.length > 1 && (
                      <span
                        className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                        style={{ background: "#2C3E2D", color: "#F9F5F0" }}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <Shirt size={44} color="#A8C5A0" />
              )}
            </div>
            <div className="px-4 py-3" style={{ background: "rgba(255,255,255,0.9)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-light" style={{ color: "#1a1a1a" }}>
                    {items[currentIndex].title}
                  </h3>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em]" style={{ color: "#9a9a8e" }}>
                    {items[currentIndex].category}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {items[currentIndex].details.map((detail) => (
                    <span
                      key={detail}
                      className="rounded-full px-2 py-1 text-[10px]"
                      style={{ background: "rgba(168,197,160,0.2)", color: "#3d5c3e" }}
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs" style={{ color: "#6b6b60" }}>
                {items[currentIndex].description}
              </p>
            </div>
          </Link>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={items.length < 2}
              aria-label="Imagen anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-40"
              style={{ borderColor: "#e8e4de", color: "#2C3E2D" }}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1.5" aria-label={`Elemento ${currentIndex + 1} de ${items.length}`}>
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Mostrar ${item.title}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: index === currentIndex ? 18 : 7,
                    background: index === currentIndex ? "#2C3E2D" : "#d8d5ce",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={items.length < 2}
              aria-label="Imagen siguiente"
              className="flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-40"
              style={{ borderColor: "#e8e4de", color: "#2C3E2D" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
