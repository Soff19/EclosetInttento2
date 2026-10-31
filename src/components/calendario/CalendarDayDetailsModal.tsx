"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import styles from "../../app/fashion-sections.module.css";

interface CalendarEvent {
  id: string;
  fecha: string;
  tipo: "evento" | "outfit" | "foto";
  titulo?: string;
  urlImagen?: string;
  outfit?: {
    id: string;
    nombre: string;
    outfitPrendas?: { prenda: { urlImagen: string } }[];
  };
}

interface CalendarDayDetailsModalProps {
  fecha: Date;
  eventos: CalendarEvent[];
  onClose: () => void;
}

export default function CalendarDayDetailsModal({
  fecha,
  eventos,
  onClose,
}: CalendarDayDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fechaFormato = fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className={styles.calendarDayOverlay}
      onClick={onClose}
      role="presentation"
    >
      <section
        className={styles.calendarDayModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-day-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className={styles.eyebrow}>Tu calendario</p>
            <h2 id="calendar-day-title" className="text-lg font-bold capitalize text-[#0B493D]">
              {fechaFormato}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle del día"
            className={`${styles.iconButton} h-10 w-10 shrink-0 rounded-full p-0`}
          >
            <X size={18} />
          </button>
        </div>

        {eventos.length === 0 ? (
          <p className="rounded-xl border border-[#E5E1D9] bg-white p-4 text-sm text-[#55524C]">
            No hay eventos, outfits ni fotos para este día.
          </p>
        ) : (
          <div className={styles.calendarDayItems}>
            {eventos.map((evento) => {
              const outfitImages = evento.outfit?.outfitPrendas || [];
              const titulo = evento.tipo === "outfit"
                ? evento.outfit?.nombre || evento.titulo || "Outfit"
                : evento.tipo === "foto"
                  ? evento.titulo || "Foto de outfit"
                  : evento.titulo || "Evento";

              return (
                <article key={evento.id} className={styles.calendarDayItem}>
                  <h3 className="mb-2 text-sm font-bold text-[#333333]">{titulo}</h3>
                  {evento.tipo === "foto" && evento.urlImagen ? (
                    <div className={styles.calendarDayMedia}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={evento.urlImagen} alt={titulo} />
                    </div>
                  ) : evento.tipo === "outfit" && outfitImages.length > 0 ? (
                    <div className={`${styles.calendarDayMedia} ${styles.calendarDayOutfit}`}>
                      {outfitImages.map(({ prenda }, index) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={`${evento.id}-${index}`} src={prenda.urlImagen} alt={`Prenda ${index + 1} del outfit`} />
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
