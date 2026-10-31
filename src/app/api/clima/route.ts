import { NextRequest, NextResponse } from "next/server";
import type { CondicionClima, DatosClima } from "@/types/clima";

const CABECERAS_CACHE = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
};

function respuestaError(mensaje: string, estado: number) {
  return NextResponse.json({ error: mensaje }, { status: estado });
}

function simplificarCondicion(main: string): CondicionClima {
  const condicion = main.toLowerCase();
  if (condicion.includes("thunder")) return "tormenta";
  if (condicion.includes("rain") || condicion.includes("drizzle")) return "lluvia";
  if (condicion.includes("snow")) return "nieve";
  if (
    ["mist", "smoke", "haze", "dust", "fog", "sand", "ash", "squall", "tornado"]
      .some((tipo) => condicion.includes(tipo))
  ) {
    return "niebla";
  }
  if (condicion.includes("clear")) return "soleado";
  return "nublado";
}

export async function GET(request: NextRequest) {
  const latitudTexto = request.nextUrl.searchParams.get("lat");
  const longitudTexto = request.nextUrl.searchParams.get("lon");
  const latitud = latitudTexto === null ? Number.NaN : Number(latitudTexto);
  const longitud = longitudTexto === null ? Number.NaN : Number(longitudTexto);

  if (
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud) ||
    latitud < -90 ||
    latitud > 90 ||
    longitud < -180 ||
    longitud > 180
  ) {
    return respuestaError("La ubicación enviada no es válida.", 400);
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return respuestaError(
      "El servicio del clima todavía no está configurado. Probá más tarde.",
      503,
    );
  }

  const parametros = new URLSearchParams({
    lat: String(latitud),
    lon: String(longitud),
    appid: apiKey,
    units: "metric",
    lang: "es",
  });
  const baseUrl = "https://api.openweathermap.org/data/2.5";

  try {
    const [climaResponse, pronosticoResponse] = await Promise.all([
      fetch(`${baseUrl}/weather?${parametros}`, { next: { revalidate: 600 } }),
      fetch(`${baseUrl}/forecast?${parametros}`, { next: { revalidate: 600 } }),
    ]);

    const respuestasClima = [climaResponse, pronosticoResponse];
    if (respuestasClima.some((response) => response.status === 401)) {
      return respuestaError(
        "La clave del servicio del clima no está activa o no es válida.",
        502,
      );
    }
    if (respuestasClima.some((response) => response.status === 429)) {
      return respuestaError(
        "El servicio del clima alcanzó su límite de consultas. Intentá de nuevo más tarde.",
        429,
      );
    }
    if (respuestasClima.some((response) => !response.ok)) {
      return respuestaError(
        "No pudimos obtener el clima en este momento. Intentá más tarde.",
        502,
      );
    }

    const [actual, pronostico] = await Promise.all([
      climaResponse.json(),
      pronosticoResponse.json(),
    ]);
    const condicionActual = actual.weather?.[0];
    if (!condicionActual || typeof actual.main?.temp !== "number") {
      return respuestaError(
        "El servicio del clima devolvió datos incompletos. Intentá más tarde.",
        502,
      );
    }

    const probabilidades = Array.isArray(pronostico.list)
      ? pronostico.list.slice(0, 3).map((intervalo: { pop?: number }) =>
          typeof intervalo.pop === "number" ? intervalo.pop : 0,
        )
      : [];
    const datos: DatosClima = {
      ciudad: typeof actual.name === "string" && actual.name ? actual.name : "Tu ubicación",
      temperatura: Math.round(actual.main.temp),
      sensacionTermica: Math.round(actual.main.feels_like ?? actual.main.temp),
      humedad: actual.main.humidity,
      vientoKmh: Math.round((actual.wind?.speed ?? 0) * 3.6),
      probabilidadLluvia: Math.round(
        Math.max(0, ...probabilidades) * 100,
      ),
      descripcion: condicionActual.description,
      condicion: simplificarCondicion(condicionActual.main ?? ""),
    };

    return NextResponse.json(datos, { headers: CABECERAS_CACHE });
  } catch {
    return respuestaError(
      "No pudimos conectarnos al servicio del clima. Revisá tu conexión e intentá de nuevo.",
      502,
    );
  }
}
