"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "@/app/fashion-sections.module.css";

export const MARKETPLACE_STYLES = [
  ["casual", "Casual"],
  ["vintage", "Vintage"],
  ["verano", "Verano"],
  ["elegante", "Elegante"],
  ["deportivo", "Deportivo"],
] as const;
const OTHER_STYLE = "otro";
export const MARKETPLACE_TYPES = [
  ["short", "Short"],
  ["pantalon", "Pantalón"],
  ["remera", "Remera"],
  ["blusa", "Blusa"],
  ["vestido", "Vestido"],
  ["camisa", "Camisa"],
  ["zapatos", "Zapatos"],
] as const;
export const MARKETPLACE_SIZES = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL",
  "30", "32", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47",
  "Único", "Otro",
];
const MARKETPLACE_SIZE_GROUPS = {
  arriba: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"],
  abajo: ["30", "32", "34", "36", "38", "40", "42", "44", "46"],
  calzado: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47"],
} as const;
const SIZE_GROUP_BY_TYPE: Record<string, keyof typeof MARKETPLACE_SIZE_GROUPS> = {
  remera: "arriba",
  blusa: "arriba",
  vestido: "arriba",
  camisa: "arriba",
  short: "abajo",
  pantalon: "abajo",
  zapatos: "calzado",
};
export const MARKETPLACE_COLORS = [
  ["negro", "Negro"],
  ["blanco", "Blanco"],
  ["gris", "Gris"],
  ["beige", "Beige"],
  ["marron", "Marrón"],
  ["rojo", "Rojo"],
  ["naranja", "Naranja"],
  ["amarillo", "Amarillo"],
  ["verde", "Verde"],
  ["azul", "Azul"],
  ["celeste", "Celeste"],
  ["violeta", "Violeta"],
  ["rosa", "Rosa"],
  ["multicolor", "Multicolor"],
] as const;

interface NuevoProductoFormProps {
  modal?: boolean;
  onClose?: () => void;
  onPublished?: () => void;
}

