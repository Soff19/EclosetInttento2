import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";
import { createMarketplaceNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = extractToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id: productoId } = await context.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: productoId },
        select: { id: true, usuarioId: true, titulo: true },
      });
      if (!producto) return { error: "Publicación no encontrada", status: 404 as const };

      const existing = await tx.favoritoProducto.findUnique({
        where: { usuarioId_productoId: { usuarioId: user.id, productoId } },
      });
      if (existing) {
        await tx.favoritoProducto.delete({ where: { id: existing.id } });
        return { favorito: false };
      }

      const actor = await tx.usuario.findUnique({
        where: { id: user.id },
        select: { nombre: true, email: true },
      });
      if (!actor) return { error: "No autorizado", status: 401 as const };

      await tx.favoritoProducto.create({ data: { usuarioId: user.id, productoId } });
      if (producto.usuarioId !== user.id) {
        const actorName = actor.nombre?.trim() || actor.email.split("@")[0];
        await createMarketplaceNotification(tx, {
          recipientId: producto.usuarioId,
          actorId: user.id,
          productId: producto.id,
          type: "FAVORITO_PRODUCTO",
          message: `${actorName} guardó "${producto.titulo}" en favoritos.`,
        });
      }
      return { favorito: true };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ favorito: result.favorito });
  } catch (error: unknown) {
    console.error("Error al actualizar favorito:", error);
    return NextResponse.json({ error: "No se pudo actualizar el favorito" }, { status: 500 });
  }
}