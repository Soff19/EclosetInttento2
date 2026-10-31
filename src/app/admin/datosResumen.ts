export const resumenAdmin = [
  { id: "usuarias", titulo: "Usuarias registradas", valor: 0, detalle: "En la comunidad" },
  { id: "activas", titulo: "Publicaciones activas", valor: 0, detalle: "En el marketplace" },
  { id: "solicitudes", titulo: "Solicitudes pendientes", valor: 0, detalle: "Necesitan atención" },
  { id: "eliminadas", titulo: "Publicaciones eliminadas", valor: 0, detalle: "En el historial" },
] as const;

export type ActividadAdmin = {
  id: string;
  tipo: "prenda" | "solicitud" | "usuaria";
  texto: string;
  tiempo: string;
};
