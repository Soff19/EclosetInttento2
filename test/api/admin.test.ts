import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, createAdminUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Admin - Autorización", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar acceso de usuario normal al dashboard", async () => {
    const user = createTestUser({ rol: "USUARIA" });
    const token = generateTestToken(user);
    mockPrisma.usuario.findUnique.mockResolvedValue(user);

    const { GET } = await import("@/app/api/admin/dashboard/route");
    const request = new Request("http://localhost/api/admin/dashboard", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("debe permitir acceso de admin al dashboard", async () => {
    const admin = createAdminUser();
    const token = generateTestToken(admin);
    mockPrisma.usuario.findUnique.mockResolvedValue(admin);
    mockPrisma.usuario.count.mockResolvedValue(100);
    mockPrisma.prenda.count.mockResolvedValue(500);
    mockPrisma.producto.count.mockResolvedValue(50);
    mockPrisma.compra.count.mockResolvedValue(20);

    const { GET } = await import("@/app/api/admin/dashboard/route");
    const request = new Request("http://localhost/api/admin/dashboard", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it("debe rechazar sin autenticación", async () => {
    const { GET } = await import("@/app/api/admin/dashboard/route");
    const request = new Request("http://localhost/api/admin/dashboard");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("API Admin - Dashboard Stats", () => {
  const admin = createAdminUser();
  const token = generateTestToken(admin);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(admin);
  });

  it("debe retornar estadísticas del sistema", async () => {
    mockPrisma.usuario.count.mockResolvedValue(150);
    mockPrisma.prenda.count.mockResolvedValue(800);
    mockPrisma.producto.count.mockResolvedValue(75);
    mockPrisma.compra.count.mockResolvedValue(30);

    const { GET } = await import("@/app/api/admin/dashboard/route");
    const request = new Request("http://localhost/api/admin/dashboard", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toBeDefined();
    expect(data.stats.usuarios).toBe(150);
    expect(data.stats.prendas).toBe(800);
    expect(data.stats.productos).toBe(75);
    expect(data.stats.compras).toBe(30);
  });
});

describe("API Admin - Gestión de Usuarios", () => {
  const admin = createAdminUser();
  const token = generateTestToken(admin);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(admin);
  });

  it("debe listar usuarios del sistema", async () => {
    const usuarios = [
      createTestUser({ id: "user-1" }),
      createTestUser({ id: "user-2", email: "user2@example.com" }),
    ];
    mockPrisma.usuario.findMany.mockResolvedValue(usuarios);
    mockPrisma.usuario.count.mockResolvedValue(2);

    const { GET } = await import("@/app/api/admin/usuarios/route");
    const request = new Request("http://localhost/api/admin/usuarios", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.usuarios).toHaveLength(2);
  });

  it("debe cambiar estado de usuario (suspender/activar)", async () => {
    const userToSuspend = createTestUser({ estado: "ACTIVA" });
    mockPrisma.usuario.findUnique
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce(userToSuspend);
    mockPrisma.usuario.update.mockResolvedValue({
      ...userToSuspend,
      estado: "SUSPENDIDA",
    });

    const { PATCH } = await import("@/app/api/admin/usuarios/[id]/route");
    const request = new Request("http://localhost/api/admin/usuarios/user-id-123", {
      method: "PATCH",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ estado: "SUSPENDIDA" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "user-id-123" }) });
    expect(response.status).toBe(200);
  });

  it("debe cambiar rol de usuario", async () => {
    const userToPromote = createTestUser({ rol: "USUARIA" });
    mockPrisma.usuario.findUnique
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce(userToPromote);
    mockPrisma.usuario.update.mockResolvedValue({
      ...userToPromote,
      rol: "ADMIN",
    });

    const { PATCH } = await import("@/app/api/admin/usuarios/[id]/route");
    const request = new Request("http://localhost/api/admin/usuarios/user-id-123", {
      method: "PATCH",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ rol: "ADMIN" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "user-id-123" }) });
    expect(response.status).toBe(200);
  });
});

describe("API Admin - Moderación de Productos", () => {
  const admin = createAdminUser();
  const token = generateTestToken(admin);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(admin);
  });

  it("debe listar productos para moderación", async () => {
    const productos = [
      { ...fixtures.producto.valid, usuario: createTestUser() },
    ];
    mockPrisma.producto.findMany.mockResolvedValue(productos);
    mockPrisma.producto.count.mockResolvedValue(1);

    const { GET } = await import("@/app/api/admin/productos/route");
    const request = new Request("http://localhost/api/admin/productos", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.productos).toBeDefined();
  });

  it("debe eliminar producto con motivo", async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(fixtures.producto.valid);
    mockPrisma.producto.update.mockResolvedValue({
      ...fixtures.producto.valid,
      estado: "ELIMINADO",
      motivoEliminacion: "CONTENIDO_INAPROPIADO",
      explicacionEliminacion: "Viola los términos de uso",
      fechaEliminacion: new Date(),
    });
    mockPrisma.notificacion.create.mockResolvedValue({});

    const { DELETE } = await import("@/app/api/admin/productos/[id]/route");
    const request = new Request("http://localhost/api/admin/productos/producto-id-123", {
      method: "DELETE",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        motivo: "CONTENIDO_INAPROPIADO",
        explicacion: "Viola los términos de uso",
      }),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(200);
  });
});

describe("API Admin - Reportes", () => {
  const admin = createAdminUser();
  const token = generateTestToken(admin);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(admin);
  });

  it("debe obtener reporte de actividad", async () => {
    mockPrisma.usuario.count.mockResolvedValue(100);
    mockPrisma.prenda.count.mockResolvedValue(500);
    mockPrisma.producto.count.mockResolvedValue(50);
    mockPrisma.compra.count.mockResolvedValue(20);
    mockPrisma.compra.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/admin/reportes/route");
    const request = new Request("http://localhost/api/admin/reportes?tipo=actividad", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reporte).toBeDefined();
  });
});
