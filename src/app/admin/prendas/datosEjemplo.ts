// Datos temporales para reemplazar por la API real.
export type EstadoPrenda = "PENDIENTE" | "APROBADA" | "RECHAZADA";

export type PrendaModeracion = {
  id: string;
  nombre: string;
  categoria: string;
  color: string;
  talle: string;
  urlImagen: string;
  usuaria: string;
  estado: EstadoPrenda;
};

export const prendasEjemplo: PrendaModeracion[] = [
  {
    id: "prenda-001",
    nombre: "Camisa de lino",
    categoria: "Camisas",
    color: "Natural",
    talle: "M",
    urlImagen: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    usuaria: "Sofía Martínez",
    estado: "PENDIENTE",
  },
  {
    id: "prenda-002",
    nombre: "Remera básica",
    categoria: "Remeras",
    color: "Blanco",
    talle: "S",
    urlImagen: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    usuaria: "Valentina Ruiz",
    estado: "PENDIENTE",
  },
  {
    id: "prenda-003",
    nombre: "Jean recto",
    categoria: "Pantalones",
    color: "Azul",
    talle: "38",
    urlImagen: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
    usuaria: "Camila López",
    estado: "APROBADA",
  },
  {
    id: "prenda-004",
    nombre: "Vestido estampado",
    categoria: "Vestidos",
    color: "Floral",
    talle: "M",
    urlImagen: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    usuaria: "Lucía Fernández",
    estado: "PENDIENTE",
  },
  {
    id: "prenda-005",
    nombre: "Buzo de algodón",
    categoria: "Abrigos",
    color: "Verde",
    talle: "L",
    urlImagen: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    usuaria: "Martina Díaz",
    estado: "RECHAZADA",
  },
  {
    id: "prenda-006",
    nombre: "Pollera plisada",
    categoria: "Polleras",
    color: "Beige",
    talle: "S",
    urlImagen: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
    usuaria: "Julieta Torres",
    estado: "APROBADA",
  },
  {
    id: "prenda-007",
    nombre: "Campera de jean",
    categoria: "Abrigos",
    color: "Celeste",
    talle: "M",
    urlImagen: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=800&q=80",
    usuaria: "Agustina Castro",
    estado: "PENDIENTE",
  },
  {
    id: "prenda-008",
    nombre: "Top tejido",
    categoria: "Tops",
    color: "Terracota",
    talle: "S",
    urlImagen: "https://images.unsplash.com/photo-1564257577-6a9b5b79eebf?auto=format&fit=crop&w=800&q=80",
    usuaria: "Emilia Gómez",
    estado: "RECHAZADA",
  },
];
