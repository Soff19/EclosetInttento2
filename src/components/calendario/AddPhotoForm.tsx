"use client";

import { useState } from "react";
import { ChevronLeft, Upload, X } from "lucide-react";
import styles from "../../app/fashion-sections.module.css";

interface AddPhotoFormProps {
  fecha: Date;
  onClose: () => void;
  onEventoCreated: () => void;
  onBack: () => void;
}

export default function AddPhotoForm({
  fecha,
  onClose,
  onEventoCreated,
  onBack,
}: AddPhotoFormProps) {
  const [preview, setPreview] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Selecciona una imagen");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Subir imagen a ImageKit
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", `calendario-${Date.now()}-${file.name}`);
      formData.append("folder", "/calendario");

      const uploadResponse = await fetch("/api/imagenes", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Error subiendo imagen");
      }

      const uploadedData = await uploadResponse.json();
      const imageUrl = uploadedData.url;

      // Crear evento con la foto
      const token = localStorage.getItem("token");
      const response = await fetch("/api/calendario/foto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({
          fecha: fecha.toISOString(),
          urlImagen: imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al agregar foto");
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
        {preview ? (
          <div className={`${styles.surface} relative overflow-hidden`}>
            <img
              src={preview}
              alt="Preview"
              className="h-48 w-full object-contain p-2"
            />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview("");
              }}
              aria-label="Quitar imagen"
              className={`${styles.iconButton} absolute right-2 top-2 h-10 w-10 rounded-full p-0`}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label
            className="cursor-pointer rounded-xl border-2 border-dashed border-[#C7C2B8] bg-white p-6 text-center transition-colors hover:border-[#0B493D] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0B493D]"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} aria-hidden="true" className="text-[#0B493D]" />
              <span className="text-sm font-semibold text-[#55524C]">
                Toca para seleccionar una foto
              </span>
            </div>
            <input
              type="file"
              aria-label="Seleccionar foto de outfit"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only peer"
            />
          </label>
        )}

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className={`${styles.primaryButton} w-full`}
        >
          {loading ? "Subiendo..." : "Agregar foto"}
        </button>
      </form>
    </div>
  );
}
