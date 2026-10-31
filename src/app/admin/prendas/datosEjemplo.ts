// Datos temporales hasta que las publicaciones se conecten con el modelo Producto.
export type EstadoPublicacion = "ACTIVA" | "ELIMINADA";

export type PublicacionMarketplace = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  // Clasificación de ejemplo: Producto solo tiene etiquetas en la base.
  categoria: string;
  etiquetas: string[];
  vendedora: string;
  estado: EstadoPublicacion;
  // Datos temporales hasta que existan estos campos en la base.
  motivoEliminacion?: string;
  explicacionEliminacion?: string;
  fechaEliminacion?: string;
};

export const publicacionesEjemplo: PublicacionMarketplace[] = [
  {
    id: "producto-001",
    titulo: "Camisa de lino",
    descripcion: "Camisa liviana de lino en tono natural, en excelente estado.",
    precio: 18000,
    imagen: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    categoria: "Camisas",
    etiquetas: ["casual", "verano"],
    vendedora: "Sofía Martínez",
    estado: "ACTIVA",
  },
  {
    id: "producto-002",
    titulo: "Remera básica",
    descripcion: "Remera blanca de algodón, talle S.",
    precio: 9500,
    imagen: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    categoria: "Remeras",
    etiquetas: ["básicos", "casual"],
    vendedora: "Valentina Ruiz",
    estado: "ACTIVA",
  },
  {
    id: "producto-003",
    titulo: "Jean recto vintage",
    descripcion: "Jean azul de corte recto, cómodo y versátil.",
    precio: 24000,
    imagen: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
    categoria: "Pantalones",
    etiquetas: ["vintage", "casual"],
    vendedora: "Camila López",
    estado: "ACTIVA",
  },
  {
    id: "producto-004",
    titulo: "Vestido estampado",
    descripcion: "Vestido floral ideal para los días de verano.",
    precio: 22000,
    imagen: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    categoria: "Vestidos",
    etiquetas: ["verano", "elegante"],
    vendedora: "Lucía Fernández",
    estado: "ACTIVA",
  },
  {
    id: "producto-005",
    titulo: "Buzo de algodón",
    descripcion: "Buzo verde de algodón, abrigado y suave.",
    precio: 19500,
    imagen: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    categoria: "Abrigos",
    etiquetas: ["casual", "deportivo"],
    vendedora: "Martina Díaz",
    estado: "ACTIVA",
  },
  {
    id: "producto-006",
    titulo: "Pollera plisada",
    descripcion: "Pollera plisada beige, talle S.",
    precio: 16500,
    imagen: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
    categoria: "Polleras",
    etiquetas: ["elegante", "verano"],
    vendedora: "Julieta Torres",
    estado: "ACTIVA",
  },
  {
    id: "producto-007",
    titulo: "Campera de jean",
    descripcion: "Campera celeste de jean, talle M.",
    precio: 28000,
    imagen: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=800&q=80",
    categoria: "Abrigos",
    etiquetas: ["vintage", "casual"],
    vendedora: "Agustina Castro",
    estado: "ACTIVA",
  },
  {
    id: "producto-008",
    titulo: "Top tejido",
    descripcion: "Top tejido en color terracota.",
    precio: 12500,
    imagen: "https://images.unsplash.com/photo-1564257577-6a9b5b79eebf?auto=format&fit=crop&w=800&q=80",
    categoria: "Tops",
    etiquetas: ["verano", "hecho a mano"],
    vendedora: "Emilia Gómez",
    estado: "ELIMINADA",
    motivoEliminacion: "Información incorrecta o incompleta",
    explicacionEliminacion: "La descripción no coincide con la publicación y falta información importante para quien compra.",
    fechaEliminacion: "2026-10-26T11:15:00.000Z",
  },
];
