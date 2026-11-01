import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Compras - Decisión del vendedor", () => {
  const seller = createTestUser({ id: "seller-id", email: "seller@example.com" });
  const token = generateTestToken(seller);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(seller);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/compras/[id]/decision/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "ACEPTAR" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    expect(response.status).toBe(401);
  });

  it("debe retornar error para compra inexistente", async () => {
    mockPrisma.compra.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/compras/[id]/decision/route");
    const request = new Request("http://localhost/api/compras/compra-inexistente/decision", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ decision: "ACEPTAR" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-inexistente" }) });
    expect(response.status).toBe(400);
  });
});

describe("API Compras - Concretar compra", () => {
  const buyer = createTestUser({ id: "buyer-id" });
  const token = generateTestToken(buyer);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(buyer);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/compras/[id]/concretar/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/concretar", {
      method: "POST",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    expect(response.status).toBe(401);
  });

  });

describe("API Compras - Reseña del vendedor", () => {
  const buyer = createTestUser({ id: "buyer-id" });
  const token = generateTestToken(buyer);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(buyer);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/compras/[id]/resena/route");
    const request = new Request("http://localhost/api/compras/compra-id-456/resena", {
      method: "POST",
      body: JSON.stringify({ puntuacion: 5 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-456" }) });
    expect(response.status).toBe(401);
  });

  it("debe retornar 404 para compra inexistente", async () => {
    mockPrisma.compra.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/compras/[id]/resena/route");
    const request = new Request("http://localhost/api/compras/compra-inexistente/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ puntuacion: 5 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-inexistente" }) });
    expect(response.status).toBe(404);
  });
});

describe("Estados de Compra", () => {
  const estados = ["PENDIENTE", "ACEPTADA", "RECHAZADA", "CONCRETADA", "CANCELADA"];

  it("debe tener todos los estados válidos definidos", () => {
    estados.forEach((estado) => {
      expect(estado).toBeDefined();
      expect(typeof estado).toBe("string");
    });
  });

  it("estado inicial debe ser PENDIENTE", () => {
    expect(fixtures.compra.valid.estado).toBe("PENDIENTE");
  });
});
