"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";
import EditorialSectionBanner from "@/components/EditorialSectionBanner";
import styles from "../fashion-sections.module.css";

type Outfit = {
  id: string;
  nombre: string;
  categoria?: string | null;
  descripcion?: string | null;
  outfitPrendas: { prenda: { id: string; nombre?: string | null; urlImagen: string; categoria: string; color?: string | null; talle?: string | null } }[];
};

export default function OutfitsPage() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const closeOutfit = useCallback(() => {
    setSelectedOutfitId(null);
    router.push("/outfits", { scroll: false });
  }, [router]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/outfits", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error cargando outfits");
        return;
      }
      const loadedOutfits: Outfit[] = data.outfits || [];
      setOutfits(loadedOutfits);
      const requestedOutfitId = new URLSearchParams(window.location.search).get("outfit");
      if (requestedOutfitId && loadedOutfits.some((outfit) => outfit.id === requestedOutfitId)) {
        setSelectedOutfitId(requestedOutfitId);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedOutfitId) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeOutfit();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedOutfitId, closeOutfit]);

  function openOutfit(outfitId: string) {
    setSelectedOutfitId(outfitId);
    router.push(`/outfits?outfit=${encodeURIComponent(outfitId)}`, { scroll: false });
  }

  const selectedOutfit = outfits.find((outfit) => outfit.id === selectedOutfitId);

  return (
    <main className={`${styles.page} min-h-screen px-0 pb-32 pt-0`}>
      <EditorialSectionBanner
        id="outfits-title"
        eyebrow="Looks guardados"
        title="Mis Outfits"
        description="Explorá tus combinaciones guardadas y volvé a tus looks favoritos."
        intro={<BackLink href="/closet" label="Volvé a tu closet" iconOnly className={`!mb-0 ${styles.bannerBackLink}`} />}
      >
        <Link href="/outfits/crear" className={styles.bannerAction}>
          Crear outfit
        </Link>
      </EditorialSectionBanner>
      <div className={`${styles.content} relative z-10 px-4 pt-6 sm:px-6`}>

        {error && <p role="alert" className={`${styles.error} mb-4`}>{error}</p>}

        {outfits.length > 0 ? (
        <div className={styles.outfitGrid}>
          {outfits.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => openOutfit(o.id)}
              className={`${styles.outfitCard} w-full`}
            >
              <div className={styles.outfitImages}>
                {o.outfitPrendas?.slice(0, 4).map((op) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={op.prenda.id}
                    src={op.prenda.urlImagen}
                    alt={op.prenda.categoria}
                    className="w-full"
                  />
                ))}
                {o.outfitPrendas.length === 0 && (
                  <div className="col-span-2 flex aspect-[4/3] items-center justify-center rounded-lg bg-[#E5E1D9] text-xs font-semibold text-[#55524C]">
                    Sin prendas asociadas
                  </div>
                )}
              </div>
              <div className={styles.outfitInfo}>
                <p className="truncate text-sm font-bold text-[#333333]">{o.nombre}</p>
                <p className="mt-1 truncate text-xs text-[#55524C]">
                  {o.categoria || "Sin categoría"} · {o.outfitPrendas?.length || 0} prendas
                </p>
                {o.descripcion && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#55524C]">{o.descripcion}</p>}
              </div>
            </button>
          ))}
        </div>
        ) : !error ? (
          <div className={`${styles.surface} mt-5 p-5`}>
            <p className="text-sm text-[#55524C]">Todavía no guardaste outfits.</p>
            <Link href="/outfits/crear" className={`${styles.primaryButton} mt-4`}>Crear mi primer outfit</Link>
          </div>
        ) : null}
        {outfits.length > 0 && <div className="mt-5">
          <Link
            href="/outfits/crear"
            className={`${styles.secondaryButton} w-full`}
          >
            + Crear nuevo outfit
          </Link>
        </div>}
      </div>
      {selectedOutfit && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeOutfit();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="outfit-detail-title"
            className={`${styles.surface} relative max-h-full w-full max-w-lg overflow-y-auto p-5`}
          >
            <button
              type="button"
              onClick={closeOutfit}
              aria-label="Cerrar outfit"
              className={`${styles.iconButton} absolute right-4 top-4 z-10 h-10 w-10 rounded-full p-0`}
            >
              <X size={19} />
            </button>
            <p className={styles.eyebrow}>Detalle del look</p>
            <h2 id="outfit-detail-title" className={`${styles.title} pr-12 text-3xl`}>
              {selectedOutfit.nombre}
            </h2>
            <p className="mt-2 text-sm text-[#55524C]">
              {selectedOutfit.categoria || "Sin categoría"} · {selectedOutfit.outfitPrendas.length} prendas
            </p>
            {selectedOutfit.descripcion && (
              <p className="mt-3 text-sm leading-6 text-[#55524C]">{selectedOutfit.descripcion}</p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {selectedOutfit.outfitPrendas.map(({ prenda }) => (
                <article
                  key={prenda.id}
                  className={`${styles.surface} overflow-hidden`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prenda.urlImagen} alt={prenda.nombre || prenda.categoria} className="aspect-[4/5] w-full object-contain p-3" />
                  <div className="p-3">
                    <p className="text-sm font-bold">{prenda.nombre || prenda.categoria}</p>
                    <p className="mt-1 text-xs text-[#55524C]">
                      {[prenda.categoria, prenda.color, prenda.talle ? `Talle ${prenda.talle}` : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
      <BottomNavigation />
    </main>
  );
}
