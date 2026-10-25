"use client";

import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import CreateEventForm from "./CreateEventForm";
import AddOutfitForm from "./AddOutfitForm";
import AddPhotoForm from "./AddPhotoForm";

interface CalendarFABModalProps {
  selectedDate: Date | null;
  onClose: () => void;
  onEventoCreated: () => void;
  mes: number;
  anio: number;
  onDateSelected: (date: Date) => void;
}

type FormType = "dateSelect" | "menu" | "evento" | "outfit" | "foto";

export default function CalendarFABModal({
  selectedDate,
  onClose,
  onEventoCreated,
  mes,
  anio,
  onDateSelected,
}: CalendarFABModalProps) {
  const [formType, setFormType] = useState<FormType>(
    selectedDate ? "menu" : "dateSelect"
  );
  const [workingDate, setWorkingDate] = useState<Date | null>(selectedDate);

  const handleDateSelected = (date: Date) => {
    setWorkingDate(date);
    onDateSelected(date);
    setFormType("menu");
  };

  const handleBack = () => {
    if (formType === "menu" && !selectedDate) {
      setFormType("dateSelect");
    } else if (formType !== "menu" && formType !== "dateSelect") {
      setFormType("menu");
    }
  };

  const fechaFormato = workingDate?.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-100 flex items-end justify-center">
      <div
        className="w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#F9F5F0" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light" style={{ color: "#2C3E2D" }}>
            {formType === "dateSelect" ? "Selecciona una fecha" : fechaFormato || "Modal"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-70 transition"
          >
            <X size={20} style={{ color: "#2C3E2D" }} />
          </button>
        </div>

        {formType === "dateSelect" && (
          <DateSelector
            mes={mes}
            anio={anio}
            onDateSelected={handleDateSelected}
          />
        )}

        {formType === "menu" && (
          <div className="space-y-3">
            {!selectedDate && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 mb-4 text-sm font-light transition hover:opacity-70"
                style={{ color: "#2C3E2D" }}
              >
                <ChevronLeft size={16} />
                Atrás
              </button>
            )}

            <button
              onClick={() => setFormType("evento")}
              className="w-full rounded-xl py-4 px-4 text-left transition hover:opacity-80"
              style={{ backgroundColor: "#A8C5A0", color: "#2C3E2D" }}
            >
              <div className="font-light">📝 Crear evento</div>
              <div
                className="text-xs mt-1"
                style={{ color: "#2C3E2D", opacity: 0.7 }}
              >
                Añade una nota o recordatorio para este día
              </div>
            </button>

            <button
              onClick={() => setFormType("outfit")}
              className="w-full rounded-xl py-4 px-4 text-left transition hover:opacity-80"
              style={{ backgroundColor: "#2C3E2D", color: "#F9F5F0" }}
            >
              <div className="font-light">👗 Agregar outfit</div>
              <div
                className="text-xs mt-1"
                style={{ color: "#F9F5F0", opacity: 0.7 }}
              >
                Selecciona uno de tus outfits guardados
              </div>
            </button>

            <button
              onClick={() => setFormType("foto")}
              className="w-full rounded-xl py-4 px-4 text-left transition hover:opacity-80"
              style={{ backgroundColor: "#C9A96E", color: "#2C3E2D" }}
            >
              <div className="font-light">📸 Agregar foto de outfit</div>
              <div
                className="text-xs mt-1"
                style={{ color: "#2C3E2D", opacity: 0.7 }}
              >
                Sube una imagen de tu look para este día
              </div>
            </button>
          </div>
        )}

        {formType === "evento" && (
          <CreateEventForm
            fecha={workingDate!}
            onClose={onClose}
            onEventoCreated={onEventoCreated}
            onBack={handleBack}
          />
        )}

        {formType === "outfit" && (
          <AddOutfitForm
            fecha={workingDate!}
            onClose={onClose}
            onEventoCreated={onEventoCreated}
            onBack={handleBack}
          />
        )}

        {formType === "foto" && (
          <AddPhotoForm
            fecha={workingDate!}
            onClose={onClose}
            onEventoCreated={onEventoCreated}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}

interface DateSelectorProps {
  mes: number;
  anio: number;
  onDateSelected: (date: Date) => void;
}

function DateSelector({ mes, anio, onDateSelected }: DateSelectorProps) {
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  const diasDelMes = ultimoDia.getDate();
  const diaInicio = primerDia.getDay();

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const celdas = [];
  for (let i = 0; i < diaInicio; i++) {
    celdas.push(null);
  }
  for (let i = 1; i <= diasDelMes; i++) {
    celdas.push(i);
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map((dia) => (
          <div
            key={dia}
            className="text-center py-2 text-xs font-light"
            style={{ color: "#9a9a8e" }}
          >
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((dia, index) => {
          if (!dia) {
            return <div key={index} />;
          }

          return (
            <button
              key={index}
              onClick={() => onDateSelected(new Date(anio, mes - 1, dia))}
              className="aspect-square rounded-xl flex items-center justify-center font-light transition hover:opacity-80"
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e8e4de",
                color: "#2C3E2D",
              }}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}
