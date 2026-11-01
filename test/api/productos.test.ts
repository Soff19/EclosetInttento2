import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import { fixtures } from "../helpers/fixtures";

describe("API Productos - GET /api/productos", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe listar productos disponibles", async () => {
    const productos = [
      { ...fixtures.producto.valid, usuario: user },
      { ...fixtures.producto.valid, id: "prod-2", usuario: user },
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

  it("debe filtrar por estado DISPONIBLE por defecto", async () => {
    mockPrisma.producto.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos", {
      headers: createAuthHeaders(token),
    });

    await GET(request);

    expect(mockPrisma.producto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          estado: "DISPONIBLE",
        }),
      })
    );
  });

  it("debe permitir filtrar productos propios", async () => {
    mockPrisma.producto.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/productos/route");
    const request = new Request("http://localhost/api/productos?propios=true", {
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
});

describe("API Productos - POST /api/productos", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe crear un producto correctamente", async () => {
    mockPrisma.producto.create.mockResolvedValue(fixtures.producto.valid);

    const { POST } = await import("@/app/api/productos/route");

    const formData = new FormData();
    formData.append("titulo", "Vestido de fiesta");
    formData.append("descripcion", "Vestido negro elegante");
    formData.append("precio", "3500");
    formData.append("contacto", "whatsapp:1234567890");
    formData.append("urlImagen", "https://example.com/vestido.jpg");

    const request = new Request("http://localhost/api/productos", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.producto).toBeDefined();
  });

  it("debe rechazar producto sin título", async () => {
    const { POST } = await import("@/app/api/productos/route");

    const formData = new FormData();
    formData.append("descripcion", "Sin título");
    formData.append("precio", "1000");

    const request = new Request("http://localhost/api/productos", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("debe rechazar producto con precio negativo", async () => {
    const { POST } = await import("@/app/api/productos/route");

    const formData = new FormData();
    formData.append("titulo", "Producto");
    formData.append("descripcion", "Descripción");
    formData.append("precio", "-100");

    const request = new Request("http://localhost/api/productos", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe("API Productos - Favoritos", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
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
  const token = generateTestToken(buyer);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe crear solicitud de compra", async () => {
    const producto = { ...fixtures.producto.valid, usuarioId: "seller-id" };
    mockPrisma.producto.findUnique.mockResolvedValue(producto);
    mockPrisma.compra.findUnique.mockResolvedValue(null);
    mockPrisma.compra.create.mockResolvedValue({
      ...fixtures.compra.valid,
      compradorId: buyer.id,
    });
    mockPrisma.notificacion.create.mockResolvedValue({});

    const { POST } = await import("@/app/api/productos/[id]/comprar/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/comprar", {
      method: "POST",
      headers: createAuthHeaders(token),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(201);
  });

  it("debe rechazar comprar producto propio", async () => {
    const producto = { ...fixtures.producto.valid, usuarioId: buyer.id };
    mockPrisma.producto.findUnique.mockResolvedValue(producto);

    const { POST } = await import("@/app/api/productos/[id]/comprar/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/comprar", {
      method: "POST",
      headers: createAuthHeaders(token),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(400);
  });

  it("debe rechazar compra duplicada", async () => {
    const producto = { ...fixtures.producto.valid, usuarioId: "seller-id" };
    mockPrisma.producto.findUnique.mockResolvedValue(producto);
    mockPrisma.compra.findUnique.mockResolvedValue(fixtures.compra.valid);

    const { POST } = await import("@/app/api/productos/[id]/comprar/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/comprar", {
      method: "POST",
      headers: createAuthHeaders(token),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(400);
  });
});

describe("API Productos - Reseñas", () => {
  const user = createTestUser();
  const token = generateTestToken(user);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe crear una reseña con puntuación válida", async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(fixtures.producto.valid);
    mockPrisma.resenaProducto.findUnique.mockResolvedValue(null);
    mockPrisma.resenaProducto.create.mockResolvedValue(fixtures.resena.producto);

    const { POST } = await import("@/app/api/productos/[id]/resena/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        puntuacion: 5,
        comentario: "Excelente producto",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(201);
  });

  it("debe rechazar puntuación fuera de rango", async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(fixtures.producto.valid);

    const { POST } = await import("@/app/api/productos/[id]/resena/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        puntuacion: 6,
        comentario: "Puntuación inválida",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(400);
  });

  it("debe rechazar reseña duplicada", async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(fixtures.producto.valid);
    mockPrisma.resenaProducto.findUnique.mockResolvedValue(fixtures.resena.producto);

    const { POST } = await import("@/app/api/productos/[id]/resena/route");
    const request = new Request("http://localhost/api/productos/producto-id-123/resena", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({
        puntuacion: 4,
        comentario: "Segunda reseña",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "producto-id-123" }) });
    expect(response.status).toBe(400);
  });
});
