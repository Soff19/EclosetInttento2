"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Plus, ChevronDown } from "lucide-react";

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

export default function NuevaPrendaPage() {
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

      router.push("/closet");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(26,26,26,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl px-6 py-7"
        style={{
          background: "#F9F5F0",
          boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p
              className="uppercase text-[10px] tracking-[0.18em] mb-1"
              style={{ color: "#9a9a8e" }}
            >
              Tu closet
            </p>
            <h2
              className="text-[1.6rem] font-light tracking-[-0.02em]"
              style={{ color: "#1a1a1a" }}
            >
              Nueva prenda ✦
            </h2>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-1 p-2 rounded-full transition"
            style={{ background: "rgba(0,0,0,0.05)" }}
          >
            <X size={18} style={{ color: "#6b6b60" }} />
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
          className="relative w-full rounded-2xl overflow-hidden cursor-pointer transition-all mb-5"
          style={{
            height: "180px",
            border: isDragging ? "2px dashed #A8C5A0" : "2px dashed #e8e4de",
            background: imagenPreview ? "transparent" : "rgba(255,255,255,0.7)",
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
              <Upload size={24} style={{ color: "#A8C5A0" }} />
              <p className="text-sm font-light" style={{ color: "#9a9a8e" }}>
                Arrastrá o hacé clic para subir
              </p>
              <p className="text-[11px]" style={{ color: "#c4c0ba" }}>
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

        <div style={{ height: "1px", background: "#e8e4de", marginBottom: "20px" }} />

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
                style={{
                  background: talle === t ? "#2C3E2D" : "#fff",
                  color: talle === t ? "#F9F5F0" : "#4a4a42",
                  border: talle === t ? "1px solid #2C3E2D" : "1px solid #e8e4de",
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
                style={{
                  background: "rgba(168,197,160,0.15)",
                  color: "#3d5c3e",
                  border: "1px solid #A8C5A0",
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
              style={{ background: "#2C3E2D", color: "#F9F5F0" }}
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
                  style={{ background: "#2C3E2D", color: "#F9F5F0" }}
                >
                  #{tag}
                  <button onClick={() => quitarEtiqueta(tag)} className="ml-0.5">
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
            style={{ background: "rgba(201,87,87,0.08)", color: "#b85555" }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3.5 rounded-xl text-[11px] tracking-[0.18em] uppercase transition"
            style={{
              background: "#fff",
              border: "1px solid #e8e4de",
              color: "#4a4a42",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl text-[11px] tracking-[0.18em] uppercase transition"
            style={{
              background: loading ? "#9a9a8e" : "#2C3E2D",
              color: "#F9F5F0",
            }}
          >
            {loading ? "Guardando..." : "Guardar prenda"}
          </button>
        </div>
      </div>
    </div>
  );
}
