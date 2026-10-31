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
      className="flex h-full w-full min-w-0 flex-col rounded-2xl border border-[#E5E1D9] bg-white p-3 sm:p-4"
      style={{ boxShadow: "0 4px 18px rgba(11,73,61,0.04)" }}
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
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b6b60]">
          Ideas de tu closet
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-cormorant-garamond)] text-xl leading-tight text-[#0B493D]">
          {tituloClima}
        </h2>
      </div>

      {cargandoPrendas || !clima ? (
        <p className="py-5 text-center text-xs leading-5 text-[#55524C]" role="status">
          {cargandoPrendas ? "Buscando prendas y outfits para vos..." : "Las recomendaciones aparecerán cuando cargue el clima."}
        </p>
      ) : recomendacionActual ? (
        <>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            {recomendacionActual.tipo === "prenda" ? (
              <article
                className="mx-auto w-full max-w-[11rem] overflow-hidden rounded-xl border border-[#E5E1D9] bg-white md:flex md:max-w-none"
                style={{ boxShadow: "0 4px 16px rgba(11,73,61,0.05)" }}
              >
                <div
                  className="flex aspect-[4/5] max-h-[220px] items-center justify-center overflow-hidden md:aspect-auto md:min-h-[9rem] md:w-32 md:shrink-0"
                  style={{ background: "#F7F1E7" }}
                >
                  {recomendacionActual.prenda.urlImagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recomendacionActual.prenda.urlImagen}
                      alt={recomendacionActual.titulo}
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <Shirt size={40} className="text-[#6CAF7B]" aria-hidden="true" />
                  )}
                </div>
                <div className="p-3 md:flex md:min-w-0 md:flex-1 md:flex-col md:justify-center">
                  <h3 className="truncate text-base font-semibold text-[#333333]">
                    {recomendacionActual.titulo}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#6b6b60]">
                    {recomendacionActual.categoria}
                  </p>
                  <p className="mt-2 text-xs leading-4 text-[#0B493D]">
                    {recomendacionActual.razon}
                  </p>
                </div>
              </article>
            ) : (
              <Link
                href={`/outfits?outfit=${encodeURIComponent(recomendacionActual.outfit.id)}`}
                className="mx-auto block w-full max-w-[11rem] overflow-hidden rounded-xl border border-[#E5E1D9] bg-white transition duration-200 hover:border-[#A8BC99] hover:shadow-[0_8px_24px_rgba(11,73,61,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] md:flex md:max-w-none"
                style={{ boxShadow: "0 4px 16px rgba(11,73,61,0.05)" }}
                aria-label={`Ver outfit ${recomendacionActual.titulo}: ${recomendacionActual.razon}`}
              >
                <div
                  className={`mx-auto grid aspect-[4/5] w-full max-w-[11rem] gap-1 p-1 md:aspect-auto md:min-h-[9rem] md:w-32 md:shrink-0 ${
                    recomendacionActual.outfit.outfitPrendas.length > 1
                      ? "grid-cols-2 grid-rows-2"
                      : "grid-cols-1"
                  }`}
                  style={{ background: "#F7F1E7" }}
                >
                  {recomendacionActual.outfit.outfitPrendas.slice(0, 4).map(({ prenda }, indice) => (
                    <div key={`${prenda.id}-${indice}`} className="min-h-0 min-w-0 overflow-hidden rounded-lg border border-[#E5E1D9] bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prenda.urlImagen}
                        alt={prenda.nombre || prenda.categoria}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  ))}
                  {recomendacionActual.outfit.outfitPrendas.length === 0 && (
                    <div className="flex items-center justify-center"><Shirt size={36} color="#6CAF7B" /></div>
                  )}
                </div>
                <div className="p-3 md:flex md:min-w-0 md:flex-1 md:flex-col md:justify-center">
                  <h3 className="truncate text-base font-semibold text-[#333333]">
                    {recomendacionActual.titulo}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#6b6b60]">
                    {recomendacionActual.categoria}
                  </p>
                  <p className="mt-2 text-xs leading-4 text-[#0B493D]">
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E1D9] text-[#0B493D] transition hover:border-[#A8BC99] hover:bg-[#C6EFD6]/30 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
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
                  className="h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
                  style={{
                    width: indice === indiceActual ? 18 : 7,
                    background: indice === indiceActual ? "#0B493D" : "#C7C2B8",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => mover(1)}
              disabled={recomendaciones.length < 2}
              aria-label="Recomendación siguiente"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E1D9] text-[#0B493D] transition hover:border-[#A8BC99] hover:bg-[#C6EFD6]/30 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
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
          <p className="text-sm leading-6 text-[#55524C]">
            No encontramos prendas de tu closet que coincidan con el clima de hoy.
          </p>
          <ul className="mt-3 space-y-2">
            {sugerenciasGenerales.map((sugerencia) => (
              <li key={sugerencia} className="text-sm leading-5 text-[#0B493D]">
                {sugerencia}
              </li>
            ))}
          </ul>
          <Link
            href="/prendas/nueva"
            className="mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-xl border border-[#A8BC99] bg-[#A8BC99] px-4 text-sm font-bold text-[#0B493D] transition hover:border-[#93AA84] hover:bg-[#93AA84] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] active:scale-[0.98]"
          >
            Cargar prendas
          </Link>
        </div>
      )}
    </section>
  );
}
