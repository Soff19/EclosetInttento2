"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";

type Outfit = {
  id: string;
  nombre: string;
  categoria?: string | null;
  outfitPrendas: { prenda: { id: string; urlImagen: string; categoria: string } }[];
};

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [error, setError] = useState("");

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
      setOutfits(data.outfits || []);
    })();
  }, []);

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
            <article
              key={o.id}
              className="rounded-[24px] p-4"
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
            </article>
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
      <BottomNavigation />
    </main>
  );
}
