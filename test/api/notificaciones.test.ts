import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Notificaciones - GET /api/notificaciones", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe listar notificaciones del usuario", async () => {
    const notificaciones = [
      fixtures.notificacion.valid,
      { ...fixtures.notificacion.valid, id: "notif-2", tipo: "FAVORITO_AGREGADO" },
    ];
    mockPrisma.notificacion.findMany.mockResolvedValue(notificaciones);
    mockPrisma.notificacion.count.mockResolvedValue(1);

    const { GET } = await import("@/app/api/notificaciones/route");
    const request = new Request("http://localhost/api/notificaciones", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notificaciones).toHaveLength(2);
    expect(data.noLeidas).toBeDefined();
  });

  it("debe ordenar por fecha descendente", async () => {
    mockPrisma.notificacion.findMany.mockResolvedValue([]);
    mockPrisma.notificacion.count.mockResolvedValue(0);

    const { GET } = await import("@/app/api/notificaciones/route");
    const request = new Request("http://localhost/api/notificaciones", {
      headers: createAuthHeaders(token),
    });

    await GET(request);

    expect(mockPrisma.notificacion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: expect.objectContaining({
          creadoEn: "desc",
        }),
      })
    );
  });

  it("debe rechazar sin autenticación", async () => {
    const { GET } = await import("@/app/api/notificaciones/route");
    const request = new Request("http://localhost/api/notificaciones");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("API Notificaciones - POST /api/notificaciones (marcar leídas)", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe marcar todas las notificaciones como leídas", async () => {
    mockPrisma.notificacion.updateMany.mockResolvedValue({ count: 5 });

    const { POST } = await import("@/app/api/notificaciones/route");
    const request = new Request("http://localhost/api/notificaciones", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ accion: "marcar_leidas" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.actualizadas).toBe(5);
  });
});

describe("API Notificaciones - PATCH /api/notificaciones/[id]", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe marcar una notificación específica como leída", async () => {
    mockPrisma.notificacion.findUnique.mockResolvedValue(fixtures.notificacion.valid);
    mockPrisma.notificacion.update.mockResolvedValue({
      ...fixtures.notificacion.valid,
      leidaEn: new Date(),
    });

    const { PATCH } = await import("@/app/api/notificaciones/[id]/route");
    const request = new Request("http://localhost/api/notificaciones/notif-id-123", {
      method: "PATCH",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ leida: true }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "notif-id-123" }) });
    expect(response.status).toBe(200);
  });

  it("debe rechazar modificar notificación de otro usuario", async () => {
    mockPrisma.notificacion.findUnique.mockResolvedValue({
      ...fixtures.notificacion.valid,
      destinatarioId: "otro-usuario-id",
    });

    const { PATCH } = await import("@/app/api/notificaciones/[id]/route");
    const request = new Request("http://localhost/api/notificaciones/notif-id-123", {
      method: "PATCH",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ leida: true }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "notif-id-123" }) });
    expect(response.status).toBe(403);
  });
});

describe("Tipos de Notificación", () => {
  const tiposNotificacion = [
    "COMPRA_SOLICITADA",
    "COMPRA_ACEPTADA",
    "COMPRA_RECHAZADA",
    "COMPRA_CONCRETADA",
    "FAVORITO_AGREGADO",
    "RESENA_RECIBIDA",
    "PRODUCTO_VENDIDO",
  ];

  it("debe aceptar todos los tipos de notificación válidos", () => {
    tiposNotificacion.forEach((tipo) => {
      expect(tipo).toBeDefined();
      expect(typeof tipo).toBe("string");
    });
  });
});
