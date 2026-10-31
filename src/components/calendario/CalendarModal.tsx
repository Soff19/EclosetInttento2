"use client";

import { useState } from "react";
import { X, CalendarDays, Shirt, Image as ImageIcon } from "lucide-react";
import styles from "../../app/fashion-sections.module.css";
import CreateEventForm from "./CreateEventForm";
import AddOutfitForm from "./AddOutfitForm";
import AddPhotoForm from "./AddPhotoForm";

interface Evento {
  id: string;
  fecha: string;
  tipo: "evento" | "outfit" | "foto";
  titulo?: string;
  outfitId?: string;
  urlImagen?: string;
  outfit?: { id: string; nombre: string };
}

interface CalendarModalProps {
  fecha: Date;
  onClose: () => void;
  onEventoCreated: () => void;
  mes: number;
  anio: number;
  eventos: Evento[];
}

type FormType = "menu" | "evento" | "outfit" | "foto";

export default function CalendarModal({
  fecha,
  onClose,
  onEventoCreated,
  mes,
  anio,
  eventos,
}: CalendarModalProps) {
  const [formType, setFormType] = useState<FormType>("menu");

  const fechaFormato = fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B493D]/45 px-0 py-0 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-6"
    >
      <div
        className={`${styles.calendarModal} sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="calendar-modal-title" className="max-w-[80%] text-lg font-bold capitalize text-[#0B493D] sm:text-xl">
            {fechaFormato}
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
            className={`${styles.iconButton} h-10 w-10 rounded-full p-0`}
          >
            <X size={20} />
          </button>
        </div>

        {formType === "menu" && (
          <div className="space-y-3">
            <button
              onClick={() => setFormType("evento")}
              type="button"
              className={styles.modalChoice}
            >
              <div className="flex items-center gap-2 font-bold text-[#0B493D]"><CalendarDays size={18} aria-hidden="true" /> Crear evento</div>
              <div className="mt-1 text-sm text-[#55524C]">
                Añade una nota o recordatorio para este día
              </div>
            </button>

            <button
              onClick={() => setFormType("outfit")}
              type="button"
              className={styles.modalChoice}
            >
              <div className="flex items-center gap-2 font-bold text-[#0B493D]"><Shirt size={18} aria-hidden="true" /> Agregar outfit</div>
              <div className="mt-1 text-sm text-[#55524C]">
                Selecciona uno de tus outfits guardados
              </div>
            </button>

            <button
              onClick={() => setFormType("foto")}
              type="button"
              className={styles.modalChoice}
            >
              <div className="flex items-center gap-2 font-bold text-[#0B493D]"><ImageIcon size={18} aria-hidden="true" /> Agregar foto de outfit</div>
              <div className="mt-1 text-sm text-[#55524C]">
                Sube una imagen de tu look para este día
              </div>
            </button>
          </div>
        )}

        {formType === "evento" && (
          <CreateEventForm
            fecha={fecha}
            onClose={onClose}
            onEventoCreated={onEventoCreated}
            onBack={() => setFormType("menu")}
          />
        )}

        {formType === "outfit" && (
          <AddOutfitForm
            fecha={fecha}
            onClose={onClose}
            onEventoCreated={onEventoCreated}
            onBack={() => setFormType("menu")}
          />
        )}

        {formType === "foto" && (
          <AddPhotoForm
            fecha={fecha}
            onClose={onClose}
            onEventoCreated={onEventoCreated}
            onBack={() => setFormType("menu")}
          />
        )}
      </div>
    </div>
  );
}
