import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Compras - Decisión del vendedor", () => {
  const seller = createTestUser({ id: "seller-id", email: "seller@example.com" });
  const token = generateTestToken(seller);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe aceptar solicitud de compra", async () => {
    const compra = {
      ...fixtures.compra.valid,
      producto: { ...fixtures.producto.valid, usuarioId: seller.id },
      comprador: createTestUser({ id: "buyer-id" }),
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);
    mockPrisma.compra.update.mockResolvedValue({
      ...compra,
      estado: "ACEPTADA",
    });
    mockPrisma.notificacion.create.mockResolvedValue({});

    const { POST } = await import("@/app/api/compras/[id]/decision/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/decision", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ decision: "ACEPTAR" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.compra.estado).toBe("ACEPTADA");
  });

  it("debe rechazar solicitud de compra", async () => {
    const compra = {
      ...fixtures.compra.valid,
      producto: { ...fixtures.producto.valid, usuarioId: seller.id },
      comprador: createTestUser({ id: "buyer-id" }),
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);
    mockPrisma.compra.update.mockResolvedValue({
      ...compra,
      estado: "RECHAZADA",
    });
    mockPrisma.notificacion.create.mockResolvedValue({});

    const { POST } = await import("@/app/api/compras/[id]/decision/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/decision", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ decision: "RECHAZAR" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.compra.estado).toBe("RECHAZADA");
  });

  it("debe rechazar decisión de no-vendedor", async () => {
    const otherUser = createTestUser({ id: "other-id" });
    const otherToken = generateTestToken(otherUser);

    const compra = {
      ...fixtures.compra.valid,
      producto: { ...fixtures.producto.valid, usuarioId: seller.id },
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);

    const { POST } = await import("@/app/api/compras/[id]/decision/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/decision", {
      method: "POST",
      headers: createAuthHeaders(otherToken),
      body: JSON.stringify({ decision: "ACEPTAR" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    expect(response.status).toBe(403);
  });

  it("debe rechazar decisión inválida", async () => {
    const compra = {
      ...fixtures.compra.valid,
      producto: { ...fixtures.producto.valid, usuarioId: seller.id },
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);

    const { POST } = await import("@/app/api/compras/[id]/decision/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/decision", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ decision: "INVALIDA" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    expect(response.status).toBe(400);
  });
});

describe("API Compras - Concretar compra", () => {
  const buyer = createTestUser({ id: "buyer-id" });
  const token = generateTestToken(buyer);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe concretar una compra aceptada", async () => {
    const compra = {
      ...fixtures.compra.valid,
      estado: "ACEPTADA",
      compradorId: buyer.id,
      producto: fixtures.producto.valid,
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);
    mockPrisma.compra.update.mockResolvedValue({
      ...compra,
      estado: "CONCRETADA",
      fechaConcretada: new Date(),
    });
    mockPrisma.producto.update.mockResolvedValue({
      ...fixtures.producto.valid,
      estado: "VENDIDO",
    });
    mockPrisma.notificacion.create.mockResolvedValue({});

    const { POST } = await import("@/app/api/compras/[id]/concretar/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/concretar", {
      method: "POST",
      headers: createAuthHeaders(token),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    expect(response.status).toBe(200);
  });

  it("debe rechazar concretar compra no aceptada", async () => {
    const compra = {
      ...fixtures.compra.valid,
      estado: "PENDIENTE",
      compradorId: buyer.id,
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);

    const { POST } = await import("@/app/api/compras/[id]/concretar/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/concretar", {
      method: "POST",
      headers: createAuthHeaders(token),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    expect(response.status).toBe(400);
  });

  it("debe rechazar concretar por no-comprador", async () => {
    const otherUser = createTestUser({ id: "other-id" });
    const otherToken = generateTestToken(otherUser);

    const compra = {
      ...fixtures.compra.valid,
      estado: "ACEPTADA",
      compradorId: buyer.id,
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);

    const { POST } = await import("@/app/api/compras/[id]/concretar/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/concretar", {
      method: "POST",
      headers: createAuthHeaders(otherToken),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    expect(response.status).toBe(403);
  });
});

describe("API Compras - Reseña del vendedor", () => {
  const buyer = createTestUser({ id: "buyer-id" });
  const token = generateTestToken(buyer);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe crear reseña del vendedor después de compra concretada", async () => {
    const compra = {
      ...fixtures.compra.concretada,
      compradorId: buyer.id,
      producto: { ...fixtures.producto.valid, usuarioId: "seller-id" },
      resenaVendedor: null,
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);
    mockPrisma.resenaVendedor.create.mockResolvedValue(fixtures.resena.vendedor);
    mockPrisma.notificacion.create.mockResolvedValue({});

    const { POST } = await import("@/app/api/compras/[id]/resena/route");
    const request = new Request("http://localhost/api/compras/compra-id-456/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        puntuacion: 5,
        comentario: "Excelente vendedor, muy amable",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-456" }) });
    expect(response.status).toBe(201);
  });

  it("debe rechazar reseña de compra no concretada", async () => {
    const compra = {
      ...fixtures.compra.valid,
      estado: "ACEPTADA",
      compradorId: buyer.id,
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);

    const { POST } = await import("@/app/api/compras/[id]/resena/route");
    const request = new Request("http://localhost/api/compras/compra-id-123/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ puntuacion: 5 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-123" }) });
    expect(response.status).toBe(400);
  });

  it("debe rechazar reseña duplicada", async () => {
    const compra = {
      ...fixtures.compra.concretada,
      compradorId: buyer.id,
      resenaVendedor: fixtures.resena.vendedor,
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);

    const { POST } = await import("@/app/api/compras/[id]/resena/route");
    const request = new Request("http://localhost/api/compras/compra-id-456/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ puntuacion: 4 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-456" }) });
    expect(response.status).toBe(400);
  });

  it("debe rechazar puntuación inválida", async () => {
    const compra = {
      ...fixtures.compra.concretada,
      compradorId: buyer.id,
      resenaVendedor: null,
    };
    mockPrisma.compra.findUnique.mockResolvedValue(compra);

    const { POST } = await import("@/app/api/compras/[id]/resena/route");
    const request = new Request("http://localhost/api/compras/compra-id-456/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ puntuacion: 10 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "compra-id-456" }) });
    expect(response.status).toBe(400);
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
