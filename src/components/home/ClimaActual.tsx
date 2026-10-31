"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cloud, CloudFog, CloudLightning, CloudRain, Snowflake, Sun } from "lucide-react";
import type { DatosClima } from "@/types/clima";

type Props = {
  onWeatherChange: (clima: DatosClima | null) => void;
};

type Coordenadas = {
  latitud: number;
  longitud: number;
};

const COORDENADAS_BUENOS_AIRES: Coordenadas = {
  latitud: -34.6037,
  longitud: -58.3816,
};

const iconosCondicion = {
  soleado: Sun,
  nublado: Cloud,
  lluvia: CloudRain,
  tormenta: CloudLightning,
  nieve: Snowflake,
  niebla: CloudFog,
} as const;

export default function ClimaActual({ onWeatherChange }: Props) {
  const [clima, setClima] = useState<DatosClima | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [avisoUbicacion, setAvisoUbicacion] = useState("");
  const coordenadasRef = useRef<Coordenadas | null>(null);
  const ubicacionPredeterminadaRef = useRef(false);

  const cargarClima = useCallback(async () => {
    setCargando(true);
    setError("");
    setClima(null);
    onWeatherChange(null);

    let coordenadas = coordenadasRef.current;
    let usarBuenosAires = false;

    if (!coordenadas && typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const posicion = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 600000,
          });
        });
        coordenadas = {
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
        };
      } catch (errorUbicacion) {
        usarBuenosAires = true;
        const codigoError =
          typeof errorUbicacion === "object" &&
          errorUbicacion !== null &&
          "code" in errorUbicacion
            ? errorUbicacion.code
            : undefined;
        const denegado = codigoError === 1;
        setAvisoUbicacion(
          denegado
            ? "No diste permiso para compartir tu ubicación. Te mostramos el clima de Buenos Aires."
            : "No pudimos detectar tu ubicación. Te mostramos el clima de Buenos Aires.",
        );
      }
    } else if (!coordenadas) {
      usarBuenosAires = true;
      setAvisoUbicacion(
        "Tu navegador no permite detectar la ubicación. Te mostramos el clima de Buenos Aires.",
      );
    }

    if (usarBuenosAires) {
      coordenadas = COORDENADAS_BUENOS_AIRES;
      ubicacionPredeterminadaRef.current = true;
    } else if (coordenadas) {
      setAvisoUbicacion("");
      ubicacionPredeterminadaRef.current = false;
    }

    coordenadasRef.current = coordenadas;
    if (!coordenadas) {
      setError("No pudimos obtener una ubicación para consultar el clima.");
      setCargando(false);
      return;
    }

    try {
      const parametros = new URLSearchParams({
        lat: String(coordenadas.latitud),
        lon: String(coordenadas.longitud),
      });
      const respuesta = await fetch(`/api/clima?${parametros}`);
      const datos: DatosClima & { error?: string } = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error || "No pudimos cargar el clima. Intentá de nuevo.");
      }
      setClima(datos);
      onWeatherChange(datos);
    } catch (errorClima) {
      setError(
        errorClima instanceof Error
          ? errorClima.message
          : "No pudimos cargar el clima. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }, [onWeatherChange]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void cargarClima();
    }, 0);
    return () => window.clearTimeout(temporizador);
  }, [cargarClima]);

  function reintentar() {
    if (ubicacionPredeterminadaRef.current) {
      coordenadasRef.current = null;
    }
    void cargarClima();
  }

  const IconoCondicion = clima ? iconosCondicion[clima.condicion] : null;

  return (
    <section
      aria-labelledby="clima-actual-titulo"
      className="h-full w-full rounded-2xl border border-[#E5E1D9] bg-white p-3 sm:p-4"
      style={{
        boxShadow: "0 4px 18px rgba(11,73,61,0.04)",
      }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b6b60]">
        Tu día, al aire libre
      </p>
      <h2 id="clima-actual-titulo" className="mt-1 font-[family-name:var(--font-cormorant-garamond)] text-xl leading-tight text-[#0B493D]">
        Clima actual
      </h2>

      {cargando ? (
        <div className="mt-4 animate-pulse space-y-3" aria-label="Cargando el clima">
          <div className="h-8 w-2/3 rounded-lg bg-[#C6EFD6]" />
          <div className="h-16 rounded-xl bg-[#C6EFD6]/70" />
          <div className="h-4 w-1/2 rounded bg-[#C6EFD6]/70" />
        </div>
      ) : error ? (
        <div className="mt-4" role="alert">
          <p className="text-sm leading-5" style={{ color: "#8b3838" }}>{error}</p>
          <button
            type="button"
            onClick={reintentar}
            className="mt-4 min-h-11 rounded-xl border border-[#A8BC99] bg-[#A8BC99] px-4 text-sm font-bold text-[#0B493D] transition hover:border-[#93AA84] hover:bg-[#93AA84] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] active:scale-[0.98]"
          >
            Reintentar
          </button>
        </div>
      ) : clima ? (
        <>
          {avisoUbicacion && (
            <p className="mt-3 rounded-lg border border-[#E5E1D9] bg-[#F7F1E7] px-3 py-2 text-sm leading-5 text-[#55524C]" role="status">
              {avisoUbicacion}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#0B493D]">
                {clima.ciudad}
              </p>
              <p className="mt-1 text-xs capitalize text-[#6b6b60]">
                {clima.descripcion}
              </p>
            </div>
            {IconoCondicion && <IconoCondicion className="h-8 w-8 shrink-0 text-[#6CAF7B]" aria-hidden="true" />}
          </div>
          <p className="mt-2 font-[family-name:var(--font-cormorant-garamond)] text-3xl leading-none tabular-nums text-[#0B493D]">
            {clima.temperatura} °C
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs xl:grid-cols-4">
            <div className="rounded-lg border border-[#E5E1D9] bg-[#F7F1E7] p-2.5">
              <dt className="text-[#6b6b60]">Sensación térmica</dt>
              <dd className="mt-1 font-bold text-[#0B493D]">{clima.sensacionTermica} °C</dd>
            </div>
            <div className="rounded-lg border border-[#E5E1D9] bg-[#F7F1E7] p-2.5">
              <dt className="text-[#6b6b60]">Probabilidad de lluvia</dt>
              <dd className="mt-1 font-bold text-[#0B493D]">{clima.probabilidadLluvia}%</dd>
            </div>
            <div className="rounded-lg border border-[#E5E1D9] bg-[#F7F1E7] p-2.5">
              <dt className="text-[#6b6b60]">Viento</dt>
              <dd className="mt-1 font-bold text-[#0B493D]">{clima.vientoKmh} km/h</dd>
            </div>
            <div className="rounded-lg border border-[#E5E1D9] bg-[#F7F1E7] p-2.5">
              <dt className="text-[#6b6b60]">Humedad</dt>
              <dd className="mt-1 font-bold text-[#0B493D]">{clima.humedad}%</dd>
            </div>
          </dl>
        </>
      ) : null}

      <p className="mt-3 text-[11px] text-[#6b6b60]">
        Datos:{" "}
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
        >
          OpenWeatherMap
        </a>
      </p>
    </section>
  );
}
