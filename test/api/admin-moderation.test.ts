import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "../setup";
import { createAdminUser, createTestUser, generateTestToken } from "../helpers/auth";

const admin = createAdminUser();
const adminToken = generateTestToken(admin);

function authedRequest(url: string, body?: unknown) {
  return new NextRequest(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("PATCH /api/admin/usuarios/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockImplementation(({ where }) =>
      where.id === admin.id ? admin : createTestUser({ id: where.id }),
    );
    mockPrisma.usuario.update.mockResolvedValue(createTestUser({
      id: "user-2",
      fechaCreacion: new Date("2026-10-15T00:00:00.000Z"),
    }));
    mockPrisma.usuario.count.mockResolvedValue(2);
  });

  it("actualiza rol/estado válidos y serializa la fecha", async () => {
    const { PATCH } = await import("@/app/api/admin/usuarios/[id]/route");
    const result = await PATCH(
      authedRequest("http://localhost/api/admin/usuarios/user-2", { estado: "SUSPENDIDA" }),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    const data = await result.json();

    expect(result.status).toBe(200);
    expect(data.usuario.fechaCreacion).toBe("2026-10-15");
    expect(mockPrisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { estado: "SUSPENDIDA" },
    }));
  });

  it.each([
    [null, 400],
    [{ rol: "ROOT" }, 400],
    [{}, 400],
  ])("rechaza cambios inválidos (%j)", async (body, status) => {
    const { PATCH } = await import("@/app/api/admin/usuarios/[id]/route");
    const result = await PATCH(
      authedRequest("http://localhost/api/admin/usuarios/user-2", body),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    expect(result.status).toBe(status);
  });

  it("responde 404 si la usuaria no existe y protege al último administrador", async () => {
    mockPrisma.usuario.findUnique.mockImplementation(({ where }) =>
      where.id === admin.id ? admin : null,
    );
    const { PATCH } = await import("@/app/api/admin/usuarios/[id]/route");
    const missing = await PATCH(
      authedRequest("http://localhost/api/admin/usuarios/absent", { rol: "USUARIA" }),
      { params: Promise.resolve({ id: "absent" }) },
    );
    expect(missing.status).toBe(404);

    mockPrisma.usuario.findUnique.mockImplementation(({ where }) =>
      where.id === admin.id ? admin : createAdminUser({ id: where.id }),
    );
    mockPrisma.usuario.count.mockResolvedValue(1);
    const lastAdmin = await PATCH(
      authedRequest("http://localhost/api/admin/usuarios/admin-2", { estado: "SUSPENDIDA" }),
      { params: Promise.resolve({ id: "admin-2" }) },
    );
    expect(lastAdmin.status).toBe(409);
  });

  it("impide que el administrador se quite su propio acceso", async () => {
    const { PATCH } = await import("@/app/api/admin/usuarios/[id]/route");
    const result = await PATCH(
      authedRequest(`http://localhost/api/admin/usuarios/${admin.id}`, { rol: "USUARIA" }),
      { params: Promise.resolve({ id: admin.id }) },
    );
    expect(result.status).toBe(409);
  });

  it("rechaza una solicitud sin administrador autenticado", async () => {
    const { PATCH } = await import("@/app/api/admin/usuarios/[id]/route");
    const result = await PATCH(
      new NextRequest("http://localhost/api/admin/usuarios/user-2", {
        method: "PATCH",
        body: JSON.stringify({ rol: "ADMIN" }),
      }),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    expect(result.status).toBe(403);
  });
});

describe("DELETE /api/admin/usuarios/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockImplementation(({ where }) =>
      where.id === admin.id ? admin : createTestUser({ id: where.id }),
    );
    mockPrisma.usuario.count.mockResolvedValue(2);
  });

  async function remove(id: string) {
    const { DELETE } = await import("@/app/api/admin/usuarios/[id]/route");
    return DELETE(
      new NextRequest(`http://localhost/api/admin/usuarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      { params: Promise.resolve({ id }) },
    );
  }

  it("elimina otra usuaria", async () => {
    expect((await remove("user-2")).status).toBe(200);
    expect(mockPrisma.usuario.delete).toHaveBeenCalledWith({ where: { id: "user-2" } });
  });

  it("maneja usuaria inexistente, autoeliminación y último administrador", async () => {
    mockPrisma.usuario.findUnique.mockImplementation(({ where }) =>
      where.id === admin.id ? admin : null,
    );
    expect((await remove("absent")).status).toBe(404);

    expect((await remove(admin.id)).status).toBe(409);

    mockPrisma.usuario.findUnique.mockImplementation(({ where }) =>
      where.id === admin.id ? admin : createAdminUser({ id: where.id }),
    );
    mockPrisma.usuario.count.mockResolvedValue(1);
    expect((await remove("admin-2")).status).toBe(409);
  });
});

describe("PATCH /api/admin/productos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(admin);
    mockPrisma.producto.updateMany.mockResolvedValue({ count: 1 });
  });

  it("elimina una publicación con un motivo y explicación válidos", async () => {
    const { PATCH } = await import("@/app/api/admin/productos/[id]/route");
    const result = await PATCH(
      authedRequest("http://localhost/api/admin/productos/product-1", {
        motivo: "Contenido inapropiado",
        explicacion: "La publicación incumple las normas.",
      }),
      { params: Promise.resolve({ id: "product-1" }) },
    );

    expect(result.status).toBe(200);
    expect(mockPrisma.producto.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "product-1", estado: "DISPONIBLE" },
      data: expect.objectContaining({ estado: "ELIMINADA" }),
    }));
  });

  it("valida el motivo, la extensión y la existencia del producto", async () => {
    const { PATCH } = await import("@/app/api/admin/productos/[id]/route");
    const invalid = await PATCH(
      authedRequest("http://localhost/api/admin/productos/product-1", {
        motivo: "otro",
        explicacion: "corta",
      }),
      { params: Promise.resolve({ id: "product-1" }) },
    );
    expect(invalid.status).toBe(400);

    mockPrisma.producto.updateMany.mockResolvedValue({ count: 0 });
    const missing = await PATCH(
      authedRequest("http://localhost/api/admin/productos/product-1", {
        motivo: "Contenido inapropiado",
        explicacion: "La publicación incumple las normas.",
      }),
      { params: Promise.resolve({ id: "product-1" }) },
    );
    expect(missing.status).toBe(404);
  });
});
