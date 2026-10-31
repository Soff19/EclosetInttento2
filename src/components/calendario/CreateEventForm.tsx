"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../app/fashion-sections.module.css";

interface CreateEventFormProps {
  fecha: Date;
  onClose: () => void;
  onEventoCreated: () => void;
  onBack: () => void;
}

export default function CreateEventForm({
  fecha,
  onClose,
  onEventoCreated,
  onBack,
}: CreateEventFormProps) {
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("El título es requerido");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const response = await fetch("/api/calendario/evento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({
          fecha: fecha.toISOString(),
          titulo,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear evento");
      }

      onEventoCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        type="button"
        className="mb-4 flex min-h-10 items-center gap-2 text-sm font-bold text-[#0B493D] hover:underline"
      >
        <ChevronLeft size={16} />
        Atrás
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="calendar-event-title" className="mb-2 block text-sm font-bold text-[#333333]">
            Título del evento
          </label>
          <input
            type="text"
            id="calendar-event-title"
            name="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Ir de compras"
            className={styles.input}
          />
        </div>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`${styles.primaryButton} w-full`}
        >
          {loading ? "Creando..." : "Crear evento"}
        </button>
      </form>
    </div>
  );
}
