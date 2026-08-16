export type Prenda = {
  id: string;
  nombre?: string | null;
  urlImagen: string;
  categoria: string;
  color?: string | null;
  talle?: string | null;
  etiquetas?: string | null; // JSON string
  descripcion?: string | null;
  usuarioId: string;
};
