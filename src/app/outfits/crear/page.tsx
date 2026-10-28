"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, Pin, Shirt, X } from "lucide-react";
import BackLink from "@/components/BackLink";
import GarmentCard from "@/components/closet/GarmentCard";
import EditorialSectionBanner from "@/components/EditorialSectionBanner";
import type { Prenda } from "@/types/prenda";
import styles from "../../fashion-sections.module.css";

const tiposOutfit = ["Casual", "Elegante", "Formal", "Deportivo", "Fiesta", "Trabajo"];

export default function CrearOutfitPage() {
  const router = useRouter();
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Casual");
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

  const selectedPrendas = useMemo(
    () => selected
      .map((id) => prendas.find((prenda) => prenda.id === id))
      .filter((prenda): prenda is Prenda => prenda !== undefined),
    [selected, prendas],
  );

  function removeFromComposition(id: string) {
    setSelected((previous) => previous.filter((selectedId) => selectedId !== id));
    setStylingSelections((previous) => {
      const next = { ...previous };
      Object.entries(next).forEach(([rowKey, selectedId]) => {
        if (selectedId === id) next[rowKey] = null;
      });
      return next;
    });
  }

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
    if (!nombre.trim()) {
      setError("Poné un nombre para tu outfit");
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
          nombre: nombre.trim(),
          categoria,
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
    <main className={`${styles.page} min-h-screen px-0 pb-28 pt-0`}>
      <EditorialSectionBanner
        id="create-outfit-title"
        eyebrow="Stylear"
        title="Crear outfit"
        description="Combiná tus prendas y guardá un look pensado para vos."
        intro={<BackLink href="/outfits" label="Volver a Mis Outfits" iconOnly className={`!mb-0 ${styles.bannerBackLink}`} />}
      >
        <div className={styles.bannerModeControls} role="group" aria-label="Modo de selección">
          {(["grid", "styling"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={styles.bannerModeButton}
            >
              {option === "grid"
                ? <LayoutGrid size={18} aria-hidden="true" />
                : <Shirt size={18} aria-hidden="true" />}
              <span>{option === "grid" ? "Grid" : "Styling"}</span>
            </button>
          ))}
        </div>
      </EditorialSectionBanner>
      <div className={`${styles.content} relative z-10 px-4 pt-6 sm:px-6`}>
        <section className={`${styles.surface} mb-6 mt-6 p-4 sm:p-5`}>
          <div className="grid gap-4 sm:grid-cols-[1.35fr_1fr]">
            <label className="block">
              <span className={styles.eyebrow}>
                Nombre del outfit
              </span>
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej. Look de viernes"
                maxLength={60}
                className={`${styles.input} mt-2`}
              />
            </label>
            <label className="block">
              <span className={styles.eyebrow}>
                Tipo de outfit
              </span>
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                className={`${styles.input} mt-2`}
              >
                {tiposOutfit.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </label>
          </div>
        </section>

        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className={styles.eyebrow}>
              Prendas del closet
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#0B493D]">Elegí qué incluir</h2>
          </div>
          <span className="rounded-lg bg-[#C6EFD6] px-2.5 py-1 text-sm font-bold text-[#0B493D]">
            {selected.length} seleccionadas
          </span>
        </div>

        <section className={styles.stylingComposition} aria-labelledby="outfit-composition-title">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={styles.eyebrow}>Vista previa</p>
              <h2 id="outfit-composition-title" className="mt-1 text-base font-bold text-[#0B493D]">
                Tu composición
              </h2>
            </div>
            <span className="rounded-lg bg-[#C6EFD6] px-2.5 py-1 text-sm font-bold text-[#0B493D]" aria-live="polite">
              {selectedPrendas.length} {selectedPrendas.length === 1 ? "prenda" : "prendas"}
            </span>
          </div>
          {selectedPrendas.length === 0 ? (
            <p className="mt-3 text-sm text-[#55524C]">
              Seleccioná prendas para verlas reunidas en tu outfit.
            </p>
          ) : (
            <div className={styles.compositionItems} aria-live="polite">
              {selectedPrendas.map((prenda) => (
                <article key={prenda.id} className={styles.compositionItem}>
                  {prenda.urlImagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prenda.urlImagen} alt={prenda.nombre || prenda.categoria} />
                  ) : (
                    <div className={styles.compositionPlaceholder}>
                      <span className="text-center text-[10px] font-semibold text-[#55524C]">Sin imagen</span>
                    </div>
                  )}
                  <p className={styles.compositionLabel}>{prenda.nombre || prenda.categoria}</p>
                  <button
                    type="button"
                    className={styles.removeCompositionItem}
                    aria-label={`Quitar ${prenda.nombre || prenda.categoria} del outfit`}
                    onClick={() => removeFromComposition(prenda.id)}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {loadingPrendas &&         <p className="text-sm text-[#55524C]" role="status">Cargando prendas...</p>}

        {!loadingPrendas && prendas.length === 0 && (
          <div
            className={`${styles.surface} mb-6 p-6 text-center`}
          >
            <p className="mb-3 text-sm text-[#55524C]">
              Todavía no tenés prendas. Primero sumá algunas al closet.
            </p>
            <button
              onClick={() => router.push("/prendas/nueva")}
              className={styles.primaryButton}
            >
              Ir a nueva prenda
            </button>
          </div>
        )}

        {view === "grid" ? (
          <div className={`${styles.garmentGrid} mb-6`}>
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
          <div className={`${styles.stylingRows} mb-6`}>
            {stylingRows.map((row) => {
              const isPinned = pinnedRows.includes(row.key);
              return (
                <section key={row.key}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-base font-bold text-[#0B493D]">{row.label}</h3>
                    <button
                      type="button"
                      aria-label={`${isPinned ? "Desfijar" : "Fijar"} fila ${row.label}`}
                      onClick={() => togglePin(row.key)}
                      className={`${styles.iconButton} h-10 w-10 rounded-full p-0`}
                      aria-pressed={isPinned}
                    >
                      <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {row.prendas.length === 0 ? (
                    <div className={`${styles.surface} px-5 py-6 text-center`}>
                      <p className="mb-2 text-sm text-[#55524C]">No hay prendas en esta categoría.</p>
                      <button type="button" onClick={() => router.push("/prendas/nueva")} className="text-sm font-semibold text-[#0B493D] underline underline-offset-4">
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
                        className={`${styles.iconButton} absolute left-1 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full p-0 disabled:opacity-30`}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div
                        ref={(element) => { rowRefs.current[row.key] = element; }}
                        onScroll={() => selectCentered(row.key)}
                        className={styles.stylingTrack}
                      >
                        {row.prendas.map((prenda) => {
                          const isSelected = stylingSelections[row.key] === prenda.id;
                          return (
                            <button
                              key={prenda.id}
                              type="button"
                              aria-pressed={isSelected}
                              data-prenda-id={prenda.id}
                              onClick={() => {
                                if (!isPinned) {
                                  setStylingSelections((previous) => ({ ...previous, [row.key]: prenda.id }));
                                  const rowIds = new Set(row.prendas.map((rowPrenda) => rowPrenda.id));
                                  setSelected((previous) => [...new Set([...previous.filter((selectedId) => !rowIds.has(selectedId)), prenda.id])]);
                                }
                              }}
                              className={styles.stylingCard}
                              data-selected={isSelected}
                              style={{
                                opacity: isSelected ? 1 : 0.75,
                              }}
                            >
                              {prenda.urlImagen ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={prenda.urlImagen} alt={prenda.nombre || prenda.categoria} className="h-full w-full object-contain" />
                              ) : (
                                <div className={styles.stylingPlaceholder}><span className="text-xs font-semibold text-[#55524C]">Sin imagen</span></div>
                              )}
                              <div className={styles.stylingLabel}>
                                {prenda.nombre || prenda.categoria}
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
                        className={`${styles.iconButton} absolute right-1 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full p-0 disabled:opacity-30`}
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
          <p role="alert" className={`${styles.error} mb-4`}>
            {error}
          </p>
        )}

        <button
          onClick={guardarOutfit}
          disabled={loading}
          className={`${styles.primaryButton} sticky bottom-4 z-20 w-full`}
        >
          {loading ? "Guardando..." : view === "styling" ? "Crear Outfit" : "Guardar Outfit"}
        </button>
      </div>
    </main>
  );
}
