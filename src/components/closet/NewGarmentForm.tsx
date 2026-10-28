"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Plus, ChevronDown } from "lucide-react";
import styles from "@/app/fashion-sections.module.css";

const CATEGORIAS = [
  "Remera",
  "Pantalón",
  "Vestido",
  "Falda",
  "Campera",
  "Abrigo",
  "Calzado",
  "Accesorio",
  "Ropa interior",
  "Deportivo",
];

const ETIQUETAS_SUGERIDAS = [
  "casual",
  "elegante",
  "verano",
  "invierno",
  "otoño",
  "primavera",
  "deportivo",
  "vintage",
  "negro",
  "blanco",
  "colorido",
  "estampado",
];

const TALLES = ["XS", "S", "M", "L", "XL", "XXL", "Único", "Otro"];

interface NewGarmentFormProps {
  onClose?: () => void;
  onSaved?: () => void;
}

export default function NewGarmentForm({ onClose, onSaved }: NewGarmentFormProps = {}) {
  const router = useRouter();

  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categoriaCustom, setCategoriaCustom] = useState("");
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [talle, setTalle] = useState("");
  const [color, setColor] = useState("");
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [etiquetaInput, setEtiquetaInput] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (onClose) onClose();
        else router.back();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, router]);

  function closeForm() {
    if (onClose) onClose();
    else router.back();
  }

  const handleImagen = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5MB.");
      return;
    }
    setError("");
    setImagen(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImagen(file);
  }, []);

  const agregarEtiqueta = (tag: string) => {
    const clean = tag.toLowerCase().trim().replace(/^#/, "");
    if (clean && !etiquetas.includes(clean) && etiquetas.length < 10) {
      setEtiquetas((prev) => [...prev, clean]);
    }
    setEtiquetaInput("");
  };

  const quitarEtiqueta = (tag: string) => {
    setEtiquetas((prev) => prev.filter((e) => e !== tag));
  };

  const categoriaFinal = categoria === "Otro" ? categoriaCustom : categoria;

  const handleSubmit = async () => {
    setError("");

    if (!nombre.trim()) {
      setError("El nombre de la prenda es obligatorio.");
      return;
    }
    if (!categoriaFinal.trim()) {
      setError("La categoría es obligatoria.");
      return;
    }
    if (!talle) {
      setError("El talle es obligatorio.");
      return;
    }
    if (!imagen) {
      setError("La imagen es obligatoria.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("nombre", nombre.trim());
      formData.append("categoria", categoriaFinal.trim());
      formData.append("talle", talle);
      formData.append("color", color.trim());
      formData.append("descripcion", descripcion.trim());
      formData.append("etiquetas", JSON.stringify(etiquetas));
      formData.append("imagen", imagen);

      const res = await fetch("/api/prendas", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error al guardar la prenda.");
        return;
      }

      if (onSaved) onSaved();
      else router.push("/closet");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.garmentModalOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForm();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="garment-modal-title"
        tabIndex={-1}
        className={styles.garmentModal}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p
              className="uppercase text-[10px] tracking-[0.18em] mb-1"
              style={{ color: "#0B493D" }}
            >
              Tu closet
            </p>
            <h2
              id="garment-modal-title"
              className={styles.garmentModalTitle}
              style={{ color: "#0B493D" }}
            >
              Nueva prenda
            </h2>
          </div>
          <button
            onClick={closeForm}
            aria-label="Cerrar formulario"
            className={styles.garmentModalClose}
            data-garment-interactive
          >
            <X size={18} />
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Seleccionar imagen de la prenda"
          data-garment-upload
          className="relative w-full rounded-2xl overflow-hidden cursor-pointer transition-all mb-5"
          style={{
            height: "180px",
            border: isDragging ? "2px dashed #0B493D" : "2px dashed #E5E1D9",
            background: imagenPreview ? "transparent" : "rgba(247,241,231,0.85)",
          }}
        >
          {imagenPreview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.35)" }}
              >
                <p className="text-white text-xs tracking-widest uppercase">
                  Cambiar imagen
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Upload size={24} style={{ color: "#0B493D" }} />
              <p className="text-sm" style={{ color: "#0B493D" }}>
                Arrastrá o hacé clic para subir
              </p>
              <p className="text-xs" style={{ color: "#55524C" }}>
                JPG, PNG o WEBP · máx. 5MB
              </p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImagen(file);
          }}
        />

        <div style={{ height: "1px", background: "#E5E1D9", marginBottom: "20px" }} />

        <div className="mb-4">
          <label
            className="block uppercase text-[10px] tracking-[0.15em] font-medium mb-2"
            style={{ color: "#6b6b60" }}
          >
            Nombre de la prenda <span style={{ color: "#C9A96E" }}>*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Campera de jean azul"
            className="w-full outline-none transition"
            style={{
              background: "#fff",
              border: "1px solid #e8e4de",
              borderRadius: "12px",
              padding: "11px 14px",
              fontSize: "13px",
              color: "#1a1a1a",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#A8C5A0")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e4de")}
          />
        </div>

        <div className="mb-4 relative">
          <label
            className="block uppercase text-[10px] tracking-[0.15em] font-medium mb-2"
            style={{ color: "#6b6b60" }}
          >
            Categoría <span style={{ color: "#C9A96E" }}>*</span>
          </label>
          <button
            type="button"
            onClick={() => setMostrarCategorias(!mostrarCategorias)}
            className="w-full flex items-center justify-between transition"
            data-garment-category-trigger
            data-garment-interactive
            style={{
              background: "#fff",
              border: "1px solid #e8e4de",
              borderRadius: "12px",
              padding: "11px 14px",
              fontSize: "13px",
              color: categoria ? "#1a1a1a" : "#9a9a8e",
            }}
          >
            <span>{categoria || "Seleccioná una categoría"}</span>
            <ChevronDown size={16} style={{ color: "#9a9a8e" }} />
          </button>

          {mostrarCategorias && (
            <div
              className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden"
              style={{
                background: "#fff",
                border: "1px solid #e8e4de",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              {[...CATEGORIAS, "Otro"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategoria(cat);
                    setMostrarCategorias(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition hover:bg-[#F9F5F0]"
                  data-garment-interactive
                  style={{ color: "#1a1a1a" }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {categoria === "Otro" && (
            <input
              type="text"
              value={categoriaCustom}
              onChange={(e) => setCategoriaCustom(e.target.value)}
              placeholder="Escribí la categoría"
              className="w-full outline-none mt-2 transition"
              style={{
                background: "#fff",
                border: "1px solid #e8e4de",
                borderRadius: "12px",
                padding: "11px 14px",
                fontSize: "13px",
                color: "#1a1a1a",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#A8C5A0")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e4de")}
            />
          )}
        </div>

        <div className="mb-4">
          <label
            className="block uppercase text-[10px] tracking-[0.15em] font-medium mb-2"
            style={{ color: "#6b6b60" }}
          >
            Talle <span style={{ color: "#C9A96E" }}>*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TALLES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTalle(t)}
                className="px-4 py-2 rounded-xl text-xs font-medium transition"
                data-garment-interactive
                style={{
                  background: talle === t ? "#0B493D" : "#F7F1E7",
                  color: talle === t ? "#fff" : "#333333",
                  border: talle === t ? "1px solid #0B493D" : "1px solid #E5E1D9",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label
            className="block uppercase text-[10px] tracking-[0.15em] font-medium mb-2"
            style={{ color: "#6b6b60" }}
          >
            Color{" "}
            <span style={{ color: "#9a9a8e", textTransform: "none", letterSpacing: 0 }}>
              (opcional)
            </span>
          </label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Ej: azul, negro, beige"
            className="w-full outline-none transition"
            style={{
              background: "#fff",
              border: "1px solid #e8e4de",
              borderRadius: "12px",
              padding: "11px 14px",
              fontSize: "13px",
              color: "#1a1a1a",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#A8C5A0")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e4de")}
          />
        </div>

        <div className="mb-4">
          <label
            className="block uppercase text-[10px] tracking-[0.15em] font-medium mb-2"
            style={{ color: "#6b6b60" }}
          >
            Etiquetas
          </label>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {ETIQUETAS_SUGERIDAS.filter((s) => !etiquetas.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => agregarEtiqueta(s)}
                className="px-3 py-1 rounded-full text-[11px] transition"
                data-garment-interactive
                style={{
                  background: "#C6EFD6",
                  color: "#0B493D",
                  border: "1px solid #A8BC99",
                }}
              >
                + #{s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={etiquetaInput}
              onChange={(e) => setEtiquetaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  agregarEtiqueta(etiquetaInput);
                }
              }}
              placeholder="#tuetiqueta"
              className="flex-1 outline-none transition"
              style={{
                background: "#fff",
                border: "1px solid #e8e4de",
                borderRadius: "12px",
                padding: "9px 14px",
                fontSize: "13px",
                color: "#1a1a1a",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#A8C5A0")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e4de")}
            />
            <button
              type="button"
              onClick={() => agregarEtiqueta(etiquetaInput)}
              className="px-3 rounded-xl transition"
              data-garment-interactive
              data-garment-action="primary"
              style={{ background: "#0B493D", color: "#F7F1E7" }}
            >
              <Plus size={16} />
            </button>
          </div>

          {etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {etiquetas.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px]"
                  style={{ background: "#0B493D", color: "#F7F1E7" }}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => quitarEtiqueta(tag)}
                    className="ml-0.5"
                    aria-label={`Quitar etiqueta ${tag}`}
                    data-garment-interactive
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <label
            className="block uppercase text-[10px] tracking-[0.15em] font-medium mb-2"
            style={{ color: "#6b6b60" }}
          >
            Descripción{" "}
            <span style={{ color: "#9a9a8e", textTransform: "none", letterSpacing: 0 }}>
              (opcional)
            </span>
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Contá algo sobre esta prenda..."
            rows={3}
            className="w-full outline-none resize-none transition"
            style={{
              background: "#fff",
              border: "1px solid #e8e4de",
              borderRadius: "12px",
              padding: "11px 14px",
              fontSize: "13px",
              color: "#1a1a1a",
              lineHeight: "1.6",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#A8C5A0")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e4de")}
          />
        </div>

        {error && (
          <p
            className="text-xs mb-4 px-3 py-2 rounded-xl"
            style={{ background: "#FFF0ED", color: "#702D25" }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={closeForm}
            className="flex-1 py-3.5 rounded-xl text-[11px] tracking-[0.18em] uppercase transition"
            data-garment-interactive
            style={{
              background: "#F7F1E7",
              border: "1px solid #E5E1D9",
              color: "#0B493D",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl text-[11px] tracking-[0.18em] uppercase transition"
            data-garment-interactive
            data-garment-action="primary"
            style={{
              background: loading ? "#6CAF7B" : "#0B493D",
              color: "#F7F1E7",
            }}
          >
            {loading ? "Guardando..." : "Guardar prenda"}
          </button>
        </div>
      </div>
    </div>
  );
}
