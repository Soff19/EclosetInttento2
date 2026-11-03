import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken } from "../helpers/auth";

const user = createTestUser({ id: "seller-id" });
const token = generateTestToken(user);
const producto = {
  id: "product-1",
  usuarioId: user.id,
  titulo: "Campera",
  descripcion: "Abrigo",
  precio: 1000,
  estado: "DISPONIBLE",
  imagen: "https://example.com/image.jpg",
  etiquetas: '["invierno"]',
  contacto: null,
};

function request(url: string, method = "GET", body?: unknown, authenticated = true) {
  return new NextRequest(url, {
    method,
    headers: authenticated ? { Authorization: `Bearer ${token}` } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("/api/productos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("consulta una publicación y marca si pertenece a la usuaria", async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(producto);
    const { GET } = await import("@/app/api/productos/[id]/route");
    const result = await GET(
      request("http://localhost/api/productos/product-1"),
      { params: Promise.resolve({ id: producto.id }) },
    );
    const data = await result.json();

    expect(result.status).toBe(200);
    expect(data.producto).toMatchObject({
      etiquetas: ["invierno"],
      esPropio: true,
    });
  });

  it("oculta publicaciones inexistentes o eliminadas", async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(null);
    const { GET } = await import("@/app/api/productos/[id]/route");
    expect((await GET(request("http://localhost/api/productos/missing"), {
      params: Promise.resolve({ id: "missing" }),
    })).status).toBe(404);

    mockPrisma.producto.findUnique.mockResolvedValue({ ...producto, estado: "ELIMINADA" });
    expect((await GET(request("http://localhost/api/productos/product-1"), {
      params: Promise.resolve({ id: producto.id }),
    })).status).toBe(404);
  });

  it("actualiza solo publicaciones propias y serializa etiquetas", async () => {
    mockPrisma.producto.findFirst.mockResolvedValue(producto);
    mockPrisma.producto.update.mockResolvedValue(producto);
    const { PUT } = await import("@/app/api/productos/[id]/route");
    const result = await PUT(
      request("http://localhost/api/productos/product-1", "PUT", {
        precio: "2500",
        etiquetas: ["Casual", "Verano"],
      }),
      { params: Promise.resolve({ id: producto.id }) },
    );

    expect(result.status).toBe(200);
    expect(mockPrisma.producto.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ precio: 2500, etiquetas: '["casual","verano"]' }),
    }));
  });

  it("rechaza cambios sin autenticación, publicaciones ajenas o eliminadas", async () => {
    const { PUT } = await import("@/app/api/productos/[id]/route");
    expect((await PUT(
      request("http://localhost/api/productos/product-1", "PUT", {}, false),
      { params: Promise.resolve({ id: producto.id }) },
    )).status).toBe(401);

    mockPrisma.producto.findFirst.mockResolvedValue(null);
    expect((await PUT(
      request("http://localhost/api/productos/product-1", "PUT", {}),
      { params: Promise.resolve({ id: producto.id }) },
    )).status).toBe(404);

    mockPrisma.producto.findFirst.mockResolvedValue({ ...producto, estado: "ELIMINADA" });
    expect((await PUT(
      request("http://localhost/api/productos/product-1", "PUT", {}),
      { params: Promise.resolve({ id: producto.id }) },
    )).status).toBe(409);
  });

  it("elimina únicamente publicaciones propias", async () => {
    const { DELETE } = await import("@/app/api/productos/[id]/route");
    mockPrisma.producto.deleteMany.mockResolvedValue({ count: 0 });
    expect((await DELETE(
      request("http://localhost/api/productos/product-1", "DELETE"),
      { params: Promise.resolve({ id: producto.id }) },
    )).status).toBe(404);

    mockPrisma.producto.deleteMany.mockResolvedValue({ count: 1 });
    expect((await DELETE(
      request("http://localhost/api/productos/product-1", "DELETE"),
      { params: Promise.resolve({ id: producto.id }) },
    )).status).toBe(200);
  });
});
