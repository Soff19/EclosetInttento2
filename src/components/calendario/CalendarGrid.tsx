"use client";

interface Evento {
  id: string;
  fecha: string;
  tipo: "evento" | "outfit" | "foto";
  titulo?: string;
  outfitId?: string;
  urlImagen?: string;
  outfit?: { id: string; nombre: string };
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

  // Crear array de días con eventos
  const eventosPorDia: { [key: number]: Evento[] } = {};
  eventos.forEach((evento) => {
    const fecha = new Date(evento.fecha);
    const dia = fecha.getDate();
    if (!eventosPorDia[dia]) {
      eventosPorDia[dia] = [];
    }
    eventosPorDia[dia].push(evento);
  });

  // Función para obtener color según tipo
  const getTipoLabel = (tipo: string): string => {
    if (tipo === "evento") return "Evento";
    if (tipo === "outfit") return "Outfit";
    if (tipo === "foto") return "Foto";
    return "";
  };

  const getTipoColor = (tipo: string): string => {
    if (tipo === "evento") return "#A8C5A0";
    if (tipo === "outfit") return "#2C3E2D";
    if (tipo === "foto") return "#C9A96E";
    return "#F0EBE4";
  };

  // Crear array de celdas del calendario
  const celdas = [];
  for (let i = 0; i < diaInicio; i++) {
    celdas.push(null);
  }
  for (let i = 1; i <= diasDelMes; i++) {
    celdas.push(i);
  }

  // Función para verificar si una fecha es hoy
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Función para verificar si una fecha es la seleccionada
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div>
      {/* Encabezado de días de la semana */}
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

      {/* Días del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((dia, index) => {
          if (!dia) {
            return <div key={index} />;
          }

          const fecha = new Date(anio, mes - 1, dia);
          const eventosDelDia = eventosPorDia[dia] || [];
          const hasEventos = eventosDelDia.length > 0;
          const today = isToday(fecha);
          const selected = isSelected(fecha);

          // Determinar colores y layout según eventos
          let bgColor = "#fff";
          let textColor = "#2C3E2D";
          let borderStyle = "1px solid #e8e4de";

          if (selected) {
            // Día seleccionado: borde más oscuro y ancho
            borderStyle = "3px solid #2C3E2D";
          } else if (today) {
            // Día actual: borde delgado más oscuro
            borderStyle = "2px solid #A8C5A0";
          }

          return (
            <button
              key={index}
              onClick={() => onDayClick(fecha)}
              className="aspect-square rounded-xl p-1 relative transition hover:opacity-80 flex flex-col items-center justify-center"
              style={{
                backgroundColor: bgColor,
                border: borderStyle,
              }}
            >
              {/* Número del día */}
              <div
                className="text-xs font-light absolute top-1"
                style={{ color: textColor }}
              >
                {today ? "●" : dia}
                {today && <span className="ml-0.5">{dia}</span>}
              </div>

              {/* Mostrar eventos */}
              {hasEventos && (
                <div className="flex flex-col gap-0.5 mt-3 w-full">
                  {eventosDelDia.slice(0, 2).map((evento, i) => {
                    const color = getTipoColor(evento.tipo);
                    const label = getTipoLabel(evento.tipo);
                    return (
                      <div
                        key={i}
                        className="rounded text-xs font-light truncate px-1 py-0.5"
                        style={{
                          backgroundColor: color,
                          color: evento.tipo === "outfit" ? "#F9F5F0" : "#2C3E2D",
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}
                  {eventosDelDia.length > 2 && (
                    <div className="text-xs font-light" style={{ color: "#9a9a8e" }}>
                      +{eventosDelDia.length - 2}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#A8C5A0" }}
          />
          <span style={{ color: "#9a9a8e" }}>Evento</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#2C3E2D" }}
          />
          <span style={{ color: "#9a9a8e" }}>Outfit</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#C9A96E" }}
          />
          <span style={{ color: "#9a9a8e" }}>Foto</span>
        </div>
      </div>
    </div>
  );
}
