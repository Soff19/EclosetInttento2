import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "../setup";
import { createTestUser, generateTestToken } from "../helpers/auth";

const buyer = createTestUser({ id: "buyer-id" });
const token = generateTestToken(buyer);
const purchase = {
  id: "purchase-1",
  compradorId: buyer.id,
  estado: "ACEPTADA",
  producto: { id: "product-1", titulo: "Campera", usuarioId: "seller-id" },
};

function request() {
  return new NextRequest("http://localhost/api/compras/purchase-1/concretar", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe("POST /api/compras/[id]/concretar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.usuario.findUnique.mockResolvedValue(buyer);
    mockPrisma.compra.findUnique.mockResolvedValue(purchase);
    mockPrisma.compra.updateMany.mockResolvedValue({ count: 1 });
  });

  async function complete() {
    const { POST } = await import("@/app/api/compras/[id]/concretar/route");
    return POST(request(), { params: Promise.resolve({ id: purchase.id }) });
  }

  it("confirma la compra y crea la notificación para quien vende", async () => {
    const result = await complete();

    expect(result.status).toBe(200);
    expect(mockPrisma.compra.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: purchase.id, compradorId: buyer.id, estado: "ACEPTADA" },
      data: expect.objectContaining({ estado: "CONCRETADA", fechaConcretada: expect.any(Date) }),
    }));
    expect(mockPrisma.notificacion.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        destinatarioId: "seller-id",
        mensaje: expect.stringContaining(buyer.nombre),
      }),
    }));
  });

  it.each([
    [null, 404],
    [{ ...purchase, compradorId: "someone-else" }, 403],
    [{ ...purchase, estado: "PENDIENTE" }, 409],
  ])("rechaza una solicitud que no puede concretarse", async (row, status) => {
    mockPrisma.compra.findUnique.mockResolvedValue(row);
    expect((await complete()).status).toBe(status);
  });

  it("maneja conflictos concurrentes y errores internos", async () => {
    mockPrisma.compra.updateMany.mockResolvedValue({ count: 0 });
    expect((await complete()).status).toBe(409);

    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.compra.findUnique.mockRejectedValue(new Error("database down"));
    expect((await complete()).status).toBe(500);
    error.mockRestore();
  });
});
