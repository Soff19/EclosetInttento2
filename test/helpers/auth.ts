import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing";

export interface TestUser {
  id: string;
  email: string;
  nombre: string;
  rol?: string;
  estado?: string;
  perfilCompletado?: boolean;
  password?: string;
}

export function createTestUser(overrides: Partial<TestUser & { fechaCreacion: Date }> = {}): TestUser & { fechaCreacion: Date } {
  return {
    id: "test-user-id-123",
    email: "test@example.com",
    nombre: "Test User",
    rol: "USUARIA",
    estado: "ACTIVA",
    perfilCompletado: true,
    password: "$2a$10$hashedpassword",
    fechaCreacion: new Date(),
    ...overrides,
  };
}

export function createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({
    id: "admin-user-id-456",
    email: "admin@example.com",
    nombre: "Admin User",
    rol: "ADMIN",
    ...overrides,
  });
}

export function generateTestToken(user: Partial<TestUser>): string {
  return jwt.sign(
    {
      id: user.id || "test-user-id-123",
      email: user.email || "test@example.com",
      nombre: user.nombre || "Test User",
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export function generateExpiredToken(user: Partial<TestUser>): string {
  return jwt.sign(
    {
      id: user.id || "test-user-id-123",
      email: user.email || "test@example.com",
      nombre: user.nombre || "Test User",
    },
    JWT_SECRET,
    { expiresIn: "-1h" }
  );
}

export function createAuthHeaders(token: string): Headers {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  return headers;
}
