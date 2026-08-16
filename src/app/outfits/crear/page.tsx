"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import GarmentCard from "@/components/closet/GarmentCard";
import type { Prenda } from "@/types/prenda";

export default function CrearOutfitPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Casual");
  const [descripcion, setDescripcion] = useState("");
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrendas, setLoadingPrendas] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/prendas", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setPrendas(data.prendas || []);
      } finally {
        setLoadingPrendas(false);
      }
    })();
  }, []);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function guardarOutfit() {
    setError("");
    if (!nombre.trim()) {
      setError("El nombre del outfit es obligatorio");
      return;
    }
    if (selected.length === 0) {
      setError("Seleccioná al menos una prenda de tu closet");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/outfits", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombre,
          categoria,
          descripcion,
          prendas_ids: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear outfit");
        return;
      }
      router.push("/outfits");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-5 pt-6 pb-28 relative overflow-hidden" style={{ backgroundColor: "#F9F5F0" }}>
      <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#A8C5A0" }} />
      <div className="absolute bottom-0 right-[-80px] w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#C9A96E" }} />

      <div className="relative z-10 max-w-xl mx-auto">
        <BackLink href="/outfits" label="Volver a Mis Outfits" />

        <div className="mb-8">
          <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
            Nuevo outfit
          </p>
          <h1 className="text-[2rem] font-light mt-1">Crear Outfit ✨</h1>
        </div>

        <div
          className="rounded-[30px] p-6 mb-6"
          style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <div
            className="h-40 rounded-[24px] flex items-center justify-center text-5xl mb-6"
            style={{ background: "linear-gradient(135deg,#d7ead4,#f4ede2)" }}
          >
            👕👖👟
          </div>

          <label className="block mb-2 text-sm">Nombre del Outfit</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            type="text"
            placeholder="Ej: Look de Oficina"
            className="w-full rounded-2xl border px-4 py-3 outline-none mb-5"
          />

          <label className="block mb-2 text-sm">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 outline-none mb-5"
          >
            {["Casual", "Vintage", "Street", "Minimal", "Eco", "Formal"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <label className="block mb-2 text-sm">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Describe tu outfit..."
            className="w-full rounded-2xl border px-4 py-3 outline-none resize-none mb-2"
          />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
              Prendas del closet
            </p>
            <h2 className="text-lg font-light mt-1">Elegí qué incluir</h2>
          </div>
          <span className="text-xs" style={{ color: "#A8C5A0" }}>
            {selected.length} seleccionadas
          </span>
        </div>

        {loadingPrendas && <p style={{ color: "#9a9a8e" }}>Cargando prendas...</p>}

        {!loadingPrendas && prendas.length === 0 && (
          <div
            className="rounded-[24px] p-6 mb-6 text-center"
            style={{ background: "rgba(255,255,255,0.85)", border: "1px dashed #A8C5A0" }}
          >
            <p className="text-sm mb-3" style={{ color: "#6b6b60" }}>
              Todavía no tenés prendas. Primero sumá algunas al closet.
            </p>
            <button
              onClick={() => router.push("/prendas/nueva")}
              className="px-4 py-3 rounded-[12px] text-sm"
              style={{ background: "#2C3E2D", color: "#F9F5F0" }}
            >
              Ir a nueva prenda
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {prendas.map((prenda) => (
            <GarmentCard
              key={prenda.id}
              prenda={prenda}
              selectable
              selected={selected.includes(prenda.id)}
              onToggle={() => toggle(prenda.id)}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm" style={{ color: "#b85555" }}>
            {error}
          </p>
        )}

        <button
          onClick={guardarOutfit}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-medium transition hover:opacity-90"
          style={{ background: "#2C3E2D", color: "#F9F5F0" }}
        >
          {loading ? "Guardando..." : "Guardar Outfit"}
        </button>
      </div>
    </main>
  );
}
