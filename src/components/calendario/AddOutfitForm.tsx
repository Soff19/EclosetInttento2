"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "../../app/fashion-sections.module.css";

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
        type="button"
        className="mb-4 flex min-h-10 items-center gap-2 text-sm font-bold text-[#0B493D] hover:underline"
      >
        <ChevronLeft size={16} />
        Atrás
      </button>

      {loadingOutfits ? (
        <p role="status" className="text-sm text-[#55524C]">Cargando outfits...</p>
      ) : outfits.length === 0 ? (
        <p className={`${styles.surface} p-4 text-sm text-[#55524C]`}>
          No tienes outfits guardados. Crea uno en tu closet.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="calendar-outfit" className="mb-2 block text-sm font-bold text-[#333333]">
              Selecciona un outfit
            </label>
            <select
              id="calendar-outfit"
              name="outfitId"
              value={selectedOutfitId}
              onChange={(e) => setSelectedOutfitId(e.target.value)}
              className={styles.input}
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
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`${styles.primaryButton} w-full`}
          >
            {loading ? "Agregando..." : "Agregar outfit"}
          </button>
        </form>
      )}
    </div>
  );
}
