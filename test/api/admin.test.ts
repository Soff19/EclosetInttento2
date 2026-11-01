import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, createAdminUser, generateTestToken, createAuthHeaders } from "../helpers/auth";

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

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/dashboard/route");
    const request = new Request("http://localhost/api/admin/dashboard");

    const response = await GET(request);
    expect(response.status).toBe(403);
  });
});

describe("API Admin - Gestión de Usuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar acceso de usuario normal", async () => {
    const user = createTestUser({ rol: "USUARIA" });
    const userToken = generateTestToken(user);
    mockPrisma.usuario.findUnique.mockResolvedValue(user);

    const { GET } = await import("@/app/api/admin/usuarios/route");
    const request = new Request("http://localhost/api/admin/usuarios", {
      headers: createAuthHeaders(userToken),
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/usuarios/route");
    const request = new Request("http://localhost/api/admin/usuarios");

    const response = await GET(request);
    expect(response.status).toBe(403);
  });
});

describe("API Admin - Moderación de Productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar acceso de usuario normal", async () => {
    const user = createTestUser({ rol: "USUARIA" });
    const userToken = generateTestToken(user);
    mockPrisma.usuario.findUnique.mockResolvedValue(user);

    const { GET } = await import("@/app/api/admin/productos/route");
    const request = new Request("http://localhost/api/admin/productos", {
      headers: createAuthHeaders(userToken),
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/productos/route");
    const request = new Request("http://localhost/api/admin/productos");

    const response = await GET(request);
    expect(response.status).toBe(403);
  });
});

describe("API Admin - Reportes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/reportes/route");
    const request = new Request("http://localhost/api/admin/reportes");

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("debe rechazar acceso de usuario normal", async () => {
    const user = createTestUser({ rol: "USUARIA" });
    const userToken = generateTestToken(user);
    mockPrisma.usuario.findUnique.mockResolvedValue(user);

    const { GET } = await import("@/app/api/admin/reportes/route");
    const request = new Request("http://localhost/api/admin/reportes", {
      headers: createAuthHeaders(userToken),
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });
});
