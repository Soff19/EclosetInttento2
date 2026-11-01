import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Outfits - GET /api/outfits", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe listar los outfits del usuario", async () => {
    const outfits = [
      { ...fixtures.outfit.valid, outfitPrendas: [] },
      { ...fixtures.outfit.valid, id: "outfit-2", outfitPrendas: [] },
    ];
    mockPrisma.outfit.findMany.mockResolvedValue(outfits);

    const { GET } = await import("@/app/api/outfits/route");
    const request = new Request("http://localhost/api/outfits", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.outfits).toHaveLength(2);
  });

  it("debe incluir las prendas de cada outfit", async () => {
    const outfitWithPrendas = {
      ...fixtures.outfit.valid,
      outfitPrendas: [
        { id: "op-1", prenda: fixtures.prenda.valid },
        { id: "op-2", prenda: { ...fixtures.prenda.valid, id: "prenda-2" } },
      ],
    };
    mockPrisma.outfit.findMany.mockResolvedValue([outfitWithPrendas]);

    const { GET } = await import("@/app/api/outfits/route");
    const request = new Request("http://localhost/api/outfits", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.outfits[0].outfitPrendas).toHaveLength(2);
  });

  it("debe rechazar sin autenticación", async () => {
    const { GET } = await import("@/app/api/outfits/route");
    const request = new Request("http://localhost/api/outfits");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("API Outfits - POST /api/outfits", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe crear un outfit con prendas", async () => {
    const newOutfit = { ...fixtures.outfit.valid, outfitPrendas: [{ id: "op-1", prenda: fixtures.prenda.valid }] };
    mockPrisma.prenda.count.mockResolvedValue(2);
    mockPrisma.outfit.create.mockResolvedValue(newOutfit);

    const { POST } = await import("@/app/api/outfits/route");
    const request = new Request("http://localhost/api/outfits", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        nombre: "Mi outfit casual",
        categoria: "CASUAL",
        prendas_ids: ["prenda-1", "prenda-2"],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.outfit).toBeDefined();
  });

  it("debe rechazar outfit sin nombre", async () => {
    const { POST } = await import("@/app/api/outfits/route");
    const request = new Request("http://localhost/api/outfits", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        categoria: "CASUAL",
        prendas_ids: ["prenda-1"],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("debe crear outfit sin prendas", async () => {
    const newOutfit = { ...fixtures.outfit.valid, outfitPrendas: [] };
    mockPrisma.outfit.create.mockResolvedValue(newOutfit);

    const { POST } = await import("@/app/api/outfits/route");
    const request = new Request("http://localhost/api/outfits", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        nombre: "Outfit vacío",
        prendas_ids: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});

describe("API Outfits - DELETE /api/outfits/[id]", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe eliminar un outfit propio", async () => {
    mockPrisma.outfit.findFirst.mockResolvedValue({ id: "outfit-id-123" });
    mockPrisma.outfit.delete.mockResolvedValue(fixtures.outfit.valid);

    const { DELETE } = await import("@/app/api/outfits/[id]/route");
    const request = new Request("http://localhost/api/outfits/outfit-id-123", {
      method: "DELETE",
      headers: createAuthHeaders(token),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "outfit-id-123" }) });
    expect(response.status).toBe(200);
  });

  it("debe rechazar eliminar outfit de otro usuario", async () => {
    mockPrisma.outfit.findFirst.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/outfits/[id]/route");
    const request = new Request("http://localhost/api/outfits/outfit-id-123", {
      method: "DELETE",
      headers: createAuthHeaders(token),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "outfit-id-123" }) });
    expect(response.status).toBe(404);
  });
});
