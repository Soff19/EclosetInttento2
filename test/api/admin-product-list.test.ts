import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "../setup";
import { createAdminUser, generateTestToken } from "../helpers/auth";

const admin = createAdminUser();
const token = generateTestToken(admin);

describe("GET /api/admin/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(admin);
  });

  it("requiere un administrador", async () => {
    const { GET } = await import("@/app/api/admin/productos/route");
    const result = await GET(new NextRequest("http://localhost/api/admin/productos"));
    expect(result.status).toBe(403);
  });

  it("transforma etiquetas y datos de vendedora para ambas listas", async () => {
    mockPrisma.producto.findMany
      .mockResolvedValueOnce([{
        id: "active",
        titulo: "Campera",
        descripcion: "Abrigo",
        precio: 1200,
        imagen: null,
        etiquetas: '["invierno","casual"]',
        usuario: { nombre: null, email: "seller@example.com" },
        motivoEliminacion: null,
        explicacionEliminacion: null,
        fechaEliminacion: null,
      }])
      .mockResolvedValueOnce([]);
    const { GET } = await import("@/app/api/admin/productos/route");
    const result = await GET(new NextRequest("http://localhost/api/admin/productos", {
      headers: { Authorization: `Bearer ${token}` },
    }));
    const data = await result.json();

    expect(result.status).toBe(200);
    expect(data.publicaciones[0]).toMatchObject({
      etiquetas: ["invierno", "casual"],
      categoria: "invierno",
      vendedora: "seller@example.com",
    });
    expect(data.historial).toEqual([]);
  });

  it("responde con error si falla la consulta", async () => {
    mockPrisma.producto.findMany.mockRejectedValue(new Error("database down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { GET } = await import("@/app/api/admin/productos/route");
    const result = await GET(new NextRequest("http://localhost/api/admin/productos", {
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(result.status).toBe(500);
    error.mockRestore();
  });
});
