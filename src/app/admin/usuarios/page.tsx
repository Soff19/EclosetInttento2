"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Eye,
  Search,
  Shield,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";
import {
  usuariasEjemplo,
  type EstadoUsuaria,
  type RolUsuaria,
  type UsuariaAdmin,
} from "./datosEjemplo";

type FiltroEstado = "TODOS" | EstadoUsuaria;
type FiltroRol = "TODOS" | RolUsuaria;

const estiloEstado: Record<EstadoUsuaria, { background: string; color: string }> = {
  ACTIVA: { background: "rgba(168,197,160,0.3)", color: "#2C3E2D" },
  SUSPENDIDA: { background: "rgba(184,85,85,0.14)", color: "#8f3535" },
};

const estiloRol: Record<RolUsuaria, { background: string; color: string }> = {
  ADMIN: { background: "rgba(201,169,110,0.22)", color: "#70551f" },
  USUARIA: { background: "rgba(107,107,96,0.12)", color: "#55564d" },
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toLocaleUpperCase("es-AR"))
    .join("");
}

function confirmarCambio(usuaria: UsuariaAdmin, accion: "estado" | "rol") {
  if (accion === "estado") {
    const nuevoEstado = usuaria.estado === "ACTIVA" ? "suspender" : "reactivar";
    return window.confirm(`¿Querés ${nuevoEstado} a ${usuaria.nombre}?`);
  }
  const nuevoRol = usuaria.rol === "ADMIN" ? "usuaria" : "administradora";
  return window.confirm(`¿Querés cambiar el rol de ${usuaria.nombre} a ${nuevoRol}?`);
}

function DetalleUsuaria({
  usuaria,
  onCerrar,
}: {
  usuaria: UsuariaAdmin;
  onCerrar: () => void;
}) {
  useEffect(() => {
    function manejarEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCerrar();
    }

    window.addEventListener("keydown", manejarEscape);
    return () => window.removeEventListener("keydown", manejarEscape);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="w-full max-w-lg rounded-t-[24px] p-5 shadow-2xl sm:rounded-[24px] sm:p-7"
        style={{ background: "#F9F5F0" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-medium"
              style={{ background: "rgba(168,197,160,0.35)", color: "#2C3E2D" }}
              aria-hidden="true"
            >
              {iniciales(usuaria.nombre)}
            </span>
            <div className="min-w-0">
              <h2 id="detalle-titulo" className="text-xl font-light" style={{ color: "#2C3E2D" }}>
                {usuaria.nombre}
              </h2>
              <p className="break-all text-sm" style={{ color: "#6b6b60" }}>{usuaria.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalle de usuaria"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
            style={{ color: "#2C3E2D" }}
          >
            <X size={20} />
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 rounded-2xl p-4 sm:grid-cols-2" style={{ background: "rgba(255,255,255,0.8)" }}>
          <div>
            <dt className="text-xs" style={{ color: "#77776d" }}>Rol</dt>
            <dd className="mt-1 text-sm font-medium" style={{ color: "#2C3E2D" }}>
              {usuaria.rol === "ADMIN" ? "Administradora" : "Usuaria"}
            </dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: "#77776d" }}>Estado</dt>
            <dd className="mt-1">
              <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={estiloEstado[usuaria.estado]}>
                {usuaria.estado === "ACTIVA" ? "Activa" : "Suspendida"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: "#77776d" }}>Fecha de registro</dt>
            <dd className="mt-1 text-sm" style={{ color: "#3d3d35" }}>{formatearFecha(usuaria.fechaCreacion)}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: "#77776d" }}>Perfil</dt>
            <dd className="mt-1 text-sm" style={{ color: "#3d3d35" }}>
              {usuaria.perfilCompletado ? "Completado" : "Pendiente"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs" style={{ color: "#77776d" }}>Identificador</dt>
            <dd className="mt-1 break-all text-sm" style={{ color: "#3d3d35" }}>{usuaria.id}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs" style={{ color: "#77776d" }}>
          Los cambios de esta pantalla son demostrativos y no se guardan.
        </p>
      </section>
    </div>
  );
}

