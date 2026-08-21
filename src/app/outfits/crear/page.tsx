"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pin } from "lucide-react";
import BackLink from "@/components/BackLink";
import GarmentCard from "@/components/closet/GarmentCard";
import type { Prenda } from "@/types/prenda";

export default function CrearOutfitPage() {
  const router = useRouter();
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "styling">("grid");
  const [pinnedRows, setPinnedRows] = useState<string[]>([]);
  const [stylingSelections, setStylingSelections] = useState<Record<string, string | null>>({});
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stylingSelectionsRef = useRef(stylingSelections);
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
        if (res.ok) {
          const fetchedPrendas: Prenda[] = data.prendas || [];
          setPrendas(fetchedPrendas);
          const initialSelections = {
            superior: fetchedPrendas.filter((prenda) => ["Remera", "Campera", "Abrigo", "Vestido", "Deportivo"].includes(prenda.categoria))[Math.floor(fetchedPrendas.filter((prenda) => ["Remera", "Campera", "Abrigo", "Vestido", "Deportivo"].includes(prenda.categoria)).length / 2)]?.id || null,
            inferior: fetchedPrendas.filter((prenda) => ["Pantalón", "Falda"].includes(prenda.categoria))[Math.floor(fetchedPrendas.filter((prenda) => ["Pantalón", "Falda"].includes(prenda.categoria)).length / 2)]?.id || null,
            calzado: fetchedPrendas.filter((prenda) => prenda.categoria === "Calzado")[Math.floor(fetchedPrendas.filter((prenda) => prenda.categoria === "Calzado").length / 2)]?.id || null,
          };
          setStylingSelections(initialSelections);
          setSelected(Object.values(initialSelections).filter((id): id is string => Boolean(id)));
        }
      } finally {
        setLoadingPrendas(false);
      }
    })();
  }, []);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const stylingRows = useMemo(() => [
    { key: "superior", label: "Superior", categorias: ["Remera", "Campera", "Abrigo", "Vestido", "Deportivo"] },
    { key: "inferior", label: "Inferior", categorias: ["Pantalón", "Falda"] },
    { key: "calzado", label: "Calzado", categorias: ["Calzado"] },
  ].map((row) => ({
    ...row,
    prendas: prendas.filter((prenda) => row.categorias.includes(prenda.categoria)),
  })), [prendas]);

  useEffect(() => {
    stylingSelectionsRef.current = stylingSelections;
  }, [stylingSelections]);

  useEffect(() => {
    if (view !== "styling") return;
    stylingRows.forEach((row) => {
      const selectedId = stylingSelectionsRef.current[row.key];
      const scrollRow = rowRefs.current[row.key];
      const selectedCard = selectedId
        ? scrollRow?.querySelector<HTMLElement>(`[data-prenda-id="${selectedId}"]`)
        : null;
      if (scrollRow && selectedCard) {
        scrollRow.scrollLeft = selectedCard.offsetLeft - (scrollRow.clientWidth - selectedCard.offsetWidth) / 2;
      }
    });
  }, [view, stylingRows]);

  function selectCentered(rowKey: string) {
    if (pinnedRows.includes(rowKey)) return;
    const row = rowRefs.current[rowKey];
    if (!row) return;
    const center = row.getBoundingClientRect().left + row.clientWidth / 2;
    const cards = [...row.querySelectorAll<HTMLElement>("[data-prenda-id]")];
    const centered = cards.reduce<HTMLElement | null>((closest, card) => {
      if (!closest) return card;
      return Math.abs(card.getBoundingClientRect().left + card.offsetWidth / 2 - center) <
        Math.abs(closest.getBoundingClientRect().left + closest.offsetWidth / 2 - center) ? card : closest;
    }, null);
    const id = centered?.dataset.prendaId;
    if (id) {
      setStylingSelections((previous) => ({ ...previous, [rowKey]: id }));
      const rowIds = new Set(stylingRows.find((row) => row.key === rowKey)?.prendas.map((prenda) => prenda.id));
      setSelected((previous) => [...new Set([...previous.filter((selectedId) => !rowIds.has(selectedId)), id])]);
    }
  }

  function togglePin(rowKey: string) {
    setPinnedRows((previous) => previous.includes(rowKey)
      ? previous.filter((key) => key !== rowKey)
      : [...previous, rowKey]);
  }

  function moveRow(rowKey: string, direction: number) {
    if (pinnedRows.includes(rowKey)) return;
    rowRefs.current[rowKey]?.scrollBy({ left: direction * 208, behavior: "smooth" });
  }

  async function guardarOutfit() {
    setError("");
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
          nombre: "Nuevo outfit",
          categoria: "Casual",
          descripcion: "",
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
      <div className="absolute -top-20 -left-15 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#A8C5A0" }} />
      <div className="absolute bottom-0 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#C9A96E" }} />

      <div className="relative z-10 max-w-xl mx-auto">
        <BackLink href="/outfits" label="Volver a Mis Outfits" />

        <div className="mb-8">
          <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
            Elegí tu look
          </p>
          <h1 className="text-[2rem] font-light mt-1">Styling ✨</h1>
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

        <div className="flex gap-2 p-1 rounded-2xl mb-5" style={{ background: "rgba(168,197,160,0.18)" }}>
          {(["grid", "styling"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className="flex-1 rounded-xl py-2.5 text-sm transition"
              style={{
                background: view === option ? "#2C3E2D" : "transparent",
                color: view === option ? "#F9F5F0" : "#2C3E2D",
              }}
            >
              {option === "grid" ? "Grid" : "Styling"}
            </button>
          ))}
        </div>

        {loadingPrendas && <p style={{ color: "#9a9a8e" }}>Cargando prendas...</p>}

        {!loadingPrendas && prendas.length === 0 && (
          <div
            className="rounded-3xl p-6 mb-6 text-center"
            style={{ background: "rgba(255,255,255,0.85)", border: "1px dashed #A8C5A0" }}
          >
            <p className="text-sm mb-3" style={{ color: "#6b6b60" }}>
              Todavía no tenés prendas. Primero sumá algunas al closet.
            </p>
            <button
              onClick={() => router.push("/prendas/nueva")}
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: "#2C3E2D", color: "#F9F5F0" }}
            >
              Ir a nueva prenda
            </button>
          </div>
        )}

        {view === "grid" ? (
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
        ) : (
          <div className="space-y-7 mb-6">
            {stylingRows.map((row) => {
              const isPinned = pinnedRows.includes(row.key);
              return (
                <section key={row.key}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-sm font-light" style={{ color: "#2C3E2D" }}>{row.label}</h3>
                    <button
                      type="button"
                      aria-label={`${isPinned ? "Desfijar" : "Fijar"} fila ${row.label}`}
                      onClick={() => togglePin(row.key)}
                      className="p-2 rounded-full transition"
                      style={{
                        color: isPinned ? "#F9F5F0" : "#2C3E2D",
                        background: isPinned ? "#2C3E2D" : "rgba(168,197,160,0.25)",
                      }}
                    >
                      <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {row.prendas.length === 0 ? (
                    <div className="rounded-2xl px-5 py-6 text-center" style={{ background: "rgba(255,255,255,0.7)", border: "1px dashed #A8C5A0" }}>
                      <p className="text-sm mb-2" style={{ color: "#6b6b60" }}>No hay prendas en esta categoría.</p>
                      <button type="button" onClick={() => router.push("/prendas/nueva")} className="text-sm underline" style={{ color: "#2C3E2D" }}>
                        Agregar prenda
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Prenda anterior de ${row.label}`}
                        onClick={() => moveRow(row.key, -1)}
                        disabled={isPinned}
                        className="absolute left-1 top-1/2 z-10 -translate-y-1/2 p-2 rounded-full disabled:opacity-30"
                        style={{ background: "#2C3E2D", color: "#F9F5F0" }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div
                        ref={(element) => { rowRefs.current[row.key] = element; }}
                        onScroll={() => selectCentered(row.key)}
                        className="flex gap-4 overflow-x-auto px-[22%] py-3"
                        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
                      >
                        {row.prendas.map((prenda) => {
                          const isSelected = stylingSelections[row.key] === prenda.id;
                          return (
                            <button
                              key={prenda.id}
                              type="button"
                              data-prenda-id={prenda.id}
                              onClick={() => {
                                if (!isPinned) {
                                  setStylingSelections((previous) => ({ ...previous, [row.key]: prenda.id }));
                                  const rowIds = new Set(row.prendas.map((rowPrenda) => rowPrenda.id));
                                  setSelected((previous) => [...new Set([...previous.filter((selectedId) => !rowIds.has(selectedId)), prenda.id])]);
                                }
                              }}
                              className="shrink-0 w-44 overflow-hidden rounded-3xl text-left transition-all"
                              style={{
                                scrollSnapAlign: "center",
                                opacity: isSelected ? 1 : 0.48,
                                transform: isSelected ? "scale(1)" : "scale(0.88)",
                                background: "rgba(255,255,255,0.88)",
                                outline: isSelected ? "2px solid #2C3E2D" : "none",
                              }}
                            >
                              {prenda.urlImagen ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={prenda.urlImagen} alt={prenda.nombre || prenda.categoria} className="w-full h-52 object-cover" />
                              ) : (
                                <div className="h-52 flex items-center justify-center text-5xl" style={{ background: "linear-gradient(135deg,#d7ead4,#f4ede2)" }}>👗</div>
                              )}
                              <div className="p-3">
                                <p className="font-light truncate" style={{ color: "#1a1a1a" }}>{prenda.nombre || prenda.categoria}</p>
                                <p className="text-[10px] uppercase tracking-[0.12em] mt-1" style={{ color: "#9a9a8e" }}>{prenda.categoria}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        aria-label={`Prenda siguiente de ${row.label}`}
                        onClick={() => moveRow(row.key, 1)}
                        disabled={isPinned}
                        className="absolute right-1 top-1/2 z-10 -translate-y-1/2 p-2 rounded-full disabled:opacity-30"
                        style={{ background: "#2C3E2D", color: "#F9F5F0" }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mb-4 text-sm" style={{ color: "#b85555" }}>
            {error}
          </p>
        )}

        <button
          onClick={guardarOutfit}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-medium transition hover:opacity-90 sticky bottom-4 z-20"
          style={{ background: "#2C3E2D", color: "#F9F5F0", boxShadow: "0 8px 24px rgba(44,62,45,0.22)" }}
        >
          {loading ? "Guardando..." : view === "styling" ? "Crear Outfit" : "Guardar Outfit"}
        </button>
      </div>
    </main>
  );
}
