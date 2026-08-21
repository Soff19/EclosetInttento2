"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div
        className="w-full rounded-t-[24px] p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#F9F5F0" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light" style={{ color: "#2C3E2D" }}>
            {fechaFormato}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-70 transition"
          >
            <X size={20} style={{ color: "#2C3E2D" }} />
          </button>
        </div>

        {formType === "menu" && (
          <div className="space-y-3">
            <button
              onClick={() => setFormType("evento")}
              className="w-full rounded-[12px] py-4 px-4 text-left transition hover:opacity-80"
              style={{ backgroundColor: "#A8C5A0", color: "#2C3E2D" }}
            >
              <div className="font-light">📝 Crear evento</div>
              <div className="text-xs mt-1" style={{ color: "#2C3E2D", opacity: 0.7 }}>
                Añade una nota o recordatorio para este día
              </div>
            </button>

            <button
              onClick={() => setFormType("outfit")}
              className="w-full rounded-[12px] py-4 px-4 text-left transition hover:opacity-80"
              style={{ backgroundColor: "#2C3E2D", color: "#F9F5F0" }}
            >
              <div className="font-light">👗 Agregar outfit</div>
              <div className="text-xs mt-1" style={{ color: "#F9F5F0", opacity: 0.7 }}>
                Selecciona uno de tus outfits guardados
              </div>
            </button>

            <button
              onClick={() => setFormType("foto")}
              className="w-full rounded-[12px] py-4 px-4 text-left transition hover:opacity-80"
              style={{ backgroundColor: "#C9A96E", color: "#2C3E2D" }}
            >
              <div className="font-light">📸 Agregar foto de outfit</div>
              <div className="text-xs mt-1" style={{ color: "#2C3E2D", opacity: 0.7 }}>
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
