"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Shirt } from "lucide-react";
import {
  obtenerSugerenciasGenerales,
  recomendarPrenda,
} from "@/lib/recomendacionesClima";
import type { DatosClima } from "@/types/clima";
import type { Prenda } from "@/types/prenda";

type Outfit = {
  id: string;
  nombre: string;
  categoria?: string | null;
  descripcion?: string | null;
  outfitPrendas: { prenda: Prenda }[];
};

type Props = {
  clima: DatosClima | null;
  prendas: Prenda[];
  outfits: Outfit[];
  cargandoPrendas: boolean;
};

type Recomendacion =
  | {
      tipo: "prenda";
      id: string;
      titulo: string;
      categoria: string;
      razon: string;
      prenda: Prenda;
    }
  | {
      tipo: "outfit";
      id: string;
      titulo: string;
      categoria: string;
      razon: string;
      outfit: Outfit;
    };

export default function CarruselClima({
  clima,
  prendas,
  outfits,
  cargandoPrendas,
}: Props) {
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [movimientoReducido, setMovimientoReducido] = useState(true);

  const recomendaciones = useMemo<Recomendacion[]>(() => {
    if (!clima) return [];

    const prendasRecomendadas = prendas.flatMap((prenda) => {
      const razon = recomendarPrenda(prenda, clima);
      return razon
        ? [{
            tipo: "prenda" as const,
            id: prenda.id,
            titulo: prenda.nombre || prenda.categoria,
            categoria: prenda.categoria,
            razon,
            prenda,
          }]
        : [];
    });

    const outfitsRecomendados = outfits.flatMap((outfit) => {
      const razon = outfit.outfitPrendas
        .map(({ prenda }) => recomendarPrenda(prenda, clima))
        .find((motivo): motivo is string => Boolean(motivo));
      return razon
        ? [{
            tipo: "outfit" as const,
            id: outfit.id,
            titulo: outfit.nombre,
            categoria: outfit.categoria || "Outfit guardado",
            razon: `Este look incluye una prenda ideal para hoy. ${razon}`,
            outfit,
          }]
        : [];
    });

    return [...prendasRecomendadas, ...outfitsRecomendados].slice(0, 12);
  }, [clima, outfits, prendas]);

  const sugerenciasGenerales = useMemo(
    () => (clima ? obtenerSugerenciasGenerales(clima) : []),
    [clima],
  );
  const indiceActual = recomendaciones.length
    ? indiceActivo % recomendaciones.length
    : 0;
  const recomendacionActual = recomendaciones[indiceActual];

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const actualizarPreferencia = () => setMovimientoReducido(consulta.matches);
    actualizarPreferencia();
    consulta.addEventListener("change", actualizarPreferencia);
    return () => consulta.removeEventListener("change", actualizarPreferencia);
  }, []);

  useEffect(() => {
    if (pausado || movimientoReducido || recomendaciones.length < 2) return;
    const temporizador = window.setInterval(() => {
      setIndiceActivo((indice) => (indice + 1) % recomendaciones.length);
    }, 6500);
    return () => window.clearInterval(temporizador);
  }, [movimientoReducido, pausado, recomendaciones.length]);

  function mover(direccion: -1 | 1) {
    setIndiceActivo(
      (indice) => (indice + direccion + recomendaciones.length) % recomendaciones.length,
    );
  }

  function manejarTeclado(event: KeyboardEvent<HTMLElement>) {
    if (recomendaciones.length < 2) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      mover(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      mover(1);
    }
  }

  const tituloClima = clima
    ? `Para hoy: ${clima.temperatura} °C y ${
        clima.probabilidadLluvia >= 40 ? "lluvia probable" : clima.descripcion
      }`
    : "Recomendaciones para hoy";

  return (
    <section
      aria-label="Recomendaciones de outfit según el clima"
      className="flex min-w-0 flex-col rounded-[24px] p-4 sm:p-5"
      style={{ background: "rgba(255,255,255,0.82)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setPausado(false);
        }
      }}
      onKeyDown={manejarTeclado}
    >
      <div className="mb-4">
        <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
          Ideas de tu closet
        </p>
        <h2 className="mt-1 text-xl font-light" style={{ color: "#2C3E2D" }}>
          {tituloClima}
        </h2>
      </div>

      {cargandoPrendas || !clima ? (
        <p className="py-8 text-center text-sm" role="status" style={{ color: "#6b6b60" }}>
          {cargandoPrendas ? "Buscando prendas y outfits para vos..." : "Las recomendaciones aparecerán cuando cargue el clima."}
        </p>
      ) : recomendacionActual ? (
        <>
          <div className="min-w-0 flex-1">
            {recomendacionActual.tipo === "prenda" ? (
              <article
                className="mx-auto max-w-sm overflow-hidden rounded-[22px]"
                style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
              >
                <div
                  className="flex aspect-[4/5] max-h-[320px] items-center justify-center overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#eaf4eb,#f4ede2)" }}
                >
                  {recomendacionActual.prenda.urlImagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recomendacionActual.prenda.urlImagen}
                      alt={recomendacionActual.titulo}
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <span className="text-5xl" aria-hidden="true">👗</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate text-base font-light" style={{ color: "#1a1a1a" }}>
                    {recomendacionActual.titulo}
                  </h3>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: "#6b6b60" }}>
                    {recomendacionActual.categoria}
                  </p>
                  <p className="mt-3 text-sm leading-5" style={{ color: "#3d5c3e" }}>
                    {recomendacionActual.razon}
                  </p>
                </div>
              </article>
            ) : (
              <Link
                href={`/outfits?outfit=${encodeURIComponent(recomendacionActual.outfit.id)}`}
                className="mx-auto block max-w-sm overflow-hidden rounded-[22px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
                style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
                aria-label={`Ver outfit ${recomendacionActual.titulo}: ${recomendacionActual.razon}`}
              >
                <div
                  className={`mx-auto grid h-[260px] w-full max-w-[320px] gap-1 p-2 ${
                    recomendacionActual.outfit.outfitPrendas.length > 1
                      ? "grid-cols-2 grid-rows-2"
                      : "grid-cols-1"
                  }`}
                  style={{ background: "linear-gradient(135deg,#eaf4eb,#f4ede2)" }}
                >
                  {recomendacionActual.outfit.outfitPrendas.slice(0, 4).map(({ prenda }, indice) => (
                    <div key={`${prenda.id}-${indice}`} className="min-h-0 min-w-0 overflow-hidden rounded-xl bg-white/70">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prenda.urlImagen}
                        alt={prenda.nombre || prenda.categoria}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  ))}
                  {recomendacionActual.outfit.outfitPrendas.length === 0 && (
                    <div className="flex items-center justify-center"><Shirt size={36} color="#A8C5A0" /></div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate text-base font-light" style={{ color: "#1a1a1a" }}>
                    {recomendacionActual.titulo}
                  </h3>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: "#6b6b60" }}>
                    {recomendacionActual.categoria}
                  </p>
                  <p className="mt-3 text-sm leading-5" style={{ color: "#3d5c3e" }}>
                    {recomendacionActual.razon}
                  </p>
                </div>
              </Link>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => mover(-1)}
              disabled={recomendaciones.length < 2}
              aria-label="Recomendación anterior"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:bg-[#A8C5A0]/15 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
              style={{ borderColor: "#e8e4de", color: "#2C3E2D" }}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <div className="flex min-w-0 items-center justify-center gap-1.5" aria-label={`Recomendación ${indiceActual + 1} de ${recomendaciones.length}`}>
              {recomendaciones.map((recomendacion, indice) => (
                <button
                  key={`${recomendacion.tipo}-${recomendacion.id}`}
                  type="button"
                  onClick={() => setIndiceActivo(indice)}
                  aria-label={`Mostrar recomendación: ${recomendacion.titulo}`}
                  aria-current={indice === indiceActual ? "true" : undefined}
                  className="h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
                  style={{
                    width: indice === indiceActual ? 18 : 7,
                    background: indice === indiceActual ? "#2C3E2D" : "#d8d5ce",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => mover(1)}
              disabled={recomendaciones.length < 2}
              aria-label="Recomendación siguiente"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:bg-[#A8C5A0]/15 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
              style={{ borderColor: "#e8e4de", color: "#2C3E2D" }}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            Recomendación {indiceActual + 1} de {recomendaciones.length}: {recomendacionActual.titulo}
          </p>
        </>
      ) : (
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm leading-6" style={{ color: "#6b6b60" }}>
            No encontramos prendas de tu closet que coincidan con el clima de hoy.
          </p>
          <ul className="mt-3 space-y-2">
            {sugerenciasGenerales.map((sugerencia) => (
              <li key={sugerencia} className="text-sm leading-5" style={{ color: "#3d5c3e" }}>
                {sugerencia}
              </li>
            ))}
          </ul>
          <Link
            href="/prendas/nueva"
            className="mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-xl px-4 text-sm font-medium transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
            style={{ background: "#2C3E2D", color: "#F9F5F0" }}
          >
            Cargar prendas
          </Link>
        </div>
      )}
    </section>
  );
}
