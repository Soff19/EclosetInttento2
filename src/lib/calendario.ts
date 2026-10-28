export function parseFechaCalendario(fecha: unknown, hora?: unknown): Date | null {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  if (
    hora !== undefined &&
    hora !== null &&
    hora !== "" &&
    (typeof hora !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora))
  ) {
    return null;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const parsed = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    parsed.getUTCFullYear() !== anio ||
    parsed.getUTCMonth() !== mes - 1 ||
    parsed.getUTCDate() !== dia
  ) {
    return null;
  }

  if (typeof hora === "string" && hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    parsed.setUTCHours(horas, minutos);
  }
  return parsed;
}
