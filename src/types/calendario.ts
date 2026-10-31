export type TipoEventoCalendario = "evento" | "outfit" | "foto";

export interface EventoCalendario {
  id: string;
  fecha: string;
  tipo: TipoEventoCalendario;
  titulo: string | null;
  descripcion: string | null;
  urlImagen: string | null;
  outfitId: string | null;
  outfit: {
    id: string;
    nombre: string;
    categoria: string | null;
    descripcion: string | null;
    outfitPrendas: {
      prenda: {
        id: string;
        nombre: string | null;
        categoria: string;
        urlImagen: string;
      };
    }[];
  } | null;
}

export function fechaCalendarioLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}
