"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import ClosetSearch from "@/components/closet/ClosetSearch";
import ClosetFilters from "@/components/closet/ClosetFilters";
import GarmentCard from "@/components/closet/GarmentCard";
import BottomNavigation from "@/components/closet/BottomNavigation";
import BackLink from "@/components/BackLink";
import type { Prenda } from "@/types/prenda";

export default function ClosetPage() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/prendas", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) setPrendas(data.prendas || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categorias = useMemo(() => [...new Set(prendas.map((p) => p.categoria))], [prendas]);

  const prendasFiltradas = useMemo(() => {
    return prendas.filter((prenda) => {
      const haystack = `${prenda.nombre || ""} ${prenda.categoria} ${prenda.color || ""}`.toLowerCase();
      const coincideBusqueda = haystack.includes(search.toLowerCase());
      const coincideCategoria = categoriaActiva === "Todos" || prenda.categoria === categoriaActiva;
      return coincideBusqueda && coincideCategoria;
    });
  }, [prendas, search, categoriaActiva]);

  return (
    <main className="min-h-screen relative overflow-hidden px-5 pt-6 pb-32" style={{ backgroundColor: "#F9F5F0" }}>
      <div className="absolute -top-20 -left-15 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#A8C5A0" }} />
      <div className="absolute bottom-0 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#C9A96E" }} />

      <section className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <BackLink href="/home" label="Volver al home" />
          <button
            onClick={() => router.push("/calendario")}
            className="p-2 rounded-lg hover:opacity-70 transition"
            style={{ backgroundColor: "#F0EBE4" }}
            title="Ir al calendario"
          >
            <Calendar size={20} style={{ color: "#2C3E2D" }} />
          </button>
        </div>
        <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
          Tu espacio personal
        </p>
        <h1 className="text-[2.2rem] font-light tracking-[-0.02em] mt-2">Mi Closet ✦</h1>
        <p className="mt-2 text-sm" style={{ color: "#9a9a8e" }}>
          Organizá tu estilo y encontrá cada prenda fácilmente.
        </p>
      </section>

      <button
        onClick={() => router.push("/prendas/nueva")}
        className="mt-6 w-full rounded-xl py-4 flex items-center justify-center gap-2"
        style={{ background: "#2C3E2D", color: "#F9F5F0" }}
      >
        <Plus size={18} />
        NUEVA PRENDA
      </button>

      <button
        onClick={() => router.push("/outfits/crear")}
        className="mt-3 w-full rounded-xl py-4 flex items-center justify-center gap-2"
        style={{ background: "#fff", color: "#2C3E2D", border: "1px solid #e8e4de" }}
      >
        <Plus size={18} />
        NUEVO OUTFIT
      </button>

      <div className="mt-6 relative z-10 space-y-4">
        <ClosetSearch value={search} onChange={setSearch} />
        <ClosetFilters
          categorias={categorias}
          activa={categoriaActiva}
          onChange={setCategoriaActiva}
        />
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {loading && <p style={{ color: "#9a9a8e" }}>Cargando...</p>}
        {!loading && prendasFiltradas.length === 0 && (
          <p style={{ color: "#9a9a8e" }}>Todavía no hay prendas. ¡Sumá la primera!</p>
        )}
        {prendasFiltradas.map((prenda) => (
          <GarmentCard key={prenda.id} prenda={prenda} />
        ))}
      </section>

      <BottomNavigation />
    </main>
  );
}
