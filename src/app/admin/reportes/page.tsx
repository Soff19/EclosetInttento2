"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Heart,
  ShoppingBag,
  Shirt,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import {
  etiquetasPeriodo,
  informesEjemplo,
  type ActividadDestacada,
  type PeriodoInforme,
  type PuntoEvolucion,
} from "./datosEjemplo";

const indicadores = [
  { id: "usuariasNuevas", titulo: "Usuarias nuevas", Icono: UsersRound, variacion: "variacionUsuarias" },
  { id: "prendasSubidas", titulo: "Prendas subidas", Icono: Shirt, variacion: "variacionPrendas" },
  { id: "outfitsCreados", titulo: "Outfits creados", Icono: WandSparkles, variacion: "variacionOutfits" },
  { id: "comprasRealizadas", titulo: "Compras realizadas", Icono: ShoppingBag, variacion: "variacionCompras" },
] as const;

const opcionesPeriodo: { value: PeriodoInforme; label: string }[] = [
  { value: "7dias", label: "Últimos 7 días" },
  { value: "30dias", label: "Últimos 30 días" },
  { value: "3meses", label: "Últimos 3 meses" },
];

const formatoNumero = new Intl.NumberFormat("es-AR");

function GraficoEvolucion({ puntos }: { puntos: PuntoEvolucion[] }) {
  if (puntos.length === 0) {
    return <p className="py-12 text-center text-sm" style={{ color: "#6b6b60" }}>No hay datos de evolución para este período.</p>;
  }

  const ancho = 640;
  const alto = 230;
  const margenIzquierdo = 36;
  const margenDerecho = 16;
  const margenSuperior = 18;
  const margenInferior = 36;
  const anchoGrafico = ancho - margenIzquierdo - margenDerecho;
  const altoGrafico = alto - margenSuperior - margenInferior;
  const maximo = Math.max(1, ...puntos.flatMap((punto) => [punto.usuarias, punto.prendas]));
  const posicionX = (indice: number) =>
    margenIzquierdo + (puntos.length === 1 ? anchoGrafico / 2 : (indice / (puntos.length - 1)) * anchoGrafico);
  const posicionY = (valor: number) => margenSuperior + altoGrafico - (valor / maximo) * altoGrafico;
  const puntosLinea = (campo: "usuarias" | "prendas") =>
    puntos.map((punto, indice) => `${posicionX(indice)},${posicionY(punto[campo])}`).join(" ");

  return (
    <div>
      <p className="mb-2 text-xs leading-5" style={{ color: "#6b6b60" }}>
        Comparación por período: los valores están representados como puntos y líneas, con sus cantidades indicadas en la descripción.
      </p>
      <div className="w-full">
        <svg
          viewBox={`0 0 ${ancho} ${alto}`}
          role="img"
          aria-label={`Evolución de usuarias nuevas y prendas subidas: ${puntos.map((punto) => `${punto.etiqueta}, ${punto.usuarias} usuarias y ${punto.prendas} prendas`).join("; ")}`}
          className="h-auto w-full overflow-visible"
        >
          {[0, 1, 2, 3].map((linea) => {
            const y = margenSuperior + (altoGrafico / 3) * linea;
            return (
              <g key={linea}>
                <line x1={margenIzquierdo} x2={ancho - margenDerecho} y1={y} y2={y} stroke="#e8e4de" strokeDasharray="4 5" />
                <text x={margenIzquierdo - 8} y={y + 4} textAnchor="end" fill="#77776d" fontSize="10">
                  {Math.round(maximo * (1 - linea / 3))}
                </text>
              </g>
            );
          })}
          <polyline points={puntosLinea("usuarias")} fill="none" stroke="#2C3E2D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={puntosLinea("prendas")} fill="none" stroke="#82a77a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 5" />
          {puntos.map((punto, indice) => (
            <g key={punto.etiqueta}>
              <circle cx={posicionX(indice)} cy={posicionY(punto.usuarias)} r="4" fill="#2C3E2D" />
              <rect x={posicionX(indice) - 4} y={posicionY(punto.prendas) - 4} width="8" height="8" rx="1" fill="#82a77a" />
              <text x={posicionX(indice)} y={alto - 10} textAnchor="middle" fill="#6b6b60" fontSize="10">
                {punto.etiqueta}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-hidden="true">
        <span className="inline-flex items-center gap-2" style={{ color: "#2C3E2D" }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2C3E2D" }} />
          Usuarias nuevas (línea sólida, puntos)
        </span>
        <span className="inline-flex items-center gap-2" style={{ color: "#456540" }}>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#82a77a" }} />
          Prendas subidas (línea discontinua, cuadrados)
        </span>
      </div>
      <ul className="sr-only">
        {puntos.map((punto) => (
          <li key={punto.etiqueta}>
            {punto.etiqueta}: {punto.usuarias} usuarias nuevas y {punto.prendas} prendas subidas.
          </li>
        ))}
      </ul>
    </div>
  );
}

function csvCelda(valor: string | number) {
  return `"${String(valor).replaceAll('"', '""')}"`;
}

function descargarCSV(periodo: PeriodoInforme, actividades: ActividadDestacada[]) {
  const informe = informesEjemplo[periodo];
  const filas: (string | number)[][] = [
    ["Periodo", etiquetasPeriodo[periodo]],
    [],
    ["Indicador", "Valor", "Variacion respecto al periodo anterior (%)"],
    ...indicadores.map(({ id, titulo, variacion }) => [
      titulo,
      informe.indicadores[id],
      informe.indicadores[variacion],
    ]),
    [],
    ["Evolucion", "Usuarias nuevas", "Prendas subidas"],
    ...informe.evolucion.map((punto) => [punto.etiqueta, punto.usuarias, punto.prendas]),
    [],
    ["Categoria", "Prendas subidas", "Porcentaje"],
    ...informe.categorias.map((categoria) => [
      categoria.nombre,
      categoria.cantidad,
      `${categoria.porcentaje}%`,
    ]),
    [],
    ["Actividad destacada", "Tipo", "Categoria", "Favoritos"],
    ...actividades.map((actividad) => [
      actividad.nombre,
      actividad.tipo,
      actividad.categoria,
      actividad.favoritos,
    ]),
  ];

  const contenido = `\uFEFF${filas.map((fila) => fila.map(csvCelda).join(",")).join("\r\n")}`;
  const archivo = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `informe-ecloset-${periodo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminReportesPage() {
  const [periodo, setPeriodo] = useState<PeriodoInforme>("30dias");
  const informe = informesEjemplo[periodo];
  const tieneDatos =
    informe.evolucion.length > 0 ||
    informe.categorias.length > 0 ||
    informe.destacadas.length > 0 ||
    indicadores.some(({ id }) => informe.indicadores[id] > 0);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: "#F9F5F0" }}>
      <div className="mx-auto max-w-7xl">
        <header className="report-enter mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>
              Panel de administración
            </p>
            <h1 className="mt-1 text-3xl font-light tracking-[-0.02em] sm:text-4xl" style={{ color: "#2C3E2D" }}>
              Reportes y métricas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "#6b6b60" }}>
              Explorá la actividad de ECloset y descargá un resumen de los indicadores del período elegido.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label htmlFor="periodo-informe" className="mb-2 block text-xs font-medium" style={{ color: "#2C3E2D" }}>
                Período del informe
              </label>
              <select
                id="periodo-informe"
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value as PeriodoInforme)}
                className="min-h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#2C3E2D] sm:w-48"
                style={{ borderColor: "#e8e4de", background: "#fff", color: "#2C3E2D" }}
              >
                {opcionesPeriodo.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => descargarCSV(periodo, informe.destacadas)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
              style={{ background: "#2C3E2D", color: "#F9F5F0" }}
            >
              <Download size={17} aria-hidden="true" />
              Descargar informe (CSV)
            </button>
          </div>
        </header>

        {!tieneDatos ? (
          <section className="report-enter rounded-[24px] px-5 py-14 text-center" style={{ background: "rgba(255,255,255,0.84)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
            <h2 className="text-lg font-light" style={{ color: "#2C3E2D" }}>Todavía no hay datos para este período</h2>
            <p className="mt-1 text-sm" style={{ color: "#6b6b60" }}>Elegí otro rango para consultar la actividad disponible.</p>
          </section>
        ) : (
          <>
            <section aria-label={`Indicadores de ${etiquetasPeriodo[periodo]}`} className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {indicadores.map(({ id, titulo, Icono, variacion }, index) => {
                const cambio = informe.indicadores[variacion];
                const sube = cambio >= 0;
                return (
                  <article
                    key={id}
                    className="report-enter rounded-[24px] p-4 sm:p-5"
                    style={{ animationDelay: `${index * 80}ms`, background: "rgba(255,255,255,0.84)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs leading-5" style={{ color: "#6b6b60" }}>{titulo}</p>
                        <p className="mt-2 text-3xl font-light tabular-nums" style={{ color: "#2C3E2D" }}>
                          {formatoNumero.format(informe.indicadores[id])}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium" style={{ color: sube ? "#2C6B3F" : "#9b4141" }}>
                          {sube ? <ArrowUpRight size={15} aria-hidden="true" /> : <ArrowDownRight size={15} aria-hidden="true" />}
                          {sube ? "+" : ""}{cambio}% vs. período anterior
                          <span className="sr-only">{sube ? " aumentó" : " disminuyó"}</span>
                        </p>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: "rgba(168,197,160,0.25)", color: "#2C3E2D" }}>
                        <Icono size={19} aria-hidden="true" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.9fr)]">
              <section className="report-enter min-w-0 rounded-[24px] p-4 sm:p-5" style={{ animationDelay: "350ms", background: "rgba(255,255,255,0.84)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }} aria-labelledby="evolucion-titulo">
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>{etiquetasPeriodo[periodo]}</p>
                  <h2 id="evolucion-titulo" className="mt-1 text-lg font-light" style={{ color: "#2C3E2D" }}>Evolución de la actividad</h2>
                </div>
                <GraficoEvolucion puntos={informe.evolucion} />
              </section>

              <section className="report-enter rounded-[24px] p-4 sm:p-5" style={{ animationDelay: "430ms", background: "rgba(255,255,255,0.84)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }} aria-labelledby="categorias-titulo">
                <div className="mb-5">
                  <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>Prendas subidas</p>
                  <h2 id="categorias-titulo" className="mt-1 text-lg font-light" style={{ color: "#2C3E2D" }}>Categorías más populares</h2>
                </div>
                {informe.categorias.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: "#6b6b60" }}>No hay categorías para mostrar en este período.</p>
                ) : (
                  <ol className="space-y-4">
                    {informe.categorias.map((categoria) => (
                      <li key={categoria.nombre}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium" style={{ color: "#3d3d35" }}>{categoria.nombre}</span>
                          <span style={{ color: "#6b6b60" }}>{categoria.cantidad} prendas · {categoria.porcentaje}%</span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full"
                          role="img"
                          aria-label={`${categoria.nombre}: ${categoria.cantidad} prendas, ${categoria.porcentaje}%`}
                          style={{ background: "#e8e4de" }}
                        >
                          <div className="h-full rounded-full" style={{ width: `${Math.min(categoria.porcentaje, 100)}%`, background: "#82a77a" }} />
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <section className="report-enter overflow-hidden rounded-[24px]" style={{ animationDelay: "510ms", background: "rgba(255,255,255,0.86)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }} aria-labelledby="destacadas-titulo">
              <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#6b6b60" }}>Comunidad</p>
                  <h2 id="destacadas-titulo" className="mt-1 text-lg font-light" style={{ color: "#2C3E2D" }}>Actividad destacada</h2>
                </div>
                <Heart size={19} aria-hidden="true" style={{ color: "#8f5b5b" }} />
              </div>
              {informe.destacadas.length === 0 ? (
                <p className="px-5 pb-6 text-sm" style={{ color: "#6b6b60" }}>No hay actividad destacada para este período.</p>
              ) : (
                <>
                  <div className="hidden lg:block">
                    <table className="w-full text-left text-sm">
                      <thead style={{ background: "rgba(168,197,160,0.16)", color: "#55564d" }}>
                        <tr>
                          <th scope="col" className="px-5 py-3 font-medium">Elemento</th>
                          <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
                          <th scope="col" className="px-4 py-3 font-medium">Categoría</th>
                          <th scope="col" className="px-5 py-3 text-right font-medium">Favoritos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ color: "#3d3d35" }}>
                        {informe.destacadas.map((actividad) => (
                          <tr key={actividad.id} style={{ borderColor: "#eee9e1" }}>
                            <th scope="row" className="px-5 py-3 font-medium">{actividad.nombre}</th>
                            <td className="px-4 py-3">{actividad.tipo}</td>
                            <td className="px-4 py-3">{actividad.categoria}</td>
                            <td className="px-5 py-3 text-right font-medium">{formatoNumero.format(actividad.favoritos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="divide-y lg:hidden" style={{ borderColor: "#eee9e1" }}>
                    {informe.destacadas.map((actividad) => (
                      <li key={actividad.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium" style={{ color: "#2C3E2D" }}>{actividad.nombre}</p>
                          <p className="mt-1 text-xs" style={{ color: "#6b6b60" }}>{actividad.tipo} · {actividad.categoria}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium" style={{ color: "#705555" }}>
                          <Heart size={14} aria-hidden="true" /> {formatoNumero.format(actividad.favoritos)}
                          <span className="sr-only">favoritos</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .report-enter {
          opacity: 0;
          animation: aparecer 500ms ease-out forwards;
        }

        @keyframes aparecer {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .report-enter {
            opacity: 1;
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
