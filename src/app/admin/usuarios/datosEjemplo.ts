// Datos temporales para reemplazar por la API real.
export type EstadoUsuaria = "ACTIVA" | "SUSPENDIDA";
export type RolUsuaria = "ADMIN" | "USUARIA";

export type UsuariaAdmin = {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuaria;
  estado: EstadoUsuaria;
  fechaCreacion: string;
  perfilCompletado: boolean;
};

export const usuariasEjemplo: UsuariaAdmin[] = [
  {
    id: "usuario-001",
    nombre: "Alma Ríos",
    email: "alma.rios@example.com",
    rol: "ADMIN",
    estado: "ACTIVA",
    fechaCreacion: "2026-02-14",
    perfilCompletado: true,
  },
  {
    id: "usuario-002",
    nombre: "Celia Montes",
    email: "celia.montes@example.com",
    rol: "USUARIA",
    estado: "ACTIVA",
    fechaCreacion: "2026-03-02",
    perfilCompletado: true,
  },
  {
    id: "usuario-003",
    nombre: "Nina Soler",
    email: "nina.soler@example.com",
    rol: "USUARIA",
    estado: "SUSPENDIDA",
    fechaCreacion: "2026-03-18",
    perfilCompletado: false,
  },
  {
    id: "usuario-004",
    nombre: "Vera Luna",
    email: "vera.luna@example.com",
    rol: "USUARIA",
    estado: "ACTIVA",
    fechaCreacion: "2026-04-05",
    perfilCompletado: true,
  },
  {
    id: "usuario-005",
    nombre: "Lara Vidal",
    email: "lara.vidal@example.com",
    rol: "ADMIN",
    estado: "ACTIVA",
    fechaCreacion: "2026-04-21",
    perfilCompletado: true,
  },
  {
    id: "usuario-006",
    nombre: "Mora Paz",
    email: "mora.paz@example.com",
    rol: "USUARIA",
    estado: "SUSPENDIDA",
    fechaCreacion: "2026-05-09",
    perfilCompletado: true,
  },
  {
    id: "usuario-007",
    nombre: "Iris Costa",
    email: "iris.costa@example.com",
    rol: "USUARIA",
    estado: "ACTIVA",
    fechaCreacion: "2026-06-11",
    perfilCompletado: false,
  },
  {
    id: "usuario-008",
    nombre: "Zoe Campos",
    email: "zoe.campos@example.com",
    rol: "USUARIA",
    estado: "ACTIVA",
    fechaCreacion: "2026-07-26",
    perfilCompletado: true,
  },
  {
    id: "usuario-009",
    nombre: "Luz Ferrer",
    email: "luz.ferrer@example.com",
    rol: "USUARIA",
    estado: "ACTIVA",
    fechaCreacion: "2026-08-03",
    perfilCompletado: true,
  },
];
