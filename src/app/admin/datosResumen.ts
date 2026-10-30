// Datos temporales para reemplazar por la API real cuando exista.
export const resumenAdmin = [
  { id: "usuarias", titulo: "Usuarias registradas", valor: 1284, detalle: "En la comunidad" },
  { id: "activas", titulo: "Publicaciones activas", valor: 7, detalle: "En el marketplace" },
  { id: "reportes", titulo: "Reportes sin resolver", valor: 6, detalle: "Necesitan atención" },
  { id: "eliminadas", titulo: "Publicaciones eliminadas", valor: 1, detalle: "En el historial local" },
] as const;

export const actividadReciente = [
  {
    id: "actividad-1",
    tipo: "prenda",
    texto: "Nueva publicación de María en el marketplace",
    tiempo: "Hace 8 min",
  },
  {
    id: "actividad-2",
    tipo: "reporte",
    texto: "Reporte resuelto",
    tiempo: "Hace 35 min",
  },
  {
    id: "actividad-3",
    tipo: "usuaria",
    texto: "Nueva usuaria se unió a ECloset",
    tiempo: "Hace 2 h",
  },
  {
    id: "actividad-4",
    tipo: "prenda",
    texto: "Publicación eliminada del marketplace",
    tiempo: "Hace 3 h",
  },
] as const;
