"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Shirt, Trash2 } from "lucide-react";
import ModalMotivoPrenda from "@/components/admin/ModalMotivoPrenda";
import {
  publicacionesEjemplo,
  type PublicacionMarketplace,
} from "./datosEjemplo";

type EliminacionPublicacion = {
  publicacion: PublicacionMarketplace;
  motivo: string;
  explicacion: string;
  fechaEliminacion: string;
};

const categorias = [...new Set(publicacionesEjemplo.map(({ categoria }) => categoria))].sort();
const vendedoras = [...new Set(publicacionesEjemplo.map(({ vendedora }) => vendedora))].sort();

function obtenerHistorialInicial(): EliminacionPublicacion[] {
  return publicacionesEjemplo.flatMap((publicacion) =>
    publicacion.estado === "ELIMINADA" &&
    publicacion.motivoEliminacion &&
    publicacion.explicacionEliminacion &&
    publicacion.fechaEliminacion
      ? [{
          publicacion,
          motivo: publicacion.motivoEliminacion,
          explicacion: publicacion.explicacionEliminacion,
          fechaEliminacion: publicacion.fechaEliminacion,
        }]
      : [],
  );
}

export default function AdminMarketplacePage() {
  const [publicaciones, setPublicaciones] = useState(() =>
    publicacionesEjemplo.filter((publicacion) => publicacion.estado === "ACTIVA"),
  );
  const [historial, setHistorial] = useState(obtenerHistorialInicial);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState("");
  const [publicacionSeleccionada, setPublicacionSeleccionada] =
    useState<PublicacionMarketplace | null>(null);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const botonQueAbrioRef = useRef<HTMLButtonElement | null>(null);
  const botonHistorialRef = useRef<HTMLButtonElement | null>(null);

  const publicacionesFiltradas = publicaciones.filter((publicacion) => {
    const coincideNombre = publicacion.titulo
      .toLocaleLowerCase()
      .includes(busqueda.trim().toLocaleLowerCase());
    const coincideCategoria =
      !categoriaSeleccionada || publicacion.categoria === categoriaSeleccionada;
    const coincideVendedora =
      !vendedoraSeleccionada || publicacion.vendedora === vendedoraSeleccionada;
    return coincideNombre && coincideCategoria && coincideVendedora;
  });

  useEffect(() => {
    if (!publicacionSeleccionada) return;
    const desplazamientoAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = desplazamientoAnterior;
    };
  }, [publicacionSeleccionada]);

  function abrirModal(
    publicacion: PublicacionMarketplace,
    boton: HTMLButtonElement,
  ) {
    botonQueAbrioRef.current = boton;
    setPublicacionSeleccionada(publicacion);
  }

  function cerrarModal() {
    setPublicacionSeleccionada(null);
    window.requestAnimationFrame(() => {
      if (botonQueAbrioRef.current?.isConnected) {
        botonQueAbrioRef.current.focus();
      } else {
        botonHistorialRef.current?.focus();
      }
    });
  }

  function confirmarEliminacion(motivo: string, explicacion: string) {
    if (!publicacionSeleccionada) return;
    const fechaEliminacion = new Date().toISOString();
    const publicacionEliminada: PublicacionMarketplace = {
      ...publicacionSeleccionada,
      estado: "ELIMINADA",
      motivoEliminacion: motivo,
      explicacionEliminacion: explicacion,
      fechaEliminacion,
    };

    setHistorial((actual) => [
      {
        publicacion: publicacionEliminada,
        motivo,
        explicacion,
        fechaEliminacion,
      },
      ...actual,
    ]);
    setPublicaciones((actuales) =>
      actuales.filter((publicacion) => publicacion.id !== publicacionSeleccionada.id),
    );
    cerrarModal();
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: "#F9F5F0" }}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>
            Panel de administración
          </p>
          <h1 className="mt-1 text-3xl font-light tracking-[-0.02em] sm:text-4xl" style={{ color: "#2C3E2D" }}>
            Marketplace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "#6b6b60" }}>
            Revisá las publicaciones activas y eliminá las que incumplan las normas de la comunidad.
          </p>
        </header>

        <section
          aria-label="Resumen de publicaciones"
          className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <article
            className="rounded-[24px] p-4 sm:p-5"
            style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
          >
            <p className="text-xs" style={{ color: "#6b6b60" }}>Publicaciones activas</p>
            <p className="mt-1 text-2xl font-light tabular-nums" style={{ color: "#2C3E2D" }} aria-live="polite">
              {publicaciones.length}
            </p>
          </article>
          <article
            className="rounded-[24px] p-4 sm:p-5"
            style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
          >
            <p className="text-xs" style={{ color: "#6b6b60" }}>Publicaciones eliminadas</p>
            <p className="mt-1 text-2xl font-light tabular-nums" style={{ color: "#2C3E2D" }} aria-live="polite">
              {historial.length}
            </p>
          </article>
        </section>

        <section
          aria-label="Filtros de publicaciones"
          className="mb-6 grid grid-cols-1 gap-3 rounded-[24px] p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4"
          style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="buscar-publicacion" className="block text-xs font-medium" style={{ color: "#2C3E2D" }}>
              Buscar por nombre
            </label>
            <div className="mt-2 flex min-h-11 items-center gap-2 rounded-xl border px-3" style={{ borderColor: "#e8e4de", background: "#fff" }}>
              <Search size={16} aria-hidden="true" style={{ color: "#6b6b60" }} />
              <input
                id="buscar-publicacion"
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Nombre de la publicación"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="filtro-categoria" className="block text-xs font-medium" style={{ color: "#2C3E2D" }}>
              Filtrar por categoría
            </label>
            <select
              id="filtro-categoria"
              value={categoriaSeleccionada}
              onChange={(event) => setCategoriaSeleccionada(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E2D]"
              style={{ borderColor: "#e8e4de", background: "#fff", color: "#2C3E2D" }}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-vendedora" className="block text-xs font-medium" style={{ color: "#2C3E2D" }}>
              Filtrar por usuaria
            </label>
            <select
              id="filtro-vendedora"
              value={vendedoraSeleccionada}
              onChange={(event) => setVendedoraSeleccionada(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E2D]"
              style={{ borderColor: "#e8e4de", background: "#fff", color: "#2C3E2D" }}
            >
              <option value="">Todas las usuarias</option>
              {vendedoras.map((vendedora) => (
                <option key={vendedora} value={vendedora}>{vendedora}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              ref={botonHistorialRef}
              type="button"
              onClick={() => setHistorialAbierto((abierto) => !abierto)}
              aria-expanded={historialAbierto}
              aria-controls="historial-decisiones"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition hover:bg-[#A8C5A0]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
              style={{ borderColor: "#d8d3ca", color: "#2C3E2D" }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Historial de decisiones ({historial.length})
            </button>
          </div>
          <p className="text-sm sm:col-span-2 lg:col-span-4" style={{ color: "#6b6b60" }} aria-live="polite">
            {publicacionesFiltradas.length} {publicacionesFiltradas.length === 1 ? "publicación activa" : "publicaciones activas"}
          </p>
        </section>

        <section
          id="historial-decisiones"
          aria-label="Historial de decisiones"
          hidden={!historialAbierto}
          className="mb-6 rounded-[24px] p-4 sm:p-5"
          style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
        >
          <h2 className="text-lg font-medium" style={{ color: "#2C3E2D" }}>
            Historial de decisiones
          </h2>
          {historial.length === 0 ? (
            <p className="mt-2 text-sm" style={{ color: "#6b6b60" }}>
              Todavía no hay publicaciones eliminadas.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {historial.map((eliminacion, indice) => (
                <li
                  key={`${eliminacion.publicacion.id}-${eliminacion.fechaEliminacion}-${indice}`}
                  className="rounded-2xl border p-3 sm:p-4"
                  style={{ borderColor: "#e8e4de", background: "#fff" }}
                >
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                    <h3 className="font-medium" style={{ color: "#2C3E2D" }}>
                      {eliminacion.publicacion.titulo}
                    </h3>
                    <p className="text-xs" style={{ color: "#6b6b60" }}>
                      Eliminada · {new Date(eliminacion.fechaEliminacion).toLocaleString("es-AR")}
                    </p>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: "#3d3d35" }}>
                    <span className="font-medium">Motivo:</span> {eliminacion.motivo}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "#6b6b60" }}>
                    {eliminacion.explicacion}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: "#6b6b60" }}>
                    Publicó {eliminacion.publicacion.vendedora} · {eliminacion.publicacion.categoria}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {publicacionesFiltradas.length === 0 ? (
          <div
            className="rounded-[24px] px-5 py-14 text-center"
            style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgba(168,197,160,0.25)", color: "#2C3E2D" }}
            >
              <Shirt size={26} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-light" style={{ color: "#2C3E2D" }}>
              No hay publicaciones con estos filtros
            </h2>
            <p className="mt-1 text-sm" style={{ color: "#9a9a8e" }}>
              Probá con otro nombre, categoría o usuaria.
            </p>
          </div>
        ) : (
          <section aria-label="Publicaciones activas" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {publicacionesFiltradas.map((publicacion) => (
              <article
                key={publicacion.id}
                className="overflow-hidden rounded-[24px]"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
              >
                <div
                  className="relative flex h-56 items-center justify-center overflow-hidden sm:h-64"
                  style={{ background: "linear-gradient(135deg,#eaf4eb,#f4ede2)" }}
                >
                  {publicacion.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={publicacion.imagen} alt={publicacion.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <Shirt size={36} aria-hidden="true" style={{ color: "#6b9366" }} />
                  )}
                  <span
                    className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.08em]"
                    style={{ background: "rgba(168,197,160,0.92)", color: "#2C3E2D" }}
                  >
                    ACTIVA
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-light" style={{ color: "#1a1a1a" }}>
                        {publicacion.titulo}
                      </h2>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.13em]" style={{ color: "#9a9a8e" }}>
                        {publicacion.categoria}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium" style={{ color: "#2C3E2D" }}>
                      ${publicacion.precio.toLocaleString("es-AR")}
                    </p>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-5" style={{ color: "#6b6b60" }}>
                    {publicacion.descripcion}
                  </p>
                  <p className="mt-3 text-sm" style={{ color: "#3d3d35" }}>
                    Publicó <span className="font-medium">{publicacion.vendedora}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {publicacion.etiquetas.map((etiqueta) => (
                      <span
                        key={etiqueta}
                        className="rounded-full px-2 py-1 text-[10px]"
                        style={{ background: "#f4ede2", color: "#6b6b60" }}
                      >
                        #{etiqueta}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => abrirModal(publicacion, event.currentTarget)}
                    aria-label={`Eliminar publicación ${publicacion.titulo}`}
                    className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition hover:bg-[#fff1d6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
                    style={{ borderColor: "#c99254", color: "#75450f" }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {publicacionSeleccionada && (
        <ModalMotivoPrenda
          publicacion={publicacionSeleccionada}
          onClose={cerrarModal}
          onConfirm={confirmarEliminacion}
        />
      )}
    </main>
  );
}
