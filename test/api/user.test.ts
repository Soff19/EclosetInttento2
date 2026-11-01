import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";

describe("API User - PUT /api/user/preferences", () => {
  const user = createTestUser({ perfilCompletado: false });
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe guardar preferencias del onboarding", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
    mockPrisma.usuario.update.mockResolvedValue({
      ...user,
      preferencias: { estilos: ["casual", "formal"], colores: ["negro", "blanco"] },
      perfilCompletado: true,
    });

    const { PUT } = await import("@/app/api/user/preferences/route");
    const request = new Request("http://localhost/api/user/preferences", {
      method: "PUT",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        estilos: ["casual", "formal"],
        colores: ["negro", "blanco"],
        tallas: { superior: "M", inferior: "38" },
      }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("debe marcar perfil como completado", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
    mockPrisma.usuario.update.mockResolvedValue({
      ...user,
      perfilCompletado: true,
    });

    const { PUT } = await import("@/app/api/user/preferences/route");
    const request = new Request("http://localhost/api/user/preferences", {
      method: "PUT",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        estilos: ["casual"],
      }),
    });

    await PUT(request);

    expect(mockPrisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          perfilCompletado: true,
        }),
      })
    );
  });

  it("debe rechazar sin autenticación", async () => {
    const { PUT } = await import("@/app/api/user/preferences/route");
    const request = new Request("http://localhost/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estilos: ["casual"] }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });
});

describe("API User - GET /api/usuarios/[id]", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener perfil público de otro usuario", async () => {
    const otherUser = createTestUser({
      id: "other-user-id",
      email: "other@example.com",
      nombre: "Otro Usuario",
    });
    mockPrisma.usuario.findUnique.mockResolvedValue({
      ...otherUser,
      _count: { prendas: 10, outfits: 5, productos: 3 },
    });

    const { GET } = await import("@/app/api/usuarios/[id]/route");
    const request = new Request("http://localhost/api/usuarios/other-user-id", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request, { params: Promise.resolve({ id: "other-user-id" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.usuario).toBeDefined();
    expect(data.usuario.nombre).toBe("Otro Usuario");
    expect(data.usuario.email).toBeUndefined();
  });

  it("debe retornar 404 para usuario inexistente", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/usuarios/[id]/route");
    const request = new Request("http://localhost/api/usuarios/no-existe", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request, { params: Promise.resolve({ id: "no-existe" }) });
    expect(response.status).toBe(404);
  });
});

describe("API Auth - PUT /api/auth/profile", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe actualizar nombre de usuario", async () => {
    mockPrisma.usuario.update.mockResolvedValue({
      ...user,
      nombre: "Nuevo Nombre",
    });

    const { PUT } = await import("@/app/api/auth/profile/route");
    const request = new Request("http://localhost/api/auth/profile", {
      method: "PUT",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ nombre: "Nuevo Nombre" }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.nombre).toBe("Nuevo Nombre");
  });

  it("debe actualizar foto de perfil", async () => {
    mockPrisma.usuario.update.mockResolvedValue({
      ...user,
      fotoPerfil: "https://example.com/new-photo.jpg",
    });

    const { PUT } = await import("@/app/api/auth/profile/route");
    const request = new Request("http://localhost/api/auth/profile", {
      method: "PUT",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ fotoPerfil: "https://example.com/new-photo.jpg" }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.fotoPerfil).toBe("https://example.com/new-photo.jpg");
  });
});
