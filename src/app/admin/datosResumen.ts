// Datos temporales para reemplazar por la API real cuando exista.
export const resumenAdmin = [
  { id: "usuarias", titulo: "Usuarias registradas", valor: 1284, detalle: "En la comunidad" },
  { id: "pendientes", titulo: "Prendas pendientes", valor: 18, detalle: "Para revisar" },
  { id: "reportes", titulo: "Reportes sin resolver", valor: 6, detalle: "Necesitan atención" },
  { id: "aprobadas", titulo: "Prendas aprobadas", valor: 42, detalle: "Esta semana" },
] as const;

export const actividadReciente = [
  {
    id: "actividad-1",
    tipo: "prenda",
    texto: "Nueva prenda pendiente de María",
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
    texto: "Prenda aprobada para publicación",
    tiempo: "Hace 3 h",
  },
] as const;
