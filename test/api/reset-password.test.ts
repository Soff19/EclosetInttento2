import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest as Request } from "next/server";
import { mockPrisma } from "../setup";
import { createTestUser } from "../helpers/auth";

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function submit(body: unknown) {
    const { POST } = await import("@/app/api/auth/reset-password/route");
    return POST(new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
  }

  it("valida los campos y las reglas de contraseña", async () => {
    expect((await submit({ email: "", password: "secret1", confirmPassword: "secret1" })).status)
      .toBe(400);
    mockPrisma.usuario.findUnique.mockResolvedValue(createTestUser());
    expect((await submit({
      email: "USER@example.com",
      password: "123",
      confirmPassword: "123",
    })).status).toBe(400);
    expect((await submit({
      email: "USER@example.com",
      password: "secret1",
      confirmPassword: "different",
    })).status).toBe(400);
  });

  it("responde 404 para cuentas inexistentes o vinculadas a Google", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);
    expect((await submit({
      email: "user@example.com",
      password: "secret1",
      confirmPassword: "secret1",
    })).status).toBe(404);

    mockPrisma.usuario.findUnique.mockResolvedValue(createTestUser({ password: "GOOGLE_AUTH" }));
    expect((await submit({
      email: "user@example.com",
      password: "secret1",
      confirmPassword: "secret1",
    })).status).toBe(404);
  });

  it("actualiza la contraseña después de normalizar el correo", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(createTestUser());
    const result = await submit({
      email: "  USER@EXAMPLE.COM ",
      password: "secret1",
      confirmPassword: "secret1",
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
    expect(mockPrisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "test-user-id-123" },
      data: { password: expect.any(String) },
    }));
  });
});
