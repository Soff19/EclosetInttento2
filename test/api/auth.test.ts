import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken, createAuthHeaders } from "../helpers/auth";
import bcrypt from "bcryptjs";

describe("API Auth - POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe registrar un nuevo usuario correctamente", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);
    mockPrisma.usuario.create.mockResolvedValue({
      id: "new-user-id",
      email: "nuevo@example.com",
      nombre: "nuevo",
      fotoPerfil: null,
      fechaCreacion: new Date(),
    });

    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nuevo@example.com",
        password: "password123",
        confirmPassword: "password123",
        nombre: "Nuevo Usuario",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.token).toBeDefined();
  });

  it("debe rechazar registro con email duplicado", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(createTestUser());

    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("debe rechazar registro sin campos obligatorios", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe("API Auth - POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe hacer login correctamente con credenciales válidas", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = createTestUser({ password: hashedPassword });

    mockPrisma.usuario.findUnique.mockResolvedValue(user);

    const { POST } = await import("@/app/api/auth/login/route");
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
  });

  it("debe rechazar login con contraseña incorrecta", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    mockPrisma.usuario.findUnique.mockResolvedValue(
      createTestUser({ password: hashedPassword })
    );

    const { POST } = await import("@/app/api/auth/login/route");
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("debe rechazar login de usuario inexistente", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/login/route");
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "noexiste@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("debe indicar redirección a onboarding si perfil no completado", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = createTestUser({
      password: hashedPassword,
      perfilCompletado: false,
    });

    mockPrisma.usuario.findUnique.mockResolvedValue(user);

    const { POST } = await import("@/app/api/auth/login/route");
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.redirectTo).toBe("/onboarding");
  });

  it("debe rechazar cuenta de Google con login normal", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(
      createTestUser({ password: "GOOGLE_AUTH" })
    );

    const { POST } = await import("@/app/api/auth/login/route");
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "google@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

describe("API Auth - GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar datos del usuario autenticado", async () => {
    const user = createTestUser();
    const token = generateTestToken(user);

    mockPrisma.usuario.findUnique.mockResolvedValue({
      ...user,
      _count: { prendas: 5, outfits: 2, productos: 1 },
    });

    const { GET } = await import("@/app/api/auth/me/route");
    const request = new Request("http://localhost/api/auth/me", {
      headers: createAuthHeaders(token),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(user.email);
  });

  it("debe rechazar petición sin token", async () => {
    const { GET } = await import("@/app/api/auth/me/route");
    const request = new Request("http://localhost/api/auth/me");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("debe rechazar token inválido", async () => {
    const { GET } = await import("@/app/api/auth/me/route");
    const request = new Request("http://localhost/api/auth/me", {
      headers: { Authorization: "Bearer invalid-token" },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("API Auth - POST /api/auth/logout", () => {
  it("debe hacer logout limpiando la cookie", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const request = new Request("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("token=");
    expect(setCookie).toContain("Max-Age=0");
  });
});
