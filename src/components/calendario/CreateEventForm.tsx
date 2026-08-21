"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";

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
        className="flex items-center gap-2 mb-4 text-sm font-light transition hover:opacity-70"
        style={{ color: "#2C3E2D" }}
      >
        <ChevronLeft size={16} />
        Atrás
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-light mb-2"
            style={{ color: "#2C3E2D" }}
          >
            Título del evento
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Ir de compras"
            className="w-full rounded-[12px] px-4 py-3 border font-light"
            style={{
              backgroundColor: "#fff",
              borderColor: "#e8e4de",
              color: "#2C3E2D",
            }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "#e74c3c" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[12px] py-3 font-light transition hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: "#A8C5A0", color: "#2C3E2D" }}
        >
          {loading ? "Creando..." : "Crear evento"}
        </button>
      </form>
    </div>
  );
}
