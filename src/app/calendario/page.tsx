"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import BackLink from "@/components/BackLink";
import CalendarGrid from "@/components/calendario/CalendarGrid";
import CalendarFABModal from "@/components/calendario/CalendarFABModal";
import CalendarDayDetailsModal from "@/components/calendario/CalendarDayDetailsModal";
import styles from "../fashion-sections.module.css";

interface Evento {
  id: string;
  fecha: string;
  tipo: "evento" | "outfit" | "foto";
  titulo?: string;
  outfitId?: string;
  urlImagen?: string;
  outfit?: { id: string; nombre: string; outfitPrendas?: { prenda: { urlImagen: string } }[] };
}

interface Outfit {
  id: string;
  outfitPrendas: { prenda: { urlImagen: string } }[];
}

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [outfitImages, setOutfitImages] = useState<Record<string, string[]>>({});
  const [outfitLoadError, setOutfitLoadError] = useState("");
  const [calendarLoadError, setCalendarLoadError] = useState("");
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewingDate, setViewingDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionError, setActionError] = useState("");

  // Cargar eventos del mes
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/calendario/mes?mes=${mes}&anio=${anio}`, {
          headers: token ? { Authorization: "Bearer " + token } : undefined,
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setEventos(data.eventos);
          setCalendarLoadError("");
        } else {
          setCalendarLoadError("No se pudieron cargar los eventos del calendario.");
        }
        try {
          const outfitsResponse = await fetch("/api/outfits", {
            headers: token ? { Authorization: "Bearer " + token } : undefined,
            credentials: "include",
          });
          if (!outfitsResponse.ok) throw new Error("No se pudieron cargar los outfits.");
          const data = await outfitsResponse.json();
          const outfits: Outfit[] = data.outfits || [];
          setOutfitImages(Object.fromEntries(
            outfits.map((outfit) => [
              outfit.id,
              outfit.outfitPrendas.map(({ prenda }) => prenda.urlImagen).filter(Boolean),
            ]),
          ));
          setOutfitLoadError("");
        } catch {
          setOutfitLoadError("No se pudieron cargar las imágenes de tus outfits.");
        }
      } catch {
        setCalendarLoadError("No se pudieron cargar los eventos del calendario.");
      } finally {
        setLoading(false);
      }
    })();
  }, [mes, anio]);

  const handleMesAnterior = () => {
    if (mes === 1) {
      setMes(12);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
  };

  const handleMesSiguiente = () => {
    if (mes === 12) {
      setMes(1);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewingDate(date);
    setActionError("");
  };

  const handleFABClick = () => {
    if (!selectedDate) {
      setActionError("Seleccioná un día del calendario antes de agregar algo.");
      return;
    }
    setActionError("");
    setShowModal(true);
  };

  const handleEventoCreated = async () => {
    // Recargar eventos
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/calendario/mes?mes=${mes}&anio=${anio}`, {
      headers: token ? { Authorization: "Bearer " + token } : undefined,
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      setEventos(data.eventos);
    }
    setShowModal(false);
    setSelectedDate(null);
  };

  const nombreMes = new Date(anio, mes - 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className={`${styles.page} min-h-screen px-1 pb-28 pt-5 sm:px-6 sm:pt-8`}>
      <div className={`${styles.calendarContent} relative z-10`}>
      <section>
        <BackLink href="/closet" label="Volver al closet" className="!text-[#0B493D] font-semibold" />
        <p className={styles.eyebrow}>Planificá tu estilo</p>
        <h1 className={styles.title}>Calendario</h1>
        <p className={styles.subtitle}>
          Organiza tus outfits y eventos en el tiempo.
        </p>
      </section>

      <section className={`${styles.surface} mt-6 p-0 sm:mt-8 sm:p-6`} aria-label="Calendario mensual">
        <div className="mb-4 flex items-center justify-between gap-1 px-2 pt-2 sm:mb-6 sm:gap-3 sm:px-0 sm:pt-0">
          <button
            onClick={handleMesAnterior}
            type="button"
            aria-label="Mes anterior"
            className={`${styles.iconButton} h-11 w-11 rounded-full p-0`}
          >
            <ChevronLeft size={20} />
          </button>

          <h2
            className={`${styles.title} mt-0 text-center text-2xl capitalize sm:text-3xl`}
            aria-live="polite"
          >
            {nombreMes}
          </h2>

          <button
            onClick={handleMesSiguiente}
            type="button"
            aria-label="Mes siguiente"
            className={`${styles.iconButton} h-11 w-11 rounded-full p-0`}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {outfitLoadError && (
          <p role="status" className={`${styles.error} mb-4`}>
            {outfitLoadError}
          </p>
        )}
        {calendarLoadError && (
          <p role="alert" className={`${styles.error} mb-4`}>
            {calendarLoadError}
          </p>
        )}

        {loading ? (
          <p className="py-6 text-center text-sm text-[#55524C]" role="status">Cargando calendario...</p>
        ) : (
          <CalendarGrid
            mes={mes}
            anio={anio}
            eventos={eventos.map((evento) => ({
              ...evento,
              outfit: evento.outfit
                ? {
                    ...evento.outfit,
                    outfitPrendas: (outfitImages[evento.outfit.id] || []).map((urlImagen) => ({
                      prenda: { urlImagen },
                    })),
                  }
                : evento.outfit,
            }))}
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
          />
        )}
      </section>
      {actionError && (
        <p role="status" className={`${styles.error} mt-3`}>
          {actionError}
        </p>
      )}

      {viewingDate && (
        <CalendarDayDetailsModal
          fecha={viewingDate}
          eventos={eventos
            .filter((evento) => {
              const eventDate = new Date(evento.fecha);
              return eventDate.getDate() === viewingDate.getDate()
                && eventDate.getMonth() === viewingDate.getMonth()
                && eventDate.getFullYear() === viewingDate.getFullYear();
            })
            .map((evento) => ({
              ...evento,
              outfit: evento.outfit
                ? {
                    ...evento.outfit,
                    outfitPrendas: (outfitImages[evento.outfit.id] || []).map((urlImagen) => ({
                      prenda: { urlImagen },
                    })),
                  }
                : evento.outfit,
            }))}
          onClose={() => setViewingDate(null)}
        />
      )}

      <button
        onClick={handleFABClick}
        type="button"
        aria-label="Agregar al calendario"
        className={`${styles.primaryButton} fixed bottom-6 right-5 z-40 h-14 w-14 rounded-full p-0 shadow-md sm:bottom-8 sm:right-8`}
      >
        <Plus size={24} />
      </button>

      {showModal && selectedDate && (
        <CalendarFABModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onEventoCreated={handleEventoCreated}
        />
      )}
      </div>
    </main>
  );
}
