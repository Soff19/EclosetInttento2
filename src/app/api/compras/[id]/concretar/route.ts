import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

class PurchaseCompletionConflict extends Error {}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: compraId } = await context.params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const compra = await tx.compra.findUnique({
        where: { id: compraId },
        include: {
          producto: { select: { id: true, titulo: true, usuarioId: true } },
        },
      });
      if (!compra) return { error: "Solicitud no encontrada", status: 404 as const };
      if (compra.compradorId !== user.id) {
        return { error: "No tenés permiso para confirmar esta compra", status: 403 as const };
      }
      if (compra.estado !== "ACEPTADA") {
        return { error: "Solo se pueden confirmar solicitudes aceptadas", status: 409 as const };
      }

      const changed = await tx.compra.updateMany({
        where: { id: compraId, compradorId: user.id, estado: "ACEPTADA" },
        data: { estado: "CONCRETADA", fechaConcretada: new Date() },
      });
      if (changed.count !== 1) throw new PurchaseCompletionConflict();

      const buyerName = await tx.usuario.findUnique({
        where: { id: user.id },
        select: { nombre: true, email: true },
      });
      const name = buyerName?.nombre?.trim() || buyerName?.email.split("@")[0] || "El comprador";
      await tx.notificacion.upsert({
        where: {
          destinatarioId_actorId_productoId_tipo: {
            destinatarioId: compra.producto.usuarioId,
            actorId: user.id,
            productoId: compra.producto.id,
            tipo: "COMPRA_CONCRETADA",
          },
        },
        create: {
          destinatarioId: compra.producto.usuarioId,
          actorId: user.id,
          productoId: compra.producto.id,
          tipo: "COMPRA_CONCRETADA",
          mensaje: `${name} confirmó que concretó la compra de "${compra.producto.titulo}".`,
        },
        update: {},
      });

      return { success: true };
    }, { maxWait: 5_000, timeout: 10_000 });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof PurchaseCompletionConflict) {
      return NextResponse.json({ error: "La solicitud ya fue actualizada. Recargá las notificaciones." }, { status: 409 });
    }
    const code = error instanceof Error && "code" in error && typeof error.code === "string"
      ? error.code
      : "INTERNAL_ERROR";
    console.error("Error al confirmar compra concretada.", { code });
    return NextResponse.json({ error: "No se pudo confirmar la compra" }, { status: 500 });
  }
}
