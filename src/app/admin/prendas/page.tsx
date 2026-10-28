"use client";

import { useState } from "react";
import { Check, Shirt, Trash2, X } from "lucide-react";
import {
  prendasEjemplo,
  type EstadoPrenda,
  type PrendaModeracion,
} from "./datosEjemplo";

type FiltroEstado = "TODAS" | EstadoPrenda;

const estados: { value: FiltroEstado; label: string }[] = [
  { value: "TODAS", label: "Todos los estados" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "APROBADA", label: "Aprobadas" },
  { value: "RECHAZADA", label: "Rechazadas" },
];

const estilosEstado: Record<EstadoPrenda, { background: string; color: string }> = {
  PENDIENTE: { background: "rgba(201,169,110,0.2)", color: "#806329" },
  APROBADA: { background: "rgba(168,197,160,0.3)", color: "#2C3E2D" },
  RECHAZADA: { background: "rgba(184,85,85,0.12)", color: "#9b4141" },
};

function cambiarEstado(
  prendas: PrendaModeracion[],
  id: string,
  estado: EstadoPrenda,
): PrendaModeracion[] {
  return prendas.map((prenda) => (prenda.id === id ? { ...prenda, estado } : prenda));
}

export default function AdminPrendasPage() {
  const [prendas, setPrendas] = useState(prendasEjemplo);
  const [filtro, setFiltro] = useState<FiltroEstado>("TODAS");
  const prendasFiltradas = prendas.filter(
    (prenda) => filtro === "TODAS" || prenda.estado === filtro,
  );

  function eliminarPrenda(prenda: PrendaModeracion) {
    const confirmado = window.confirm(`¿Querés eliminar la prenda "${prenda.nombre}"?`);
    if (confirmado) {
      setPrendas((actuales) => actuales.filter((actual) => actual.id !== prenda.id));
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: "#F9F5F0" }}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>
            Panel de administración
          </p>
          <h1 className="mt-1 text-3xl font-light tracking-[-0.02em] sm:text-4xl" style={{ color: "#2C3E2D" }}>
            Moderación de Prendas
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "#6b6b60" }}>
            Revisá las prendas compartidas por la comunidad. Aprobá las que quieras publicar,
            rechazá las que no correspondan o eliminá las que no deban permanecer.
          </p>
        </header>

        <section
          className="mb-6 flex flex-col gap-3 rounded-[24px] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
        >
          <div>
            <label htmlFor="filtro-estado" className="block text-xs font-medium" style={{ color: "#2C3E2D" }}>
              Filtrar por estado
            </label>
            <select
              id="filtro-estado"
              value={filtro}
              onChange={(event) => setFiltro(event.target.value as FiltroEstado)}
              className="mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2 sm:w-64"
              style={{ borderColor: "#e8e4de", background: "#fff", color: "#2C3E2D" }}
            >
              {estados.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm" style={{ color: "#6b6b60" }} aria-live="polite">
            {prendasFiltradas.length} {prendasFiltradas.length === 1 ? "prenda" : "prendas"}
          </p>
        </section>

        {prendasFiltradas.length === 0 ? (
          <div
            className="rounded-[24px] px-5 py-14 text-center"
            style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgba(168,197,160,0.25)", color: "#2C3E2D" }}
            >
              <Shirt size={26} />
            </div>
            <h2 className="mt-4 text-lg font-light" style={{ color: "#2C3E2D" }}>
              No hay prendas con este filtro
            </h2>
            <p className="mt-1 text-sm" style={{ color: "#9a9a8e" }}>
              Probá con otro estado para ver más prendas.
            </p>
          </div>
        ) : (
          <section aria-label="Prendas para moderar" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {prendasFiltradas.map((prenda) => (
              <article
                key={prenda.id}
                className="overflow-hidden rounded-[24px]"
                style={{ background: "rgba(255,255,255,0.88)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
              >
                <div className="relative flex h-64 items-center justify-center overflow-hidden sm:h-72" style={{ background: "linear-gradient(135deg,#eaf4eb,#f4ede2)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prenda.urlImagen}
                    alt={prenda.nombre}
                    className="h-full w-full object-contain p-4"
                  />
                  <span
                    className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.08em]"
                    style={estilosEstado[prenda.estado]}
                  >
                    {prenda.estado}
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-light" style={{ color: "#1a1a1a" }}>
                        {prenda.nombre}
                      </h2>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.13em]" style={{ color: "#9a9a8e" }}>
                        {prenda.categoria}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div>
                      <dt className="text-[11px]" style={{ color: "#9a9a8e" }}>Color</dt>
                      <dd style={{ color: "#3d3d35" }}>{prenda.color}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px]" style={{ color: "#9a9a8e" }}>Talle</dt>
                      <dd style={{ color: "#3d3d35" }}>{prenda.talle}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11px]" style={{ color: "#9a9a8e" }}>Usuaria</dt>
                      <dd style={{ color: "#3d3d35" }}>{prenda.usuaria}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrendas((actuales) => cambiarEstado(actuales, prenda.id, "APROBADA"))}
                      aria-label={`Aprobar ${prenda.nombre}`}
                      className="flex min-h-11 items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ background: "#2C3E2D", color: "#F9F5F0" }}
                    >
                      <Check size={15} /> Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrendas((actuales) => cambiarEstado(actuales, prenda.id, "RECHAZADA"))}
                      aria-label={`Rechazar ${prenda.nombre}`}
                      className="flex min-h-11 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-medium transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ borderColor: "rgba(184,85,85,0.3)", color: "#9b4141" }}
                    >
                      <X size={15} /> Rechazar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarPrenda(prenda)}
                      aria-label={`Eliminar ${prenda.nombre}`}
                      className="flex min-h-11 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-medium transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ borderColor: "#e8e4de", color: "#6b6b60" }}
                    >
                      <Trash2 size={15} /> Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
