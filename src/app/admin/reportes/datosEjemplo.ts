// Datos temporales para reemplazar por la API real.
export type PeriodoInforme = "7dias" | "30dias" | "3meses";

export type PuntoEvolucion = {
  etiqueta: string;
  usuarias: number;
  prendas: number;
};

export type IndicadorInforme = {
  usuariasNuevas: number;
  variacionUsuarias: number;
  prendasSubidas: number;
  variacionPrendas: number;
  outfitsCreados: number;
  variacionOutfits: number;
  comprasRealizadas: number;
  variacionCompras: number;
};

export type CategoriaInforme = {
  nombre: string;
  cantidad: number;
  porcentaje: number;
};

export type ActividadDestacada = {
  id: string;
  nombre: string;
  tipo: "Prenda" | "Producto";
  categoria: string;
  favoritos: number;
};

export type InformeEjemplo = {
  indicadores: IndicadorInforme;
  evolucion: PuntoEvolucion[];
  categorias: CategoriaInforme[];
  destacadas: ActividadDestacada[];
};

export const informesEjemplo: Record<PeriodoInforme, InformeEjemplo> = {
  "7dias": {
    indicadores: {
      usuariasNuevas: 34,
      variacionUsuarias: 12,
      prendasSubidas: 86,
      variacionPrendas: 8,
      outfitsCreados: 51,
      variacionOutfits: -4,
      comprasRealizadas: 19,
      variacionCompras: 16,
    },
    evolucion: [
      { etiqueta: "Lun", usuarias: 3, prendas: 9 },
      { etiqueta: "Mar", usuarias: 6, prendas: 14 },
      { etiqueta: "Mié", usuarias: 4, prendas: 11 },
      { etiqueta: "Jue", usuarias: 7, prendas: 16 },
      { etiqueta: "Vie", usuarias: 5, prendas: 13 },
      { etiqueta: "Sáb", usuarias: 4, prendas: 12 },
      { etiqueta: "Dom", usuarias: 5, prendas: 11 },
    ],
    categorias: [
      { nombre: "Remeras", cantidad: 28, porcentaje: 78 },
      { nombre: "Pantalones", cantidad: 21, porcentaje: 58 },
      { nombre: "Vestidos", cantidad: 17, porcentaje: 47 },
      { nombre: "Abrigos", cantidad: 12, porcentaje: 33 },
      { nombre: "Calzado", cantidad: 8, porcentaje: 22 },
    ],
    destacadas: [
      { id: "destacada-7-1", nombre: "Campera urbana", tipo: "Producto", categoria: "Abrigos", favoritos: 42 },
      { id: "destacada-7-2", nombre: "Vestido liviano", tipo: "Prenda", categoria: "Vestidos", favoritos: 35 },
      { id: "destacada-7-3", nombre: "Zapatillas clásicas", tipo: "Producto", categoria: "Calzado", favoritos: 29 },
    ],
  },
  "30dias": {
    indicadores: {
      usuariasNuevas: 142,
      variacionUsuarias: 18,
      prendasSubidas: 354,
      variacionPrendas: 11,
      outfitsCreados: 208,
      variacionOutfits: 7,
      comprasRealizadas: 76,
      variacionCompras: -3,
    },
    evolucion: [
      { etiqueta: "Sem. 1", usuarias: 29, prendas: 72 },
      { etiqueta: "Sem. 2", usuarias: 36, prendas: 91 },
      { etiqueta: "Sem. 3", usuarias: 31, prendas: 83 },
      { etiqueta: "Sem. 4", usuarias: 46, prendas: 108 },
    ],
    categorias: [
      { nombre: "Remeras", cantidad: 112, porcentaje: 78 },
      { nombre: "Pantalones", cantidad: 84, porcentaje: 59 },
      { nombre: "Vestidos", cantidad: 67, porcentaje: 47 },
      { nombre: "Abrigos", cantidad: 52, porcentaje: 37 },
      { nombre: "Calzado", cantidad: 39, porcentaje: 27 },
    ],
    destacadas: [
      { id: "destacada-30-1", nombre: "Campera urbana", tipo: "Producto", categoria: "Abrigos", favoritos: 128 },
      { id: "destacada-30-2", nombre: "Vestido liviano", tipo: "Prenda", categoria: "Vestidos", favoritos: 104 },
      { id: "destacada-30-3", nombre: "Zapatillas clásicas", tipo: "Producto", categoria: "Calzado", favoritos: 91 },
    ],
  },
  "3meses": {
    indicadores: {
      usuariasNuevas: 428,
      variacionUsuarias: 24,
      prendasSubidas: 1098,
      variacionPrendas: 15,
      outfitsCreados: 641,
      variacionOutfits: 13,
      comprasRealizadas: 231,
      variacionCompras: 9,
    },
    evolucion: [
      { etiqueta: "Mes 1", usuarias: 119, prendas: 301 },
      { etiqueta: "Mes 2", usuarias: 137, prendas: 348 },
      { etiqueta: "Mes 3", usuarias: 172, prendas: 449 },
    ],
    categorias: [
      { nombre: "Remeras", cantidad: 342, porcentaje: 78 },
      { nombre: "Pantalones", cantidad: 258, porcentaje: 59 },
      { nombre: "Vestidos", cantidad: 207, porcentaje: 48 },
      { nombre: "Abrigos", cantidad: 161, porcentaje: 37 },
      { nombre: "Calzado", cantidad: 130, porcentaje: 30 },
    ],
    destacadas: [
      { id: "destacada-90-1", nombre: "Campera urbana", tipo: "Producto", categoria: "Abrigos", favoritos: 364 },
      { id: "destacada-90-2", nombre: "Vestido liviano", tipo: "Prenda", categoria: "Vestidos", favoritos: 317 },
      { id: "destacada-90-3", nombre: "Zapatillas clásicas", tipo: "Producto", categoria: "Calzado", favoritos: 286 },
    ],
  },
};

export const etiquetasPeriodo: Record<PeriodoInforme, string> = {
  "7dias": "Últimos 7 días",
  "30dias": "Últimos 30 días",
  "3meses": "Últimos 3 meses",
};
