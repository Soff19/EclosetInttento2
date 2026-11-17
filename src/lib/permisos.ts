export type Rol = "ADMIN" | "MODERADORA" | "USUARIA";
export type Permiso = "usuarios:gestionar" | "prendas:moderar" | "productos:moderar" | "reportes:ver";

export const PERMISOS: Record<Rol, Permiso[]> = {
  ADMIN: ["usuarios:gestionar", "prendas:moderar", "productos:moderar", "reportes:ver"],
  MODERADORA: ["prendas:moderar", "productos:moderar", "reportes:ver"],
  USUARIA: [],
};

export const tienePermiso = (rol: string | undefined, p: Permiso) =>
  !!rol && (PERMISOS[rol as Rol] ?? []).includes(p);