export default function NuevoProductoForm({
  modal = false,
  onClose,
  onPublished,
}: NuevoProductoFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [color, setColor] = useState("");
  const [talle, setTalle] = useState("");
  const [sistemaTalle, setSistemaTalle] = useState<"AR" | "EU" | "US">("AR");
  const [tipo, setTipo] = useState("");
  const [estilo, setEstilo] = useState("");
  const [estiloPersonalizado, setEstiloPersonalizado] = useState("");
  const [form, setForm] = useState({ titulo: "", descripcion: "", precio: "", contacto: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!modal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
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
  }, [modal, onClose]);

  function closeForm() {
    if (onClose) onClose();
    else router.back();
  }

  function selectFile(next: File) {
    if (!next.type.startsWith("image/") || next.size > 5 * 1024 * 1024) { setError("Elegí una imagen válida de hasta 5MB."); return; }
    setFile(next); setPreview(URL.createObjectURL(next)); setError("");
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (tag && !tags.includes(tag) && tags.length < 10) setTags([...tags, tag]);
    setTagInput("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.titulo.trim() || !form.precio || !tipo || !file) { setError("Título, tipo de prenda, precio e imagen son obligatorios."); return; }
    const customStyleTag = estiloPersonalizado
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    if (!estilo || (estilo === OTHER_STYLE && !customStyleTag)) {
      setError(estilo === OTHER_STYLE
        ? "Escribí un estilo válido en la opción «Otro»."
        : "Elegí un estilo para la prenda.");
      return;
    }
    if (!color || !talle) { setError("Elegí un color y un talle para la prenda."); return; }
    setSaving(true); setError("");
    try {
      let imagen = "";
      const upload = new FormData(); upload.append("image", file); upload.append("folder", "prendas");
      const imageResponse = await fetch("/api/imagenes", { method: "POST", body: upload });
      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.error || "No se pudo subir la imagen");
      imagen = imageData.url;
      const token = localStorage.getItem("token");
      const etiquetas = [
        ...tags,
        `tipo-${tipo}`,
        ...(estilo === OTHER_STYLE
          ? [`estilo-${customStyleTag}`]
          : [estilo]),
        ...(color ? [`color-${color}`] : []),
        `talle-${talle.toLowerCase()}`,
        `sistema-${sistemaTalle.toLowerCase()}`,
      ];
      const response = await fetch("/api/productos", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, credentials: "include", body: JSON.stringify({ ...form, precio: Number(form.precio), imagen, etiquetas }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo publicar");
      if (onPublished) onPublished();
      else router.push("/productos");
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo publicar"); }
    finally { setSaving(false); }
  }

  const formContent = (
    <form
      ref={dialogRef}
      id={modal ? "marketplace-publish-dialog" : undefined}
      onSubmit={submit}
      className={`max-w-lg mx-auto rounded-3xl p-6 ${modal ? styles.garmentModal : ""}`}
      style={{ background: modal ? undefined : "#fff" }}
      {...(modal ? {
        role: "dialog",
        "aria-modal": true,
        "aria-labelledby": "marketplace-publish-title",
        tabIndex: -1,
      } : {})}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="uppercase text-[10px] tracking-wider" style={{ color: "#0B493D" }}>Marketplace</p>
          <h1 id="marketplace-publish-title" className={modal ? styles.garmentModalTitle : "text-2xl font-light"}>Publicar prenda</h1>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={closeForm}
          className={modal ? styles.garmentModalClose : ""}
          data-garment-interactive={modal ? "" : undefined}
        >
          <X size={20} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-48 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2"
        style={{ border: "2px dashed #e8e4de", background: "#F9F5F0" }}
        data-garment-upload={modal ? "" : undefined}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
        ) : (
          <>
            <Upload size={24} style={{ color: "#0B493D" }} />
            <span className="text-sm" style={{ color: "#55524C" }}>Subir imagen</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const next = event.target.files?.[0]; if (next) selectFile(next); }} />
      <div className="space-y-4 mt-5">
        <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título de la publicación" className="w-full rounded-xl border p-3 outline-none" />
        <textarea required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" rows={4} className="w-full rounded-xl border p-3 outline-none" />
        <input required type="number" min="0" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Precio" className="w-full rounded-xl border p-3 outline-none" />
        <input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} placeholder="Link de contacto (WhatsApp, Instagram...)" className="w-full rounded-xl border p-3 outline-none" />
        <label className={styles.marketplaceFormField}>
          <span className={styles.marketplaceChoiceLegend}>Tipo de prenda</span>
          <select required value={tipo} onChange={(event) => { setTipo(event.target.value); setTalle(""); }} className={styles.marketplaceSelect}>
            <option value="" disabled>Elegí un tipo</option>
            {MARKETPLACE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <fieldset className={styles.marketplaceChoiceGroup}>
          <legend className={styles.marketplaceChoiceLegend}>Estilo <span>(obligatorio)</span></legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Estilo de la prenda" aria-required="true">
            {MARKETPLACE_STYLES.map(([value, label]) => (
              <label
                key={value}
                className={`${styles.marketplaceStyleChoice} ${estilo === value ? styles.marketplaceStyleChoiceSelected : ""}`}
                data-garment-interactive={modal ? "" : undefined}
              >
                <input
                  type="radio"
                  name="estilo-prenda"
                  value={value}
                  checked={estilo === value}
                  onChange={() => {
                    setEstilo(value);
                    setError("");
                  }}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
            <label
              className={`${styles.marketplaceStyleChoice} ${styles.marketplaceOtherStyleChoice} ${estilo === OTHER_STYLE ? styles.marketplaceStyleChoiceSelected : ""}`}
              data-garment-interactive={modal ? "" : undefined}
            >
              <input
                type="radio"
                name="estilo-prenda"
                value={OTHER_STYLE}
                checked={estilo === OTHER_STYLE}
                onChange={() => {
                  setEstilo(OTHER_STYLE);
                  setError("");
                }}
                className="sr-only"
              />
              <span>Otro</span>
              <input
                type="text"
                value={estiloPersonalizado}
                onFocus={() => setEstilo(OTHER_STYLE)}
                onChange={(event) => {
                  setEstilo(OTHER_STYLE);
                  setEstiloPersonalizado(event.target.value);
                  setError("");
                }}
                maxLength={40}
                aria-label="Escribí otro estilo"
                placeholder="Escribí..."
                className={styles.marketplaceOtherStyleInput}
              />
            </label>
          </div>
        </fieldset>
        <fieldset className={styles.marketplaceChoiceGroup}>
          <legend className={styles.marketplaceChoiceLegend}>Color <span>(obligatorio)</span></legend>
          <div className="flex flex-wrap gap-2">
            {MARKETPLACE_COLORS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={color === value}
                onClick={() => setColor(value)}
                className={styles.marketplaceChoice}
                data-garment-interactive={modal ? "" : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.marketplaceChoiceGroup}>
          <legend className={styles.marketplaceChoiceLegend}>Talle <span>(obligatorio)</span></legend>
          <span className="mb-2 block text-sm text-[#55524C]">Sistema de talles</span>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Sistema de talles">
            {(["AR", "EU", "US"] as const).map((system) => (
              <button
                key={system}
                type="button"
                aria-pressed={sistemaTalle === system}
                onClick={() => setSistemaTalle(system)}
                className={styles.marketplaceChoice}
                data-garment-interactive={modal ? "" : undefined}
              >
                {system}
              </button>
            ))}
          </div>
          {tipo ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Opciones de talle">
              {MARKETPLACE_SIZE_GROUPS[SIZE_GROUP_BY_TYPE[tipo]].map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={talle === option}
                  onClick={() => setTalle(option)}
                  className={styles.marketplaceChoice}
                  data-garment-interactive={modal ? "" : undefined}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6b6b60]">Primero elegí el tipo de prenda para ver los talles disponibles.</p>
          )}
        </fieldset>
        <div className="flex gap-2">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Etiqueta y Enter" className="min-w-0 flex-1 rounded-xl border p-3 outline-none" />
          <button type="button" onClick={addTag} className="rounded-xl px-4" style={{ background: "#f4ede2" }} data-garment-interactive={modal ? "" : undefined}><Plus size={16} /></button>
        </div>
        <div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} onClick={() => setTags(tags.filter((item) => item !== tag))} className="rounded-full px-3 py-1 text-xs" style={{ background: "#d7ead4" }} data-garment-interactive={modal ? "" : undefined}>#{tag} ×</button>)}</div>
      </div>
      {error && <p className="mt-4 text-sm" role="alert" style={{ color: "#702D25" }}>{error}</p>}
      <div className="mt-6 flex gap-3">
        {modal && (
          <button
            type="button"
            onClick={closeForm}
            className={styles.marketplacePublishCancel}
            data-garment-interactive
          >
            Cancelar
          </button>
        )}
        <button
          disabled={saving}
          className={`w-full rounded-xl py-3 disabled:opacity-50 ${modal ? styles.marketplacePublishSubmit : ""}`}
          style={{ background: "#0B493D", color: "#fff" }}
          data-garment-interactive={modal ? "" : undefined}
          data-garment-action={modal ? "primary" : undefined}
        >
          {saving ? "Publicando..." : "Publicar producto"}
        </button>
      </div>
    </form>
  );

  if (!modal) {
    return <main className="min-h-screen px-5 py-6" style={{ background: "#F9F5F0" }}>{formContent}</main>;
  }

  return (
    <div
      className={styles.garmentModalOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForm();
      }}
    >
      {formContent}
    </div>
  );
}
