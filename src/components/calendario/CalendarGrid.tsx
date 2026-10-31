"use client";

import styles from "../../app/fashion-sections.module.css";

interface Evento {
  id: string;
  fecha: string;
  tipo: "evento" | "outfit" | "foto";
  titulo?: string;
  outfitId?: string;
  urlImagen?: string;
  outfit?: {
    id: string;
    nombre: string;
    outfitPrendas?: { prenda: { urlImagen: string } }[];
  };
}

interface CalendarGridProps {
  mes: number;
  anio: number;
  eventos: Evento[];
  onDayClick: (date: Date) => void;
  selectedDate: Date | null;
}

export default function CalendarGrid({
  mes,
  anio,
  eventos,
  onDayClick,
  selectedDate,
}: CalendarGridProps) {
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  const diasDelMes = ultimoDia.getDate();
  const diaInicio = primerDia.getDay();
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const eventosPorDia: Record<number, Evento[]> = {};

  eventos.forEach((evento) => {
    const dia = new Date(evento.fecha).getDate();
    eventosPorDia[dia] ||= [];
    eventosPorDia[dia].push(evento);
  });

  const celdas: (number | null)[] = [
    ...Array.from({ length: diaInicio }, () => null),
    ...Array.from({ length: diasDelMes }, (_, index) => index + 1),
  ];

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate()
      && date.getMonth() === today.getMonth()
      && date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date): boolean => Boolean(
    selectedDate
      && date.getDate() === selectedDate.getDate()
      && date.getMonth() === selectedDate.getMonth()
      && date.getFullYear() === selectedDate.getFullYear(),
  );

  const eventLabel = (evento: Evento) =>
    evento.titulo || evento.outfit?.nombre || (evento.tipo === "outfit" ? "Outfit" : evento.tipo === "foto" ? "Foto" : "Evento");
  const eventColor = (tipo: Evento["tipo"]) =>
    tipo === "evento" ? "#6CAF7B" : tipo === "outfit" ? "#0B493D" : "#D4C5F9";

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
        {diasSemana.map((dia) => (
          <div
            key={dia}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-[#55524C] sm:text-xs"
          >
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {celdas.map((dia, index) => {
          if (!dia) return <div key={`empty-${index}`} aria-hidden="true" />;

          const fecha = new Date(anio, mes - 1, dia);
          const eventosDelDia = eventosPorDia[dia] || [];
          const selected = isSelected(fecha);
          const today = isToday(fecha);
          const accessibleDate = fecha.toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

          return (
            <button
              key={dia}
              type="button"
              onClick={() => onDayClick(fecha)}
              aria-label={`${accessibleDate}${eventosDelDia.length ? `, ${eventosDelDia.length} ${eventosDelDia.length === 1 ? "elemento" : "elementos"} agendados` : ""}`}
              aria-pressed={selected}
              className={styles.dayCell}
              data-selected={selected}
              data-today={today}
            >
              <span className={styles.dayNumber}>{dia}</span>
              {eventosDelDia.length > 0 && (
                <>
                  <span className={styles.mobileEventMarks} aria-hidden="true">
                    {eventosDelDia.slice(0, 3).map((evento) => {
                      const previewImages = evento.outfit?.outfitPrendas?.slice(0, 2) || [];
                      if (evento.tipo === "foto" && evento.urlImagen) {
                        return (
                          <span key={evento.id} className={styles.calendarPhotoMark}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={evento.urlImagen} alt="" />
                          </span>
                        );
                      }
                      return evento.tipo === "outfit" && previewImages.length > 0 ? (
                        <span key={evento.id} className={styles.calendarOutfitMark}>
                          {previewImages.map(({ prenda }, imageIndex) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={`${evento.id}-${imageIndex}`} src={prenda.urlImagen} alt="" />
                          ))}
                        </span>
                      ) : (
                        <span key={evento.id} className={styles.eventDot} style={{ backgroundColor: eventColor(evento.tipo) }} />
                      );
                    })}
                    {eventosDelDia.length > 3 && (
                      <span className="text-[9px] font-bold text-[#333333]">+{eventosDelDia.length - 3}</span>
                    )}
                  </span>
                  <span className={styles.desktopEventList} aria-hidden="true">
                    {eventosDelDia.slice(0, 2).map((evento) => {
                      const previewImages = evento.outfit?.outfitPrendas?.slice(0, 4) || [];
                      if (evento.tipo === "foto" && evento.urlImagen) {
                        return (
                          <span
                            key={evento.id}
                            className={styles.calendarPhotoPreview}
                            title="Foto agendada"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={evento.urlImagen} alt="" />
                          </span>
                        );
                      }
                      return evento.tipo === "outfit" && previewImages.length > 0 ? (
                        <span
                          key={evento.id}
                          className={styles.calendarOutfitPreview}
                          aria-label="Outfit agendado"
                          title="Outfit agendado"
                        >
                          {previewImages.map(({ prenda }, imageIndex) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={`${evento.id}-${imageIndex}`} src={prenda.urlImagen} alt="" />
                          ))}
                        </span>
                      ) : (
                        <span
                          key={evento.id}
                          className="w-full truncate rounded px-1 py-0.5 text-left text-[10px] leading-4"
                          style={{
                            backgroundColor: evento.tipo === "outfit" ? eventColor(evento.tipo) : evento.tipo === "evento" ? "#C6EFD6" : "#D4C5F9",
                            color: evento.tipo === "outfit" ? "#FFFFFF" : "#0B493D",
                          }}
                        >
                          {evento.tipo === "outfit" ? "Outfit" : eventLabel(evento)}
                        </span>
                      );
                    })}
                    {eventosDelDia.length > 2 && (
                      <span className="text-[10px] font-semibold text-[#55524C]">+{eventosDelDia.length - 2} más</span>
                    )}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#6CAF7B]" />
          <span className="text-[#55524C]">Evento</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#0B493D]" />
          <span className="text-[#55524C]">Outfit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#D4C5F9]" />
          <span className="text-[#55524C]">Foto</span>
        </div>
      </div>
    </div>
  );
}
