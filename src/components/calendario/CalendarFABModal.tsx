"use client";

import { useState } from "react";
import { X, ChevronLeft, CalendarDays, Shirt, Image as ImageIcon } from "lucide-react";
import styles from "../../app/fashion-sections.module.css";
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-fab-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0B493D]/45 px-0 py-0 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-6"
    >
      <div
        className={`${styles.calendarModal} sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="calendar-fab-title" className="max-w-[80%] text-lg font-bold capitalize text-[#0B493D] sm:text-xl">
            {formType === "dateSelect" ? "Selecciona una fecha" : fechaFormato || "Modal"}
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
                type="button"
                className="mb-4 flex min-h-10 items-center gap-2 text-sm font-bold text-[#0B493D] hover:underline"
              >
                <ChevronLeft size={16} />
                Atrás
              </button>
            )}

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
      <div className={`${styles.dateSelectorWeek} mb-2 grid grid-cols-7 gap-1 sm:gap-2`}>
        {diasSemana.map((dia) => (
          <div
            key={dia}
            className="py-2 text-center text-[10px] font-bold uppercase text-[#55524C] sm:text-xs"
          >
            {dia}
          </div>
        ))}
      </div>

      <div className={`${styles.dateSelectorGrid} grid grid-cols-7 gap-1 sm:gap-2`}>
        {celdas.map((dia, index) => {
          if (!dia) {
            return <div key={index} />;
          }

          return (
            <button
              key={index}
              onClick={() => onDateSelected(new Date(anio, mes - 1, dia))}
              type="button"
              className={`${styles.dayCell} ${styles.dateSelectCell}`}
              aria-label={new Date(anio, mes - 1, dia).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}
