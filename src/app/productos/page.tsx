"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Heart, Plus, Search, Star, Trash2, X } from "lucide-react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";

type Resena = {
  id: string;
  puntuacion: number;
  comentario: string | null;
  creadoEn: string;
  usuario: { nombre: string | null; email: string };
};
type Producto = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: string;
  imagen: string | null;
  etiquetas: string[];
  contacto: string | null;
  favorito: boolean;
  promedio: number | null;
  cantidadResenas: number;
  resenas: Resena[];
  esPropio: boolean;
  usuario: {
    id: string;
    nombre: string | null;
    fotoPerfil: string | null;
    email: string;
  };
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [activeTab, setActiveTab] = useState<"explorar" | "mias">("explorar");
  const [selected, setSelected] = useState<Producto | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [review, setReview] = useState({ puntuacion: 5, comentario: "" });

  useEffect(() => {
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (tag) params.set("etiqueta", tag);
      if (activeTab === "mias") params.set("mias", "true");
      const res = await fetch(`/api/productos?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setProductos([]);
        setLoadError(data.error || "No se pudieron cargar las publicaciones.");
        return;
      }
      setLoadError("");
      const loadedProducts = data.productos || [];
      setProductos(loadedProducts);
      const requestedProductId = new URLSearchParams(window.location.search).get("producto");
      if (requestedProductId) {
        const requestedProduct = loadedProducts.find((item: Producto) => item.id === requestedProductId);
        if (requestedProduct) setSelected(requestedProduct);
        else {
          const response = await fetch(`/api/productos?id=${encodeURIComponent(requestedProductId)}`);
          const result = await response.json();
          if (response.ok && result.productos?.[0]) setSelected(result.productos[0]);
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, tag, activeTab]);

  async function action(path: string, body?: object) {
    const token = localStorage.getItem("token");
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "No se pudo completar la acción");
    return data;
  }

  async function toggleFavorite(producto: Producto) {
    try {
      const data = await action(`/api/productos/${producto.id}/favorito`);
      setProductos((items) =>
        items.map((item) =>
          item.id === producto.id ? { ...item, favorito: data.favorito } : item,
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Iniciá sesión para guardar favoritos",
      );
    }
  }

  async function buy(producto: Producto) {
    try {
      const result = await action(`/api/productos/${producto.id}/comprar`);
      window.dispatchEvent(new Event("notificaciones:actualizadas"));
      setMessage(result.created === false
        ? "Ya habías enviado una solicitud para esta publicación."
        : producto.contacto
          ? "Solicitud registrada. Ya avisamos al vendedor; puedes contactarlo para coordinar."
          : "Solicitud registrada y vendedor notificado. Esta publicación no tiene un contacto externo.");
      setProductos((items) =>
        items.map((item) =>
          item.id === producto.id ? { ...item, estado: "RESERVADO" } : item,
        ),
      );
      setSelected({ ...producto, estado: "RESERVADO" });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la compra",
      );
    }
  }

  async function deleteProduct() {
    if (!selected) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/productos/${selected.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar la publicación");
      setProductos((items) => items.filter((item) => item.id !== selected.id));
      setSelected(null);
      setConfirmDelete(false);
      setDeleteError("");
      setMessage("Publicación eliminada.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "No se pudo eliminar la publicación");
    } finally {
      setDeleting(false);
    }
  }

  async function submitReview() {
    if (!selected) return;
    try {
      await action(`/api/productos/${selected.id}/resena`, review);
      const response = await fetch(`/api/productos/${selected.id}`);
      const data = await response.json();
      if (response.ok) {
        const resenas = data.producto.resenas as Resena[];
        const promedio = resenas.length
          ? resenas.reduce((sum, item) => sum + item.puntuacion, 0) /
            resenas.length
          : null;
        setSelected((current) =>
          current
            ? { ...current, resenas, promedio, cantidadResenas: resenas.length }
            : current,
        );
        setProductos((items) =>
          items.map((item) =>
            item.id === selected.id
              ? { ...item, resenas, promedio, cantidadResenas: resenas.length }
              : item,
          ),
        );
      }
      setMessage("Gracias por compartir tu experiencia.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo guardar la reseña",
      );
    }
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden px-5 pt-6 pb-32"
      style={{ background: "#F9F5F0" }}
    >
      <div
        className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: "#A8C5A0" }}
      />
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <BackLink href="/home" label="Volver al home" />
          <div className="flex items-center gap-4">
            <Link
              href="/productos/nuevo"
              className="flex items-center gap-1 text-xs uppercase tracking-wider"
              style={{ color: "#2C3E2D" }}
            >
              <Plus size={15} /> Publicar
            </Link>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          {([
            ["explorar", "Explorar"],
            ["mias", "Mis publicaciones"],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-full px-4 py-2 text-sm"
              style={{
                background: activeTab === tab ? "#2C3E2D" : "#fff",
                color: activeTab === tab ? "#fff" : "#6b6b60",
                border: "1px solid #e8e4de",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p
          className="uppercase text-[10px] tracking-[0.18em] mt-5"
          style={{ color: "#6b6b60" }}
        >
          Compra, vende y reutiliza
        </p>
        <h1 className="text-[2rem] font-light mt-1">Marketplace ✦</h1>
        <div
          className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "#fff", border: "1px solid #e8e4de" }}
        >
          <Search size={18} style={{ color: "#9a9a8e" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar prendas, estilos..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {["", "casual", "vintage", "verano", "elegante", "deportivo"].map(
            (item) => (
              <button
                key={item || "todos"}
                onClick={() => setTag(item)}
                className="rounded-full px-3 py-1.5 text-xs"
                style={{
                  background: tag === item ? "#2C3E2D" : "#fff",
                  color: tag === item ? "#fff" : "#6b6b60",
                  border: "1px solid #e8e4de",
                }}
              >
                {item || "Todos"}
              </button>
            ),
          )}
        </div>
        {(message || loadError) && (
          <p className="mt-4 text-sm" style={{ color: loadError ? "#b85555" : "#2C3E2D" }}>
            {loadError || message}
          </p>
        )}
        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          {productos.map((producto) => (
            <article
              key={producto.id}
              className="overflow-hidden rounded-[22px]"
              style={{
                background: "rgba(255,255,255,0.88)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              }}
            >
              <button
                onClick={() => setSelected(producto)}
                className="w-full text-left"
              >
                <div
                  className="h-48"
                  style={{
                    background: "linear-gradient(135deg,#d7ead4,#f4ede2)",
                  }}
                >
                  {producto.imagen && (
                    <img
                      src={producto.imagen}
                      alt={producto.titulo}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between gap-2">
                    <h2 className="font-light text-lg">{producto.titulo}</h2>
                    <span className="font-medium">${producto.precio}</span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "#9a9a8e" }}>
                    {producto.esPropio ? "Mi publicación" : producto.usuario.nombre || producto.usuario.email} · {producto.estado}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {producto.etiquetas.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="text-[10px] px-2 py-1 rounded-full"
                        style={{ background: "#f4ede2", color: "#6b6b60" }}
                      >
                        #{item}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
              <div className="px-4 pb-4 flex justify-between items-center">
                <span className="text-xs" style={{ color: "#9a9a8e" }}>
                  {producto.promedio
                    ? `★ ${producto.promedio.toFixed(1)}`
                    : "Sin reseñas"}
                </span>
                <button
                  aria-label="Guardar en favoritos"
                  onClick={() => toggleFavorite(producto)}
                  className="p-2 rounded-full"
                  style={{
                    color: producto.favorito ? "#b85555" : "#6b6b60",
                    background: "#f9f5f0",
                  }}
                >
                  <Heart
                    size={17}
                    fill={producto.favorito ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </article>
          ))}
        </div>
        {productos.length === 0 && !loadError && (
          <p className="mt-8" style={{ color: "#9a9a8e" }}>
            {activeTab === "mias"
              ? "Todavía no hiciste publicaciones."
              : "No encontramos publicaciones con esos filtros."}
          </p>
        )}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(26,26,26,0.4)" }}
        >
          <section
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6"
            style={{ background: "#F9F5F0" }}
          >
            <div className="flex justify-between">
              <div>
                <p
                  className="uppercase text-[10px] tracking-wider"
                  style={{ color: "#9a9a8e" }}
                >
                  Detalle de publicación
                </p>
                <h2 className="text-2xl font-light mt-1">{selected.titulo}</h2>
              </div>
              <button
                aria-label="Cerrar detalle"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm mt-4" style={{ color: "#6b6b60" }}>
              {selected.descripcion}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl">${selected.precio}</span>
              <span className="text-xs uppercase tracking-wider">
                {selected.estado}
              </span>
            </div>
            <p className="mt-4 text-sm">
              {selected.esPropio ? (
                <strong>Tu publicación</strong>
              ) : (
                <>Vende <strong>{selected.usuario.nombre || selected.usuario.email}</strong></>
              )}
            </p>
            <div className="flex gap-3 mt-5">
              {selected.esPropio ? (
                <button
                  onClick={() => {
                    setDeleteError("");
                    setConfirmDelete(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm"
                  style={{ background: "#b85555", color: "#fff" }}
                >
                  <Trash2 size={16} /> Eliminar publicación
                </button>
              ) : (
                <button
                  disabled={selected.estado !== "DISPONIBLE"}
                  onClick={() => buy(selected)}
                  className="flex-1 rounded-xl py-3 text-sm disabled:opacity-40"
                  style={{ background: "#2C3E2D", color: "#fff" }}
                >
                  Comprar
                </button>
              )}
              {!selected.esPropio && selected.contacto && (
                <a
                  href={selected.contacto}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl px-4 text-sm"
                  style={{ border: "1px solid #2C3E2D", color: "#2C3E2D" }}
                >
                  Contactar <ExternalLink size={15} />
                </a>
              )}
            </div>
            <div
              className="mt-6 pt-5"
              style={{ borderTop: "1px solid #e8e4de" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Reseñas ({selected.cantidadResenas})
                  </p>
                  {selected.promedio !== null && (
                    <span className="text-sm" style={{ color: "#C9A96E" }}>
                      ★ {selected.promedio.toFixed(1)}
                    </span>
                  )}
                </div>
                {selected.resenas.length > 0 ? (
                  <div className="space-y-3 mt-3">
                    {selected.resenas.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-xl p-3"
                        style={{ background: "#fff" }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm">
                            {item.usuario.nombre || item.usuario.email}
                          </strong>
                          <span
                            className="text-sm whitespace-nowrap"
                            style={{ color: "#C9A96E" }}
                          >
                            {"★".repeat(item.puntuacion)}
                            {"☆".repeat(5 - item.puntuacion)}
                          </span>
                        </div>
                        {item.comentario && (
                          <p className="text-sm mt-2" style={{ color: "#6b6b60" }}>
                            {item.comentario}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm mt-3" style={{ color: "#9a9a8e" }}>
                    Todavía no hay reseñas.
                  </p>
                )}
              </div>
              <p className="text-sm font-medium">Dejá una reseña</p>
              <div className="flex gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    aria-label={`${score} estrellas`}
                    onClick={() => setReview({ ...review, puntuacion: score })}
                  >
                    <Star
                      size={20}
                      fill={score <= review.puntuacion ? "#C9A96E" : "none"}
                      color="#C9A96E"
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={review.comentario}
                onChange={(e) =>
                  setReview({ ...review, comentario: e.target.value })
                }
                placeholder="Contá tu experiencia"
                className="w-full mt-3 rounded-xl p-3 text-sm outline-none"
                rows={3}
                style={{ border: "1px solid #e8e4de" }}
              />
              <button
                onClick={submitReview}
                className="mt-3 rounded-xl px-4 py-2 text-sm"
                style={{ background: "#fff", border: "1px solid #e8e4de" }}
              >
                Guardar reseña
              </button>
            </div>
          </section>
        </div>
      )}
      {confirmDelete && selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{ background: "rgba(26,26,26,0.55)" }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#F9F5F0" }}
          >
            <h2 id="confirm-delete-title" className="text-lg font-medium">
              ¿Estás seguro de eliminar esta publicación?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#6b6b60" }}>
              Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm" style={{ color: "#b85555" }}>{deleteError}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl py-3 text-sm disabled:opacity-50"
                style={{ border: "1px solid #e8e4de", color: "#2C3E2D" }}
              >
                Cancelar
              </button>
              <button
                disabled={deleting}
                onClick={deleteProduct}
                className="flex-1 rounded-xl py-3 text-sm disabled:opacity-50"
                style={{ background: "#b85555", color: "#fff" }}
              >
                {deleting ? "Eliminando..." : "Aceptar"}
              </button>
            </div>
          </section>
        </div>
      )}
      <BottomNavigation />
    </main>
  );
}
