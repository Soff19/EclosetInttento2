"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";

interface Outfit {
  id: string;
  nombre: string;
  categoria?: string;
  descripcion?: string;
}

interface AddOutfitFormProps {
  fecha: Date;
  onClose: () => void;
  onEventoCreated: () => void;
  onBack: () => void;
}

export default function AddOutfitForm({
  fecha,
  onClose,
  onEventoCreated,
  onBack,
}: AddOutfitFormProps) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selectedOutfitId, setSelectedOutfitId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOutfits, setLoadingOutfits] = useState(false);
  const [error, setError] = useState("");

  // Cargar outfits del usuario
  useEffect(() => {
    (async () => {
      try {
        setLoadingOutfits(true);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/outfits", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setOutfits(data.outfits || []);
        }
      } catch (err) {
        setError("Error cargando outfits");
      } finally {
        setLoadingOutfits(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutfitId) {
      setError("Selecciona un outfit");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const response = await fetch("/api/calendario/outfit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({
          fecha: fecha.toISOString(),
          outfitId: selectedOutfitId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al agregar outfit");
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

      {loadingOutfits ? (
        <p style={{ color: "#9a9a8e" }}>Cargando outfits...</p>
      ) : outfits.length === 0 ? (
        <p style={{ color: "#9a9a8e" }}>
          No tienes outfits guardados. Crea uno en tu closet.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-light mb-2"
              style={{ color: "#2C3E2D" }}
            >
              Selecciona un outfit
            </label>
            <select
              value={selectedOutfitId}
              onChange={(e) => setSelectedOutfitId(e.target.value)}
              className="w-full rounded-[12px] px-4 py-3 border font-light"
              style={{
                backgroundColor: "#fff",
                borderColor: "#e8e4de",
                color: "#2C3E2D",
              }}
            >
              <option value="">-- Elige un outfit --</option>
              {outfits.map((outfit) => (
                <option key={outfit.id} value={outfit.id}>
                  {outfit.nombre}
                  {outfit.categoria && ` • ${outfit.categoria}`}
                </option>
              ))}
            </select>
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
            style={{ backgroundColor: "#2C3E2D", color: "#F9F5F0" }}
          >
            {loading ? "Agregando..." : "Agregar outfit"}
          </button>
        </form>
      )}
    </div>
  );
}
