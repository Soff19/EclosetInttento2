"use client";

import { useState } from "react";
import { ChevronLeft, Upload, X } from "lucide-react";
import { getImageKit } from "@/lib/imagekit";

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
        className="flex items-center gap-2 mb-4 text-sm font-light transition hover:opacity-70"
        style={{ color: "#2C3E2D" }}
      >
        <ChevronLeft size={16} />
        Atrás
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        {preview ? (
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview("");
              }}
              className="absolute top-2 right-2 p-2 rounded-full opacity-80 hover:opacity-100 transition"
              style={{ backgroundColor: "#F9F5F0" }}
            >
              <X size={16} style={{ color: "#2C3E2D" }} />
            </button>
          </div>
        ) : (
          <label
            className="border-2 rounded-xl p-6 text-center cursor-pointer transition hover:opacity-80"
            style={{ borderColor: "#e8e4de", borderStyle: "dashed" }}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} style={{ color: "#A8C5A0" }} />
              <span className="text-sm font-light" style={{ color: "#9a9a8e" }}>
                Toca para seleccionar una foto
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {error && (
          <p className="text-sm" style={{ color: "#e74c3c" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded-xl py-3 font-light transition hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: "#C9A96E", color: "#2C3E2D" }}
        >
          {loading ? "Subiendo..." : "Agregar foto"}
        </button>
      </form>
    </div>
  );
}
