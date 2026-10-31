"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Calendar, Shirt, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import ClosetSearch from "@/components/closet/ClosetSearch";
import ClosetFilters from "@/components/closet/ClosetFilters";
import GarmentCard from "@/components/closet/GarmentCard";
import GarmentDetailModal from "@/components/closet/GarmentDetailModal";
import BottomNavigation from "@/components/closet/BottomNavigation";
import BackLink from "@/components/BackLink";
import type { Prenda } from "@/types/prenda";
import EditorialSectionBanner from "@/components/EditorialSectionBanner";
import NewGarmentForm from "@/components/closet/NewGarmentForm";
import styles from "../fashion-sections.module.css";

export default function ClosetPage() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [creationMenuOpen, setCreationMenuOpen] = useState(false);
  const [newGarmentOpen, setNewGarmentOpen] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<Prenda | null>(null);
  const router = useRouter();
  const creationControlRef = useRef<HTMLDivElement>(null);
  const creationButtonRef = useRef<HTMLButtonElement>(null);
  const creationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!creationMenuOpen) return;

    creationMenuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!creationControlRef.current?.contains(event.target as Node)) {
        setCreationMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCreationMenuOpen(false);
        creationButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [creationMenuOpen]);

  const closeNewGarmentModal = useCallback(() => {
    setNewGarmentOpen(false);
    creationButtonRef.current?.focus();
  }, []);

  const handleNewGarmentSaved = useCallback(() => {
    setNewGarmentOpen(false);
    requestAnimationFrame(() => creationButtonRef.current?.focus());
  }, []);

  const closeGarmentDetails = useCallback(() => {
    setSelectedGarment(null);
  }, []);

  const handleGarmentDeleted = useCallback((prendaId: string) => {
    setPrendas((current) => current.filter((prenda) => prenda.id !== prendaId));
    setSelectedGarment(null);
  }, []);

  useEffect(() => {
    if (newGarmentOpen) return;

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
  }, [newGarmentOpen]);

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
    <main className={`${styles.page} min-h-screen px-0 pb-32 pt-0`}>
      <EditorialSectionBanner
        id="closet-title"
        eyebrow="Tu espacio personal"
        title="Mi Closet"
        description="Organizá tu estilo y encontrá cada prenda fácilmente."
        intro={<BackLink href="/home" label="Volver al inicio" iconOnly className={`!mb-0 ${styles.bannerBackLink}`} />}
      >
        <div ref={creationControlRef} className={styles.closetCreateControl}>
          <button
            ref={creationButtonRef}
            type="button"
            className={styles.closetCreateButton}
            aria-label={creationMenuOpen ? "Cerrar opciones de creación" : "Crear prenda u outfit"}
            aria-haspopup="menu"
            aria-expanded={creationMenuOpen}
            aria-controls="closet-create-menu"
            onClick={() => setCreationMenuOpen((open) => !open)}
          >
            <Plus size={24} aria-hidden="true" />
          </button>
          {creationMenuOpen && (
            <div
              ref={creationMenuRef}
              id="closet-create-menu"
              role="menu"
              aria-label="Opciones de creación"
              className={styles.closetCreateMenu}
              onKeyDown={(event) => {
                const items = Array.from(
                  event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
                );
                const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
                let nextIndex = currentIndex;

                if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
                else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
                else if (event.key === "Home") nextIndex = 0;
                else if (event.key === "End") nextIndex = items.length - 1;
                else if (event.key === "Escape") {
                  event.preventDefault();
                  setCreationMenuOpen(false);
                  creationButtonRef.current?.focus();
                  return;
                } else {
                  return;
                }

                event.preventDefault();
                items[nextIndex]?.focus();
              }}
            >
              <button
                type="button"
                role="menuitem"
                tabIndex={0}
                className={styles.closetCreateOption}
                onClick={() => {
                  setCreationMenuOpen(false);
                  setNewGarmentOpen(true);
                }}
              >
                <Shirt size={18} className="mr-3 shrink-0" aria-hidden="true" />
                Agregar prenda al closet
              </button>
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={styles.closetCreateOption}
                onClick={() => {
                  setCreationMenuOpen(false);
                  router.push("/outfits/crear");
                }}
              >
                <Layers size={18} className="mr-3 shrink-0" aria-hidden="true" />
                Crear outfit
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => router.push("/calendario")}
          type="button"
          className={`${styles.iconButton} h-12 w-12 rounded-xl p-0`}
          aria-label="Ir al calendario"
          title="Ir al calendario"
        >
          <Calendar size={19} aria-hidden="true" />
        </button>
      </EditorialSectionBanner>

      <div className={`${styles.content} relative z-10 px-4 pt-6 sm:px-6`}>
        <div className="space-y-4">
          <ClosetSearch value={search} onChange={setSearch} />
          <ClosetFilters
            categorias={categorias}
            activa={categoriaActiva}
            onChange={setCategoriaActiva}
          />
        </div>

        <section className={`${styles.garmentGrid} mt-5`} aria-label="Prendas de tu closet">
          {loading && <p className="col-span-full text-sm text-[#55524C]" role="status">Cargando prendas...</p>}
          {!loading && prendasFiltradas.length === 0 && (
            <p className={`${styles.surface} col-span-full p-5 text-sm text-[#55524C]`}>
              {prendas.length === 0 ? "Todavía no hay prendas. Sumá la primera." : "No hay prendas que coincidan con la búsqueda y categoría."}
            </p>
          )}
          {prendasFiltradas.map((prenda) => (
            <GarmentCard
              key={prenda.id}
              prenda={prenda}
              onOpen={() => setSelectedGarment(prenda)}
            />
          ))}
        </section>
      </div>

      {selectedGarment && (
        <GarmentDetailModal
          prenda={selectedGarment}
          onClose={closeGarmentDetails}
          onDeleted={handleGarmentDeleted}
        />
      )}

      {newGarmentOpen && (
        <NewGarmentForm
          onClose={closeNewGarmentModal}
          onSaved={handleNewGarmentSaved}
        />
      )}

      <BottomNavigation />
    </main>
  );
}
