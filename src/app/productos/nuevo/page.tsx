"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NuevoProductoPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({ titulo: "", descripcion: "", precio: "", contacto: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (!form.titulo.trim() || !form.precio || !file) { setError("Título, precio e imagen son obligatorios."); return; }
    setSaving(true); setError("");
    try {
      let imagen = "";
      const upload = new FormData(); upload.append("image", file); upload.append("folder", "productos");
      const imageResponse = await fetch("/api/imagenes", { method: "POST", body: upload });
      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.error || "No se pudo subir la imagen");
      imagen = imageData.url;
      const token = localStorage.getItem("token");
      const response = await fetch("/api/productos", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: "include", body: JSON.stringify({ ...form, precio: Number(form.precio), imagen, etiquetas: tags }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo publicar");
      router.push("/productos");
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo publicar"); }
    finally { setSaving(false); }
  }

  return <main className="min-h-screen px-5 py-6" style={{ background: "#F9F5F0" }}><form onSubmit={submit} className="max-w-lg mx-auto rounded-3xl p-6" style={{ background: "#fff" }}><div className="flex justify-between items-center mb-6"><div><p className="uppercase text-[10px] tracking-wider" style={{ color: "#9a9a8e" }}>Marketplace</p><h1 className="text-2xl font-light">Publicar prenda</h1></div><button type="button" aria-label="Cerrar" onClick={() => router.back()}><X size={20} /></button></div><button type="button" onClick={() => inputRef.current?.click()} className="w-full h-48 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2" style={{ border: "2px dashed #e8e4de", background: "#F9F5F0" }}>{preview ? <img src={preview} alt="Vista previa" className="w-full h-full object-cover" /> : <><Upload size={24} style={{ color: "#A8C5A0" }} /><span className="text-sm" style={{ color: "#9a9a8e" }}>Subir imagen</span></>}</button><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const next = event.target.files?.[0]; if (next) selectFile(next); }} /><div className="space-y-4 mt-5"><input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título de la publicación" className="w-full rounded-xl border p-3 outline-none" /><textarea required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" rows={4} className="w-full rounded-xl border p-3 outline-none" /><input required type="number" min="0" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Precio" className="w-full rounded-xl border p-3 outline-none" /><input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} placeholder="Link de contacto (WhatsApp, Instagram...)" className="w-full rounded-xl border p-3 outline-none" /><div className="flex gap-2"><input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Etiqueta y Enter" className="min-w-0 flex-1 rounded-xl border p-3 outline-none" /><button type="button" onClick={addTag} className="rounded-xl px-4" style={{ background: "#f4ede2" }}>+</button></div><div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} onClick={() => setTags(tags.filter((item) => item !== tag))} className="rounded-full px-3 py-1 text-xs" style={{ background: "#d7ead4" }}>#{tag} ×</button>)}</div></div>{error && <p className="mt-4 text-sm" style={{ color: "#b85555" }}>{error}</p>}<button disabled={saving} className="w-full mt-6 rounded-xl py-3 disabled:opacity-50" style={{ background: "#2C3E2D", color: "#fff" }}>{saving ? "Publicando..." : "Publicar producto"}</button></form></main>;
}