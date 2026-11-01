import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Prendas - GET /api/prendas", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe listar las prendas del usuario autenticado", async () => {
    const prendas = [fixtures.prenda.valid, { ...fixtures.prenda.valid, id: "prenda-2" }];
    mockPrisma.prenda.findMany.mockResolvedValue(prendas);

    const { GET } = await import("@/app/api/prendas/route");
    const request = new Request("http://localhost/api/prendas", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prendas).toHaveLength(2);
    expect(mockPrisma.prenda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { usuarioId: user.id },
      })
    );
  });

  it("debe retornar array vacío si no hay prendas", async () => {
    mockPrisma.prenda.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/prendas/route");
    const request = new Request("http://localhost/api/prendas", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prendas).toHaveLength(0);
  });

  it("debe rechazar petición sin autenticación", async () => {
    const { GET } = await import("@/app/api/prendas/route");
    const request = new Request("http://localhost/api/prendas");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("API Prendas - POST /api/prendas", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe crear una prenda con imagen URL", async () => {
    mockPrisma.prenda.create.mockResolvedValue(fixtures.prenda.valid);

    const { POST } = await import("@/app/api/prendas/route");

    const formData = new FormData();
    formData.append("categoria", "REMERA");
    formData.append("color", "AZUL");
    formData.append("nombre", "Nueva remera");
    formData.append("urlImagen", "https://example.com/image.jpg");

    const request = new Request("http://localhost/api/prendas", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.prenda).toBeDefined();
    expect(mockPrisma.prenda.create).toHaveBeenCalled();
  });

  it("debe rechazar prenda sin categoría", async () => {
    const { POST } = await import("@/app/api/prendas/route");

    const formData = new FormData();
    formData.append("color", "AZUL");
    formData.append("urlImagen", "https://example.com/image.jpg");

    const request = new Request("http://localhost/api/prendas", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("debe rechazar prenda sin imagen", async () => {
    const { POST } = await import("@/app/api/prendas/route");

    const formData = new FormData();
    formData.append("categoria", "REMERA");
    formData.append("color", "AZUL");

    const request = new Request("http://localhost/api/prendas", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("debe parsear etiquetas correctamente", async () => {
    mockPrisma.prenda.create.mockResolvedValue(fixtures.prenda.valid);

    const { POST } = await import("@/app/api/prendas/route");

    const formData = new FormData();
    formData.append("categoria", "REMERA");
    formData.append("urlImagen", "https://example.com/image.jpg");
    formData.append("etiquetas", "casual, verano, playa");

    const request = new Request("http://localhost/api/prendas", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    expect(mockPrisma.prenda.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          etiquetas: '["casual","verano","playa"]',
        }),
      })
    );
  });
});

describe("API Prendas - GET /api/prendas/[id]", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe retornar 404 para prenda inexistente", async () => {
    mockPrisma.prenda.findFirst.mockResolvedValue(null);

    const { GET } = await import("@/app/api/prendas/[id]/route");
    const request = new Request("http://localhost/api/prendas/no-existe", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request, { params: Promise.resolve({ id: "no-existe" }) });
    expect(response.status).toBe(404);
  });

  it("debe rechazar acceso a prenda de otro usuario", async () => {
    mockPrisma.prenda.findFirst.mockResolvedValue(null);

    const { GET } = await import("@/app/api/prendas/[id]/route");
    const request = new Request("http://localhost/api/prendas/prenda-id-123", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request, { params: Promise.resolve({ id: "prenda-id-123" }) });
    expect(response.status).toBe(404);
  });
});

describe("API Prendas - DELETE /api/prendas/[id]", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe eliminar una prenda propia", async () => {
    mockPrisma.prenda.findFirst.mockResolvedValue(fixtures.prenda.valid);
    mockPrisma.prenda.delete.mockResolvedValue(fixtures.prenda.valid);

    const { DELETE } = await import("@/app/api/prendas/[id]/route");
    const request = new Request("http://localhost/api/prendas/prenda-id-123", {
      method: "DELETE",
      headers: createAuthHeaders(token),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "prenda-id-123" }) });
    expect(response.status).toBe(200);
    expect(mockPrisma.prenda.delete).toHaveBeenCalled();
  });

  it("debe rechazar eliminar prenda de otro usuario", async () => {
    mockPrisma.prenda.findFirst.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/prendas/[id]/route");
    const request = new Request("http://localhost/api/prendas/prenda-id-123", {
      method: "DELETE",
      headers: createAuthHeaders(token),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "prenda-id-123" }) });
    expect(response.status).toBe(404);
  });
});
