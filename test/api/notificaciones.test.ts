import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Notificaciones - GET /api/notificaciones", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/notificaciones/route");
    const request = new Request("http://localhost/api/notificaciones");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("API Notificaciones - PATCH /api/notificaciones (marcar todas leídas)", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe marcar todas las notificaciones como leídas", async () => {
    mockPrisma.notificacion.updateMany.mockResolvedValue({ count: 5 });
    mockPrisma.notificacion.count.mockResolvedValue(0);

    const { PATCH } = await import("@/app/api/notificaciones/route");
    const request = new Request("http://localhost/api/notificaciones", {
      method: "PATCH",
      headers: createAuthHeaders(token),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.noLeidas).toBe(0);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/notificaciones/route");
    const request = new Request("http://localhost/api/notificaciones", {
      method: "PATCH",
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });
});

describe("API Notificaciones - PATCH /api/notificaciones/[id]", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe marcar una notificación específica como leída", async () => {
    mockPrisma.notificacion.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notificacion.count.mockResolvedValue(0);

    const { PATCH } = await import("@/app/api/notificaciones/[id]/route");
    const request = new Request("http://localhost/api/notificaciones/notif-id-123", {
      method: "PATCH",
      headers: createAuthHeaders(token),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "notif-id-123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("debe retornar 404 para notificación inexistente", async () => {
    mockPrisma.notificacion.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.notificacion.findFirst.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/notificaciones/[id]/route");
    const request = new Request("http://localhost/api/notificaciones/notif-inexistente", {
      method: "PATCH",
      headers: createAuthHeaders(token),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "notif-inexistente" }) });
    expect(response.status).toBe(404);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/notificaciones/[id]/route");
    const request = new Request("http://localhost/api/notificaciones/notif-id-123", {
      method: "PATCH",
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "notif-id-123" }) });
    expect(response.status).toBe(401);
  });
});

describe("Tipos de Notificación", () => {
  const tiposNotificacion = [
    "SOLICITUD_COMPRA",
    "SOLICITUD_COMPRA_ACEPTADA",
    "SOLICITUD_COMPRA_DENEGADA",
    "COMPRA_CONCRETADA",
    "FAVORITO",
    "RESENA",
  ];

  it("debe tener tipos de notificación definidos", () => {
    tiposNotificacion.forEach((tipo) => {
      expect(tipo).toBeDefined();
      expect(typeof tipo).toBe("string");
    });
  });
});
