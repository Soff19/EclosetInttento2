import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  generateToken,
  verifyToken,
  extractToken,
} from "@/lib/auth";
import { createTestUser, generateTestToken, generateExpiredToken } from "../helpers/auth";

describe("Auth - generateToken", () => {
  it("debe generar un token JWT válido", () => {
    const user = createTestUser();
    const token = generateToken(user);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("el token debe contener los datos del usuario", () => {
    const user = createTestUser({ nombre: "María García" });
    const token = generateToken(user);
    const decoded = jwt.decode(token) as { id: string; email: string; nombre: string };

    expect(decoded.id).toBe(user.id);
    expect(decoded.email).toBe(user.email);
    expect(decoded.nombre).toBe("María García");
  });
});

describe("Auth - verifyToken", () => {
  it("debe verificar un token válido y retornar el usuario", () => {
    const user = createTestUser();
    const token = generateTestToken(user);
    const result = verifyToken(token);

    expect(result).toBeDefined();
    expect(result?.id).toBe(user.id);
    expect(result?.email).toBe(user.email);
  });

  it("debe retornar null para un token inválido", () => {
    const result = verifyToken("invalid-token");
    expect(result).toBeNull();
  });

  it("debe retornar null para un token expirado", () => {
    const user = createTestUser();
    const expiredToken = generateExpiredToken(user);
    const result = verifyToken(expiredToken);
    expect(result).toBeNull();
  });

  it("debe retornar null para un token con firma incorrecta", () => {
    const fakeToken = jwt.sign({ id: "test" }, "wrong-secret");
    const result = verifyToken(fakeToken);
    expect(result).toBeNull();
  });
});

describe("Auth - extractToken", () => {
  it("debe extraer token de la cookie de sesión", () => {
    const token = "valid-token-123";
    const request = new Request("http://localhost/api/test", {
      headers: { Cookie: `token=${token}` },
    });

    const result = extractToken(request);
    expect(result).toBe(token);
  });

  it("debe ignorar el header Bearer para evitar sesiones contradictorias", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer token-anterior" },
    });

    expect(extractToken(request)).toBeNull();
  });

  it("debe retornar null si no hay cookie de sesión", () => {
    const request = new Request("http://localhost/api/test");
    const result = extractToken(request);
    expect(result).toBeNull();
  });
});

describe("Auth - Password Hashing", () => {
  it("bcrypt debe hashear correctamente una contraseña", async () => {
    const password = "miContraseñaSegura123";
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("bcrypt debe comparar correctamente una contraseña válida", async () => {
    const password = "miContraseñaSegura123";
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("bcrypt debe rechazar una contraseña incorrecta", async () => {
    const password = "miContraseñaSegura123";
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare("otraContraseña", hash);
    expect(isValid).toBe(false);
  });
});
