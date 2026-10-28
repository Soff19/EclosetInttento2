"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";

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
    <main className="min-h-screen px-5 pt-6 pb-32 relative overflow-hidden" style={{ backgroundColor: "#F9F5F0" }}>
      <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#A8C5A0" }} />
      <div className="relative z-10 max-w-xl mx-auto">
        <BackLink href="/closet" label="Vuelve a tu armario digital" />
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
              Looks
            </p>
            <h1 className="text-[2rem] font-light mt-1">Mis Outfits ✦</h1>
          </div>
          <Link
            href="/outfits/crear"
            className="px-4 py-3 rounded-[12px] text-xs uppercase tracking-[0.14em]"
            style={{ background: "#2C3E2D", color: "#F9F5F0" }}
          >
            Crear
          </Link>
        </div>

        {error && <p style={{ color: "#b85555" }}>{error}</p>}

        <div className="space-y-4">
          {outfits.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => openOutfit(o.id)}
              className="w-full rounded-[24px] p-4 text-left"
              style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
            >
              <p className="font-light text-lg">{o.nombre}</p>
              <p className="text-xs mt-1" style={{ color: "#9a9a8e" }}>
                {o.categoria || "Sin categoría"} · {o.outfitPrendas?.length || 0} prendas
              </p>
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {o.outfitPrendas?.slice(0, 4).map((op) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={op.prenda.id}
                    src={op.prenda.urlImagen}
                    alt={op.prenda.categoria}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ))}
              </div>
            </button>
          ))}

          <Link
            href="/outfits/crear"
            className="block rounded-[24px] p-8 text-center border-2 border-dashed"
            style={{ borderColor: "#A8C5A0", color: "#2C3E2D" }}
          >
            + Crear nuevo outfit
          </Link>
        </div>
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
            className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-[24px] p-5"
            style={{ background: "#F9F5F0", boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}
          >
            <button
              type="button"
              onClick={closeOutfit}
              aria-label="Cerrar outfit"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "#fff", color: "#2C3E2D" }}
            >
              <X size={19} />
            </button>
            <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>Detalle del look</p>
            <h2 id="outfit-detail-title" className="mt-1 pr-12 text-2xl font-light" style={{ color: "#2C3E2D" }}>
              {selectedOutfit.nombre}
            </h2>
            <p className="mt-1 text-xs" style={{ color: "#9a9a8e" }}>
              {selectedOutfit.categoria || "Sin categoría"} · {selectedOutfit.outfitPrendas.length} prendas
            </p>
            {selectedOutfit.descripcion && (
              <p className="mt-3 text-sm" style={{ color: "#6b6b60" }}>{selectedOutfit.descripcion}</p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {selectedOutfit.outfitPrendas.map(({ prenda }) => (
                <article
                  key={prenda.id}
                  className="overflow-hidden rounded-[18px]"
                  style={{ background: "#fff" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prenda.urlImagen} alt={prenda.nombre || prenda.categoria} className="aspect-[4/5] w-full object-contain p-3" />
                  <div className="p-3">
                    <p className="text-sm font-light">{prenda.nombre || prenda.categoria}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: "#9a9a8e" }}>
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