export default function AdminUsuariosPage() {
  const [usuarias, setUsuarias] = useState(usuariasEjemplo);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("TODOS");
  const [detalle, setDetalle] = useState<UsuariaAdmin | null>(null);

  const totalActivas = usuarias.filter((usuaria) => usuaria.estado === "ACTIVA").length;
  const totalSuspendidas = usuarias.filter((usuaria) => usuaria.estado === "SUSPENDIDA").length;
  const termino = busqueda.trim().toLocaleLowerCase("es-AR");
  const usuariasFiltradas = usuarias.filter((usuaria) => {
    const coincideBusqueda =
      usuaria.nombre.toLocaleLowerCase("es-AR").includes(termino) ||
      usuaria.email.toLocaleLowerCase("es-AR").includes(termino);
    const coincideEstado = filtroEstado === "TODOS" || usuaria.estado === filtroEstado;
    const coincideRol = filtroRol === "TODOS" || usuaria.rol === filtroRol;
    return coincideBusqueda && coincideEstado && coincideRol;
  });

  function actualizarUsuaria(id: string, cambios: Partial<UsuariaAdmin>) {
    setUsuarias((actuales) =>
      actuales.map((usuaria) => (usuaria.id === id ? { ...usuaria, ...cambios } : usuaria)),
    );
    setDetalle((actual) => (actual?.id === id ? { ...actual, ...cambios } : actual));
  }

  function alternarEstado(usuaria: UsuariaAdmin) {
    if (!confirmarCambio(usuaria, "estado")) return;
    actualizarUsuaria(usuaria.id, {
      estado: usuaria.estado === "ACTIVA" ? "SUSPENDIDA" : "ACTIVA",
    });
  }

  function alternarRol(usuaria: UsuariaAdmin) {
    if (!confirmarCambio(usuaria, "rol")) return;
    actualizarUsuaria(usuaria.id, {
      rol: usuaria.rol === "ADMIN" ? "USUARIA" : "ADMIN",
    });
  }

  const campoClase =
    "min-h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#2C3E2D]";
  const campoEstilo = { borderColor: "#e8e4de", background: "#fff", color: "#2C3E2D" };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: "#F9F5F0" }}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>
            Panel de administración
          </p>
          <h1 className="mt-1 text-3xl font-light tracking-[-0.02em] sm:text-4xl" style={{ color: "#2C3E2D" }}>
            Gestionar usuarias
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "#6b6b60" }}>
            Consultá perfiles y administrá su acceso y rol. Los cambios de esta vista son solo una demostración.
          </p>
        </header>

        <section aria-label="Resumen de usuarias" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { id: "total", label: "Total de usuarias", valor: usuarias.length, Icono: UserRound, color: "#2C3E2D" },
            { id: "activas", label: "Activas", valor: totalActivas, Icono: UserRoundCheck, color: "#2C3E2D" },
            { id: "suspendidas", label: "Suspendidas", valor: totalSuspendidas, Icono: UserRoundX, color: "#8f3535" },
          ].map(({ id, label, valor, Icono, color }) => (
            <article
              key={id}
              className="flex items-center justify-between rounded-[24px] p-4 sm:p-5"
              style={{ background: "rgba(255,255,255,0.84)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
            >
              <div>
                <p className="text-xs" style={{ color: "#6b6b60" }}>{label}</p>
                <p className="mt-1 text-2xl font-light tabular-nums" style={{ color }}>{valor}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(168,197,160,0.25)", color }}>
                <Icono size={19} aria-hidden="true" />
              </span>
            </article>
          ))}
        </section>

        <section
          aria-label="Buscar y filtrar usuarias"
          className="mb-6 grid grid-cols-1 gap-3 rounded-[24px] p-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_200px_200px] sm:p-5"
          style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
        >
          <div>
            <label htmlFor="buscar-usuarias" className="mb-2 block text-xs font-medium" style={{ color: "#2C3E2D" }}>
              Buscar por nombre o email
            </label>
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#77776d" }} aria-hidden="true" />
              <input
                id="buscar-usuarias"
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Ej. Alma o alma@example.com"
                className={`${campoClase} pl-10`}
                style={campoEstilo}
              />
            </div>
          </div>
          <div>
            <label htmlFor="filtro-estado-usuaria" className="mb-2 block text-xs font-medium" style={{ color: "#2C3E2D" }}>
              Estado
            </label>
            <select
              id="filtro-estado-usuaria"
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value as FiltroEstado)}
              className={campoClase}
              style={campoEstilo}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVA">Activas</option>
              <option value="SUSPENDIDA">Suspendidas</option>
            </select>
          </div>
          <div>
            <label htmlFor="filtro-rol-usuaria" className="mb-2 block text-xs font-medium" style={{ color: "#2C3E2D" }}>
              Rol
            </label>
            <select
              id="filtro-rol-usuaria"
              value={filtroRol}
              onChange={(event) => setFiltroRol(event.target.value as FiltroRol)}
              className={campoClase}
              style={campoEstilo}
            >
              <option value="TODOS">Todos los roles</option>
              <option value="ADMIN">Administradoras</option>
              <option value="USUARIA">Usuarias</option>
            </select>
          </div>
          <p className="text-xs sm:col-span-2 lg:col-span-3" style={{ color: "#77776d" }} aria-live="polite">
            {usuariasFiltradas.length} {usuariasFiltradas.length === 1 ? "resultado" : "resultados"}
          </p>
        </section>

        {usuariasFiltradas.length === 0 ? (
          <section
            className="rounded-[24px] px-5 py-14 text-center"
            style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(168,197,160,0.25)", color: "#2C3E2D" }}>
              <Search size={23} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-light" style={{ color: "#2C3E2D" }}>No encontramos usuarias</h2>
            <p className="mt-1 text-sm" style={{ color: "#6b6b60" }}>
              Probá cambiar la búsqueda o seleccionar otros filtros.
            </p>
          </section>
        ) : (
          <section
            aria-label="Lista de usuarias"
            className="overflow-hidden rounded-[24px]"
            style={{ background: "rgba(255,255,255,0.86)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
          >
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead style={{ background: "rgba(168,197,160,0.16)", color: "#55564d" }}>
                  <tr>
                    <th scope="col" className="px-5 py-4 font-medium">Usuaria</th>
                    <th scope="col" className="px-4 py-4 font-medium">Rol</th>
                    <th scope="col" className="px-4 py-4 font-medium">Estado</th>
                    <th scope="col" className="px-4 py-4 font-medium">Registro</th>
                    <th scope="col" className="px-5 py-4 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ color: "#3d3d35" }}>
                  {usuariasFiltradas.map((usuaria) => (
                    <tr key={usuaria.id} style={{ borderColor: "#eee9e1" }}>
                      <td className="px-5 py-4">
                        <div className="flex min-w-52 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-medium" style={{ background: "rgba(168,197,160,0.35)", color: "#2C3E2D" }} aria-hidden="true">
                            {iniciales(usuaria.nombre)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{usuaria.nombre}</p>
                            <p className="truncate text-xs" style={{ color: "#77776d" }}>{usuaria.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={estiloRol[usuaria.rol]}>
                          {usuaria.rol === "ADMIN" ? "Admin" : "Usuaria"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={estiloEstado[usuaria.estado]}>
                          {usuaria.estado === "ACTIVA" ? "Activa" : "Suspendida"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs" style={{ color: "#6b6b60" }}>
                        {formatearFecha(usuaria.fechaCreacion)}
                      </td>
                      <td className="px-5 py-4">
                        <AccionesUsuaria
                          usuaria={usuaria}
                          onDetalle={() => setDetalle(usuaria)}
                          onEstado={() => alternarEstado(usuaria)}
                          onRol={() => alternarRol(usuaria)}
                          compactas
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y lg:hidden" style={{ borderColor: "#eee9e1" }}>
              {usuariasFiltradas.map((usuaria) => (
                <li key={usuaria.id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-medium" style={{ background: "rgba(168,197,160,0.35)", color: "#2C3E2D" }} aria-hidden="true">
                      {iniciales(usuaria.nombre)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-medium" style={{ color: "#2C3E2D" }}>{usuaria.nombre}</h2>
                      <p className="break-all text-xs" style={{ color: "#6b6b60" }}>{usuaria.email}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={estiloRol[usuaria.rol]}>
                          {usuaria.rol === "ADMIN" ? "Admin" : "Usuaria"}
                        </span>
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={estiloEstado[usuaria.estado]}>
                          {usuaria.estado === "ACTIVA" ? "Activa" : "Suspendida"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs" style={{ color: "#77776d" }}>
                        Registro: {formatearFecha(usuaria.fechaCreacion)}
                      </p>
                    </div>
                  </div>
                  <AccionesUsuaria
                    usuaria={usuaria}
                    onDetalle={() => setDetalle(usuaria)}
                    onEstado={() => alternarEstado(usuaria)}
                    onRol={() => alternarRol(usuaria)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {detalle && <DetalleUsuaria usuaria={detalle} onCerrar={() => setDetalle(null)} />}
    </main>
  );
}

function AccionesUsuaria({
  usuaria,
  onDetalle,
  onEstado,
  onRol,
  compactas = false,
}: {
  usuaria: UsuariaAdmin;
  onDetalle: () => void;
  onEstado: () => void;
  onRol: () => void;
  compactas?: boolean;
}) {
  const botonClase =
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition hover:bg-[#A8C5A0]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]";

  return (
    <div className={`flex gap-2 ${compactas ? "justify-end" : "mt-4 flex-wrap"}`}>
      <button
        type="button"
        onClick={onDetalle}
        aria-label={`Ver detalle de ${usuaria.nombre}`}
        className={botonClase}
        style={{ borderColor: "#e8e4de", color: "#2C3E2D" }}
      >
        <Eye size={15} aria-hidden="true" />
        Ver detalle
      </button>
      <button
        type="button"
        onClick={onEstado}
        aria-label={`${usuaria.estado === "ACTIVA" ? "Suspender" : "Reactivar"} a ${usuaria.nombre}`}
        className={botonClase}
        style={{ borderColor: "#e8e4de", color: usuaria.estado === "ACTIVA" ? "#8f3535" : "#2C3E2D" }}
      >
        {usuaria.estado === "ACTIVA" ? <X size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
        {usuaria.estado === "ACTIVA" ? "Suspender" : "Reactivar"}
      </button>
      <button
        type="button"
        onClick={onRol}
        aria-label={`Cambiar rol de ${usuaria.nombre} a ${usuaria.rol === "ADMIN" ? "usuaria" : "administradora"}`}
        className={botonClase}
        style={{ borderColor: "#e8e4de", color: "#2C3E2D" }}
      >
        <Shield size={15} aria-hidden="true" />
        {usuaria.rol === "ADMIN" ? "Hacer usuaria" : "Hacer admin"}
      </button>
    </div>
  );
}
