"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import BackLink from "@/components/BackLink";
import CalendarGrid from "@/components/calendario/CalendarGrid";
import CalendarFABModal from "@/components/calendario/CalendarFABModal";

interface Evento {
  id: string;
  fecha: string;
  tipo: "evento" | "outfit" | "foto";
  titulo?: string;
  outfitId?: string;
  urlImagen?: string;
  outfit?: { id: string; nombre: string };
}

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar eventos del mes
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/calendario/mes?mes=${mes}&anio=${anio}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setEventos(data.eventos);
        }
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
  };

  const handleFABClick = () => {
    setShowModal(true);
  };

  const handleEventoCreated = async () => {
    // Recargar eventos
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/calendario/mes?mes=${mes}&anio=${anio}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
    <main
      className="min-h-screen relative overflow-hidden px-5 pt-6 pb-32"
      style={{ backgroundColor: "#F9F5F0" }}
    >
      <div
        className="absolute -top-20 -left-15 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: "#A8C5A0" }}
      />
      <div
        className="absolute bottom-0 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: "#C9A96E" }}
      />

      <section className="relative z-10">
        <BackLink href="/closet" label="Volver al closet" />
        <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
          Planifica tu estilo
        </p>
        <h1 className="text-[2.2rem] font-light tracking-[-0.02em] mt-2">Calendario ✦</h1>
        <p className="mt-2 text-sm" style={{ color: "#9a9a8e" }}>
          Organiza tus outfits y eventos en el tiempo.
        </p>
      </section>

      <div className="mt-8 relative z-10">
        {/* Header del mes */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleMesAnterior}
            className="p-2 rounded-lg hover:opacity-70 transition"
            style={{ backgroundColor: "#F0EBE4" }}
          >
            <ChevronLeft size={20} style={{ color: "#2C3E2D" }} />
          </button>

          <h2
            className="text-lg font-light capitalize"
            style={{ color: "#2C3E2D" }}
          >
            {nombreMes}
          </h2>

          <button
            onClick={handleMesSiguiente}
            className="p-2 rounded-lg hover:opacity-70 transition"
            style={{ backgroundColor: "#F0EBE4" }}
          >
            <ChevronRight size={20} style={{ color: "#2C3E2D" }} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#9a9a8e" }}>Cargando calendario...</p>
        ) : (
          <CalendarGrid
            mes={mes}
            anio={anio}
            eventos={eventos}
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
          />
        )}
      </div>

      {/* Botón FAB flotante */}
      <button
        onClick={handleFABClick}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition transform hover:scale-110 z-60"
        style={{ backgroundColor: "#2C3E2D" }}
      >
        <Plus size={24} style={{ color: "#F9F5F0" }} />
      </button>

      {/* Modal superpuesto */}
      {showModal && (
        <CalendarFABModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onEventoCreated={handleEventoCreated}
          mes={mes}
          anio={anio}
          onDateSelected={setSelectedDate}
        />
      )}
    </main>
  );
}
