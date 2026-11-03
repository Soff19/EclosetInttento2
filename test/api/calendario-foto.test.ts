import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken } from "../helpers/auth";

const user = createTestUser({ id: "calendar-user" });
const token = generateTestToken(user);

describe("POST /api/calendario/foto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(user);
    mockPrisma.eventoCalendario.create.mockResolvedValue({ id: "photo-event" });
  });

  async function submit(body: unknown, authenticated = true) {
    const { POST } = await import("@/app/api/calendario/foto/route");
    return POST(new NextRequest("http://localhost/api/calendario/foto", {
      method: "POST",
      headers: authenticated ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(body),
    }));
  }

  it("requiere autenticación y los datos de imagen", async () => {
    expect((await submit({}, false)).status).toBe(401);
    expect((await submit({ fecha: "2026-11-02" })).status).toBe(400);
  });

  it("crea el evento con propietario, fecha y URL", async () => {
    const result = await submit({ fecha: "2026-11-02", urlImagen: "https://example.com/a.jpg" });

    expect(result.status).toBe(201);
    expect(mockPrisma.eventoCalendario.create).toHaveBeenCalledWith({
      data: {
        usuarioId: user.id,
        fecha: new Date("2026-11-02"),
        tipo: "foto",
        urlImagen: "https://example.com/a.jpg",
      },
    });
  });

  it("responde 500 si el JSON o el almacenamiento fallan", async () => {
    const { POST } = await import("@/app/api/calendario/foto/route");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(new NextRequest("http://localhost/api/calendario/foto", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: "{",
    }))).status).toBe(500);

    mockPrisma.eventoCalendario.create.mockRejectedValue(new Error("database down"));
    expect((await submit({ fecha: "2026-11-02", urlImagen: "https://example.com/a.jpg" })).status)
      .toBe(500);
    error.mockRestore();
  });
});
