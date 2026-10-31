"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  soleado: "☀️",
  nublado: "☁️",
  lluvia: "🌧️",
  tormenta: "⛈️",
  nieve: "❄️",
  niebla: "🌫️",
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

  return (
    <section
      aria-labelledby="clima-actual-titulo"
      className="rounded-[24px] p-5 sm:p-6"
      style={{
        background: "rgba(255,255,255,0.84)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
      }}
    >
      <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
        Tu día, al aire libre
      </p>
      <h2 id="clima-actual-titulo" className="mt-1 text-xl font-light" style={{ color: "#2C3E2D" }}>
        Clima actual
      </h2>

      {cargando ? (
        <div className="mt-4 animate-pulse space-y-3" aria-label="Cargando el clima">
          <div className="h-8 w-2/3 rounded-lg bg-[#A8C5A0]/30" />
          <div className="h-16 rounded-xl bg-[#A8C5A0]/20" />
          <div className="h-4 w-1/2 rounded bg-[#A8C5A0]/20" />
        </div>
      ) : error ? (
        <div className="mt-4" role="alert">
          <p className="text-sm leading-5" style={{ color: "#8b3838" }}>{error}</p>
          <button
            type="button"
            onClick={reintentar}
            className="mt-4 min-h-11 rounded-xl px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
            style={{ background: "#2C3E2D", color: "#F9F5F0" }}
          >
            Reintentar
          </button>
        </div>
      ) : clima ? (
        <>
          {avisoUbicacion && (
            <p className="mt-3 rounded-xl px-3 py-2 text-xs leading-5" role="status" style={{ background: "#f4ede2", color: "#5c4a2d" }}>
              {avisoUbicacion}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" style={{ color: "#2C3E2D" }}>
                {clima.ciudad}
              </p>
              <p className="mt-1 text-sm capitalize" style={{ color: "#6b6b60" }}>
                {clima.descripcion}
              </p>
            </div>
            <span className="shrink-0 text-4xl" aria-hidden="true">
              {iconosCondicion[clima.condicion]}
            </span>
          </div>
          <p className="mt-2 text-4xl font-light tabular-nums" style={{ color: "#2C3E2D" }}>
            {clima.temperatura} °C
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-xl p-3" style={{ background: "#F9F5F0" }}>
              <dt style={{ color: "#6b6b60" }}>Sensación térmica</dt>
              <dd className="mt-1 font-medium" style={{ color: "#2C3E2D" }}>{clima.sensacionTermica} °C</dd>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#F9F5F0" }}>
              <dt style={{ color: "#6b6b60" }}>Probabilidad de lluvia</dt>
              <dd className="mt-1 font-medium" style={{ color: "#2C3E2D" }}>{clima.probabilidadLluvia}%</dd>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#F9F5F0" }}>
              <dt style={{ color: "#6b6b60" }}>Viento</dt>
              <dd className="mt-1 font-medium" style={{ color: "#2C3E2D" }}>{clima.vientoKmh} km/h</dd>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#F9F5F0" }}>
              <dt style={{ color: "#6b6b60" }}>Humedad</dt>
              <dd className="mt-1 font-medium" style={{ color: "#2C3E2D" }}>{clima.humedad}%</dd>
            </div>
          </dl>
        </>
      ) : null}

      <p className="mt-4 text-[10px]" style={{ color: "#77766d" }}>
        Datos:{" "}
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
        >
          OpenWeatherMap
        </a>
      </p>
    </section>
  );
}
