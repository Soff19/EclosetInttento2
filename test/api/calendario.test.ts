import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Calendario - GET /api/calendario/mes", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe obtener eventos del mes actual", async () => {
    const eventos = [
      fixtures.eventoCalendario.valid,
      fixtures.eventoCalendario.outfit,
    ];
    mockPrisma.eventoCalendario.findMany.mockResolvedValue(eventos);

    const { GET } = await import("@/app/api/calendario/mes/route");
    const request = new Request("http://localhost/api/calendario/mes?year=2026&month=11", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.eventos).toHaveLength(2);
  });

  it("debe filtrar por rango de fechas del mes", async () => {
    mockPrisma.eventoCalendario.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/calendario/mes/route");
    const request = new Request("http://localhost/api/calendario/mes?year=2026&month=11", {
      headers: createAuthHeaders(token),
    });

    await GET(request);

    expect(mockPrisma.eventoCalendario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usuarioId: user.id,
          fecha: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        }),
      })
    );
  });

  it("debe rechazar sin autenticación", async () => {
    const { GET } = await import("@/app/api/calendario/mes/route");
    const request = new Request("http://localhost/api/calendario/mes?year=2026&month=11");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("API Calendario - POST /api/calendario/evento", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe crear un evento de calendario", async () => {
    mockPrisma.eventoCalendario.create.mockResolvedValue(fixtures.eventoCalendario.valid);

    const { POST } = await import("@/app/api/calendario/evento/route");
    const request = new Request("http://localhost/api/calendario/evento", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        fecha: "2026-11-15",
        tipo: "evento",
        titulo: "Cena de gala",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.evento).toBeDefined();
  });

  it("debe rechazar evento sin fecha", async () => {
    const { POST } = await import("@/app/api/calendario/evento/route");
    const request = new Request("http://localhost/api/calendario/evento", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        tipo: "evento",
        titulo: "Sin fecha",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("debe rechazar tipo de evento inválido", async () => {
    const { POST } = await import("@/app/api/calendario/evento/route");
    const request = new Request("http://localhost/api/calendario/evento", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        fecha: "2026-11-15",
        tipo: "tipo_invalido",
        titulo: "Evento",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe("API Calendario - POST /api/calendario/outfit", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe asignar outfit a una fecha", async () => {
    mockPrisma.outfit.findUnique.mockResolvedValue(fixtures.outfit.valid);
    mockPrisma.eventoCalendario.create.mockResolvedValue(fixtures.eventoCalendario.outfit);

    const { POST } = await import("@/app/api/calendario/outfit/route");
    const request = new Request("http://localhost/api/calendario/outfit", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        fecha: "2026-11-20",
        outfitId: "outfit-id-123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it("debe rechazar outfit inexistente", async () => {
    mockPrisma.outfit.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/calendario/outfit/route");
    const request = new Request("http://localhost/api/calendario/outfit", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        fecha: "2026-11-20",
        outfitId: "outfit-inexistente",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("debe rechazar outfit de otro usuario", async () => {
    mockPrisma.outfit.findUnique.mockResolvedValue({
      ...fixtures.outfit.valid,
      usuarioId: "otro-usuario-id",
    });

    const { POST } = await import("@/app/api/calendario/outfit/route");
    const request = new Request("http://localhost/api/calendario/outfit", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        fecha: "2026-11-20",
        outfitId: "outfit-ajeno",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});

describe("API Calendario - DELETE /api/calendario/[id]", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe eliminar evento propio", async () => {
    mockPrisma.eventoCalendario.findUnique.mockResolvedValue(fixtures.eventoCalendario.valid);
    mockPrisma.eventoCalendario.delete.mockResolvedValue(fixtures.eventoCalendario.valid);

    const { DELETE } = await import("@/app/api/calendario/[id]/route");
    const request = new Request("http://localhost/api/calendario/evento-id-123", {
      method: "DELETE",
      headers: createAuthHeaders(token),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "evento-id-123" }) });
    expect(response.status).toBe(200);
  });

  it("debe rechazar eliminar evento de otro usuario", async () => {
    mockPrisma.eventoCalendario.findUnique.mockResolvedValue({
      ...fixtures.eventoCalendario.valid,
      usuarioId: "otro-usuario-id",
    });

    const { DELETE } = await import("@/app/api/calendario/[id]/route");
    const request = new Request("http://localhost/api/calendario/evento-id-123", {
      method: "DELETE",
      headers: createAuthHeaders(token),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "evento-id-123" }) });
    expect(response.status).toBe(403);
  });
});
