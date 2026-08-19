"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Heart, Plus, Search, Star, X } from "lucide-react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";

type Producto = { id: string; titulo: string; descripcion: string; precio: number; estado: string; imagen: string | null; etiquetas: string[]; contacto: string | null; favorito: boolean; promedio: number | null; usuario: { id: string; nombre: string | null; fotoPerfil: string | null; email: string } };

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [selected, setSelected] = useState<Producto | null>(null);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState({ puntuacion: 5, comentario: "" });

  useEffect(() => {
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (tag) params.set("etiqueta", tag);
      const res = await fetch(`/api/productos?${params}`);
      const data = await res.json();
      if (res.ok) setProductos(data.productos || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, tag]);

  async function action(path: string, body?: object) {
    const token = localStorage.getItem("token");
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: "include", ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo completar la acción");
    return data;
  }

  async function toggleFavorite(producto: Producto) {
    try { const data = await action(`/api/productos/${producto.id}/favorito`); setProductos((items) => items.map((item) => item.id === producto.id ? { ...item, favorito: data.favorito } : item)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Iniciá sesión para guardar favoritos"); }
  }

  async function buy(producto: Producto) {
    try { await action(`/api/productos/${producto.id}/comprar`); setMessage("Compra registrada. Contactá al vendedor para coordinar la entrega."); setProductos((items) => items.map((item) => item.id === producto.id ? { ...item, estado: "RESERVADO" } : item)); setSelected({ ...producto, estado: "RESERVADO" }); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo registrar la compra"); }
  }

  async function submitReview() {
    if (!selected) return;
    try { await action(`/api/productos/${selected.id}/resena`, review); setMessage("Gracias por compartir tu experiencia."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar la reseña"); }
  }

  return (
    <main className="min-h-screen relative overflow-hidden px-5 pt-6 pb-32" style={{ background: "#F9F5F0" }}>
      <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#A8C5A0" }} />
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between"><BackLink href="/home" label="Volver al home" /><Link href="/productos/nuevo" className="flex items-center gap-1 text-xs uppercase tracking-wider" style={{ color: "#2C3E2D" }}><Plus size={15} /> Publicar</Link></div>
        <p className="uppercase text-[10px] tracking-[0.18em] mt-5" style={{ color: "#6b6b60" }}>Compra, vende y reutiliza</p><h1 className="text-[2rem] font-light mt-1">Marketplace ✦</h1>
        <div className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "#fff", border: "1px solid #e8e4de" }}><Search size={18} style={{ color: "#9a9a8e" }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar prendas, estilos..." className="w-full bg-transparent outline-none text-sm" /></div>
        <div className="flex flex-wrap gap-2 mt-3">{["", "casual", "vintage", "verano", "elegante", "deportivo"].map((item) => <button key={item || "todos"} onClick={() => setTag(item)} className="rounded-full px-3 py-1.5 text-xs" style={{ background: tag === item ? "#2C3E2D" : "#fff", color: tag === item ? "#fff" : "#6b6b60", border: "1px solid #e8e4de" }}>{item || "Todos"}</button>)}</div>
        {message && <p className="mt-4 text-sm" style={{ color: "#2C3E2D" }}>{message}</p>}
        <div className="grid gap-4 mt-6 sm:grid-cols-2">{productos.map((producto) => <article key={producto.id} className="overflow-hidden rounded-[22px]" style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}><button onClick={() => setSelected(producto)} className="w-full text-left"><div className="h-48" style={{ background: "linear-gradient(135deg,#d7ead4,#f4ede2)" }}>{producto.imagen && <img src={producto.imagen} alt={producto.titulo} className="w-full h-full object-cover" />}</div><div className="p-4"><div className="flex justify-between gap-2"><h2 className="font-light text-lg">{producto.titulo}</h2><span className="font-medium">${producto.precio}</span></div><p className="text-xs mt-2" style={{ color: "#9a9a8e" }}>{producto.usuario.nombre || "Vendedor"} · {producto.estado}</p><div className="flex flex-wrap gap-1 mt-3">{producto.etiquetas.slice(0, 3).map((item) => <span key={item} className="text-[10px] px-2 py-1 rounded-full" style={{ background: "#f4ede2", color: "#6b6b60" }}>#{item}</span>)}</div></div></button><div className="px-4 pb-4 flex justify-between items-center"><span className="text-xs" style={{ color: "#9a9a8e" }}>{producto.promedio ? `★ ${producto.promedio.toFixed(1)}` : "Sin reseñas"}</span><button aria-label="Guardar en favoritos" onClick={() => toggleFavorite(producto)} className="p-2 rounded-full" style={{ color: producto.favorito ? "#b85555" : "#6b6b60", background: "#f9f5f0" }}><Heart size={17} fill={producto.favorito ? "currentColor" : "none"} /></button></div></article>)}</div>
        {productos.length === 0 && <p className="mt-8" style={{ color: "#9a9a8e" }}>No encontramos publicaciones con esos filtros.</p>}
      </div>
      {selected && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(26,26,26,0.4)" }}><section className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6" style={{ background: "#F9F5F0" }}><div className="flex justify-between"><div><p className="uppercase text-[10px] tracking-wider" style={{ color: "#9a9a8e" }}>Detalle de publicación</p><h2 className="text-2xl font-light mt-1">{selected.titulo}</h2></div><button aria-label="Cerrar detalle" onClick={() => setSelected(null)}><X size={20} /></button></div><p className="text-sm mt-4" style={{ color: "#6b6b60" }}>{selected.descripcion}</p><div className="mt-4 flex items-center justify-between"><span className="text-2xl">${selected.precio}</span><span className="text-xs uppercase tracking-wider">{selected.estado}</span></div><p className="mt-4 text-sm">Vende <strong>{selected.usuario.nombre || selected.usuario.email}</strong></p><div className="flex gap-3 mt-5"><button disabled={selected.estado !== "DISPONIBLE"} onClick={() => buy(selected)} className="flex-1 rounded-xl py-3 text-sm disabled:opacity-40" style={{ background: "#2C3E2D", color: "#fff" }}>Comprar</button>{selected.contacto && <a href={selected.contacto} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl px-4 text-sm" style={{ border: "1px solid #2C3E2D", color: "#2C3E2D" }}>Contactar <ExternalLink size={15} /></a>}</div><div className="mt-6 pt-5" style={{ borderTop: "1px solid #e8e4de" }}><p className="text-sm font-medium">Dejá una reseña</p><div className="flex gap-1 mt-3">{[1, 2, 3, 4, 5].map((score) => <button key={score} aria-label={`${score} estrellas`} onClick={() => setReview({ ...review, puntuacion: score })}><Star size={20} fill={score <= review.puntuacion ? "#C9A96E" : "none"} color="#C9A96E" /></button>)}</div><textarea value={review.comentario} onChange={(e) => setReview({ ...review, comentario: e.target.value })} placeholder="Contá tu experiencia" className="w-full mt-3 rounded-xl p-3 text-sm outline-none" rows={3} style={{ border: "1px solid #e8e4de" }} /><button onClick={submitReview} className="mt-3 rounded-xl px-4 py-2 text-sm" style={{ background: "#fff", border: "1px solid #e8e4de" }}>Guardar reseña</button></div></section></div>}
      <BottomNavigation />
    </main>
  );
}
