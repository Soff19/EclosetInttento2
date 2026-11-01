import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Productos - GET /api/productos", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe listar productos disponibles", async () => {
    const productos = [
      { ...fixtures.producto.valid, usuario: user, favoritos: [], resenas: [], compras: [] },
      { ...fixtures.producto.valid, id: "prod-2", usuario: user, favoritos: [], resenas: [], compras: [] },
    ];
    mockPrisma.producto.findMany.mockResolvedValue(productos);

    const { GET } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.productos).toHaveLength(2);
  });

  it("debe permitir filtrar productos propios", async () => {
    mockPrisma.producto.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos?mias=true", {
      headers: createAuthHeaders(token),
    });

    await GET(request);

    expect(mockPrisma.producto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usuarioId: user.id,
        }),
      })
    );
  });

  it("debe rechazar mias=true sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos?mias=true");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("API Productos - POST /api/productos", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe crear un producto correctamente", async () => {
    mockPrisma.producto.create.mockResolvedValue(fixtures.producto.valid);

    const { POST } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        titulo: "Vestido de fiesta",
        descripcion: "Vestido negro elegante",
        precio: 3500,
        contacto: "whatsapp:1234567890",
        imagen: "https://example.com/vestido.jpg",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.producto).toBeDefined();
  });

  it("debe rechazar producto sin título", async () => {
    const { POST } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        descripcion: "Sin título",
        precio: 1000,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("debe rechazar producto sin precio", async () => {
    const { POST } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        titulo: "Producto",
        descripcion: "Descripción",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: "Producto",
        precio: 1000,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

describe("API Productos - Favoritos", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
  });

  it("debe agregar producto a favoritos", async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(fixtures.producto.valid);
    mockPrisma.favoritoProducto.findUnique.mockResolvedValue(null);
    mockPrisma.favoritoProducto.create.mockResolvedValue({
      id: "fav-1",
      usuarioId: user.id,
      productoId: fixtures.producto.valid.id,
      creadoEn: new Date(),
    });
    mockPrisma.notificacion.create.mockResolvedValue({});

    const { POST } = await import("@/app/api/productos/[id]/favorito/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/favorito", {
      method: "POST",
      headers: createAuthHeaders(token),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.favorito).toBe(true);
  });

  it("debe quitar producto de favoritos si ya está", async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(fixtures.producto.valid);
    mockPrisma.favoritoProducto.findUnique.mockResolvedValue({
      id: "fav-1",
      usuarioId: user.id,
      productoId: fixtures.producto.valid.id,
    });
    mockPrisma.favoritoProducto.delete.mockResolvedValue({});

    const { POST } = await import("@/app/api/productos/[id]/favorito/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/favorito", {
      method: "POST",
      headers: createAuthHeaders(token),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.favorito).toBe(false);
  });
});

describe("API Productos - Comprar", () => {
  const buyer = createTestUser({ id: "buyer-id", email: "buyer@example.com" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/productos/[id]/comprar/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/comprar", {
      method: "POST",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(401);
  });

  it("debe retornar 404 para producto inexistente", async () => {
    const token = generateTestToken(buyer);
    mockPrisma.usuario.findUnique.mockResolvedValue(buyer);
    mockPrisma.producto.findUnique.mockResolvedValue(null);
    mockPrisma.compra.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/productos/[id]/comprar/route");
    const request = new Request("http://localhost/api/productos/no-existe/comprar", {
      method: "POST",
      headers: createAuthHeaders(token),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "no-existe" }) });
    expect(response.status).toBe(404);
  });
});

describe("API Productos - Reseñas", () => {
  const user = createTestUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar sin autenticación", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/productos/[id]/resena/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/resena", {
      method: "POST",
      body: JSON.stringify({ puntuacion: 5 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(401);
  });

  it("debe retornar 404 para producto inexistente", async () => {
    const token = generateTestToken(user);
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
    mockPrisma.producto.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/productos/[id]/resena/route");
    const request = new Request("http://localhost/api/productos/no-existe/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ puntuacion: 5 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "no-existe" }) });
    expect(response.status).toBe(404);
  });
});
