import type { DatosClima } from "@/types/clima";
import type { Prenda } from "@/types/prenda";

export type MotivoRecomendacion = {
  prenda: Prenda;
  razon: string;
};

function textoPrenda(prenda: Prenda): string {
  let etiquetas: string[] = [];
  try {
    const parseadas: unknown = JSON.parse(prenda.etiquetas || "[]");
    if (Array.isArray(parseadas)) etiquetas = parseadas.map(String);
  } catch {
    etiquetas = prenda.etiquetas ? [prenda.etiquetas] : [];
  }

  return [
    prenda.nombre,
    prenda.categoria,
    prenda.descripcion,
    prenda.color,
    ...etiquetas,
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function recomendarPrenda(
  prenda: Prenda,
  clima: DatosClima,
): string | null {
  const texto = textoPrenda(prenda);

  if (clima.vientoKmh >= 30 && /suelto|liviano|falda|vestido/.test(texto)) {
    return null;
  }

  if (clima.probabilidadLluvia >= 40) {
    if (/impermeable|lluvia|bota|botin|calzado cerrado/.test(texto)) {
      return "Hay probabilidad de lluvia: esta prenda te ayuda a estar preparada.";
    }
    if (/calzado|campera|abrigo/.test(texto)) {
      return "Puede llover; combiná esta prenda con algo impermeable o calzado cerrado.";
    }
  }

  if (clima.temperatura < 12 && /abrigo|campera|buzo|sueter|sweater|bufanda/.test(texto)) {
    return "Hoy hace frío, abrigate con esto.";
  }

  if (
    clima.temperatura >= 12 &&
    clima.temperatura <= 20 &&
    /campera|abrigo|buzo|remera|pantalon|accesorio/.test(texto)
  ) {
    return "El clima está fresco: sumá una capa liviana.";
  }

  if (
    clima.temperatura > 25 &&
    /remera|vestido|falda|calzado|deportivo|ropa interior/.test(texto)
  ) {
    return "Hoy hace calor: elegí algo fresco y liviano.";
  }

  if (clima.vientoKmh >= 30 && /campera|abrigo|buzo|pantalon/.test(texto)) {
    return "Hay viento fuerte: esta prenda ayuda a cubrirte.";
  }

  return null;
}

export function obtenerSugerenciasGenerales(clima: DatosClima): string[] {
  const sugerencias: string[] = [];

  if (clima.temperatura < 12) {
    sugerencias.push("🧥 Hace frío: buscá un abrigo, una campera o una bufanda.");
  } else if (clima.temperatura <= 20) {
    sugerencias.push("🧶 Está fresco: probá con capas livianas y un buzo.");
  } else if (clima.temperatura > 25) {
    sugerencias.push("☀️ Hace calor: elegí ropa fresca y liviana.");
  }

  if (clima.probabilidadLluvia >= 40) {
    sugerencias.push("🌧️ Puede llover: llevá algo impermeable o elegí calzado cerrado.");
  }

  if (clima.vientoKmh >= 30) {
    sugerencias.push("💨 Hay viento fuerte: evitá las prendas muy sueltas.");
  }

  return sugerencias.length
    ? sugerencias
    : ["🌿 Elegí prendas cómodas y combiná capas según cómo te sientas hoy."];
}
