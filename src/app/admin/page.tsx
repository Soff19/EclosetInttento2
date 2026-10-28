"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Shirt,
  ShieldCheck,
  UsersRound,
  UserRoundPlus,
} from "lucide-react";
import { actividadReciente, resumenAdmin } from "./datosResumen";

const iconosResumen = {
  usuarias: UsersRound,
  pendientes: Shirt,
  reportes: ClipboardList,
  aprobadas: CheckCircle2,
} as const;

const accesos = [
  {
    href: "/admin/usuarios",
    titulo: "Gestionar usuarios",
    descripcion: "Revisá las cuentas y acompañá a la comunidad.",
    Icono: UsersRound,
    fondo: "rgba(168,197,160,0.28)",
  },
  {
    href: "/admin/prendas",
    titulo: "Moderación de prendas",
    descripcion: "Revisá las prendas compartidas antes de publicarlas.",
    Icono: Shirt,
    fondo: "rgba(201,169,110,0.2)",
  },
  {
    href: "/admin/reportes",
    titulo: "Reportes",
    descripcion: "Consultá los informes y atendé los reportes.",
    Icono: ClipboardList,
    fondo: "rgba(168,197,160,0.28)",
  },
] as const;

const iconosActividad = {
  prenda: Shirt,
  reporte: ShieldCheck,
  usuaria: UserRoundPlus,
} as const;

export default function AdminDashboard() {
  const [contadores, setContadores] = useState<number[]>(() => resumenAdmin.map(() => 0));

  useEffect(() => {
    const duracion = 900;
    let frameId = 0;
    let inicio: number | null = null;

    function animarContadores(marcaTiempo: number) {
      if (inicio === null) inicio = marcaTiempo;
      const progreso = Math.min((marcaTiempo - inicio) / duracion, 1);
      const suavizado = 1 - (1 - progreso) ** 3;

      setContadores(resumenAdmin.map(({ valor }) => Math.round(valor * suavizado)));

      if (progreso < 1) {
        frameId = window.requestAnimationFrame(animarContadores);
      }
    }

    frameId = window.requestAnimationFrame(animarContadores);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-7 sm:px-6 sm:py-10 lg:px-8" style={{ background: "#F9F5F0" }}>
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: "#A8C5A0" }} />
      <div className="pointer-events-none absolute -right-20 top-80 h-72 w-72 rounded-full opacity-15 blur-3xl" style={{ background: "#C9A96E" }} />

      <div className="relative mx-auto max-w-7xl">
        <header className="dashboard-enter mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>
              ECloset · Administración
            </p>
            <h1 className="mt-1 text-3xl font-light tracking-[-0.03em] sm:text-4xl" style={{ color: "#2C3E2D" }}>
              Hola, admin <span aria-hidden="true">✨</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: "#6b6b60" }}>
              Este es el resumen de lo que está pasando en tu comunidad.
            </p>
          </div>
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs"
            style={{ background: "rgba(168,197,160,0.25)", color: "#2C3E2D" }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: "#6b9366" }} />
            Panel de administración
          </div>
        </header>

        <section aria-label="Resumen de actividad" className="mb-9 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {resumenAdmin.map((dato, index) => {
            const Icono = iconosResumen[dato.id];
            return (
              <article
                key={dato.id}
                className="dashboard-enter rounded-[24px] p-4 sm:p-5"
                style={{
                  animationDelay: `${index * 100}ms`,
                  background: "rgba(255,255,255,0.84)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs leading-5" style={{ color: "#6b6b60" }}>{dato.titulo}</p>
                    <p className="mt-2 text-3xl font-light tabular-nums tracking-tight" style={{ color: "#2C3E2D" }} aria-label={`${dato.valor}`}>
                      {contadores[index].toLocaleString("es-AR")}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: "#9a9a8e" }}>{dato.detalle}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: "rgba(168,197,160,0.25)", color: "#2C3E2D" }}>
                    <Icono size={19} aria-hidden="true" />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mb-9">
          <div className="dashboard-enter mb-4 flex items-end justify-between gap-3" style={{ animationDelay: "400ms" }}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>Accesos rápidos</p>
              <h2 className="mt-1 text-xl font-light" style={{ color: "#2C3E2D" }}>¿Qué necesitás hacer?</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {accesos.map(({ href, titulo, descripcion, Icono, fondo }, index) => (
              <Link
                key={href}
                href={href}
                className="dashboard-enter group rounded-[24px] border border-white/70 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2C3E2D] sm:p-6"
                style={{
                  animationDelay: `${450 + index * 100}ms`,
                  background: "rgba(255,255,255,0.86)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: fondo, color: "#2C3E2D" }}>
                    <Icono size={22} aria-hidden="true" />
                  </span>
                  <ArrowRight
                    size={19}
                    aria-hidden="true"
                    className="mt-1 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: "#2C3E2D" }}
                  />
                </div>
                <h3 className="mt-5 text-lg font-medium" style={{ color: "#2C3E2D" }}>{titulo}</h3>
                <p className="mt-1 text-sm leading-6" style={{ color: "#6b6b60" }}>{descripcion}</p>
                <span className="sr-only">Ir a {titulo}</span>
              </Link>
            ))}
          </div>
        </section>

        <section
          className="dashboard-enter rounded-[24px] p-5 sm:p-6"
          style={{ animationDelay: "800ms", background: "rgba(255,255,255,0.84)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
          aria-labelledby="actividad-titulo"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>Al día</p>
              <h2 id="actividad-titulo" className="mt-1 text-xl font-light" style={{ color: "#2C3E2D" }}>
                Actividad reciente
              </h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(168,197,160,0.25)", color: "#2C3E2D" }}>
              <Clock3 size={18} aria-hidden="true" />
            </span>
          </div>
          <ul className="divide-y" style={{ borderColor: "#eee9e1" }}>
            {actividadReciente.map((actividad) => {
              const Icono = iconosActividad[actividad.tipo];
              return (
                <li key={actividad.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(168,197,160,0.22)", color: "#2C3E2D" }}>
                    <Icono size={16} aria-hidden="true" />
                  </span>
                  <p className="min-w-0 flex-1 text-sm" style={{ color: "#3d3d35" }}>{actividad.texto}</p>
                  <span className="shrink-0 text-[11px]" style={{ color: "#88877d" }}>{actividad.tiempo}</span>
                  <ArrowDownRight className="hidden text-[#9a9a8e] sm:block" size={15} aria-hidden="true" />
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <style jsx>{`
        .dashboard-enter {
          opacity: 0;
          animation: aparecer 550ms ease-out forwards;
        }

        @keyframes aparecer {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-enter {
            opacity: 1;
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
