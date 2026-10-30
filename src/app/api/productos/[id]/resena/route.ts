import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";
import { createMarketplaceNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = extractToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Iniciá sesión para dejar una reseña" }, { status: 401 });
  const { id: productoId } = await context.params;
  const { puntuacion, comentario } = await request.json();
  const score = Number(puntuacion);
  if (!Number.isInteger(score) || score < 1 || score > 5) return NextResponse.json({ error: "La puntuación debe ser de 1 a 5" }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: productoId },
        select: { id: true, usuarioId: true, titulo: true },
      });
      if (!producto) return { error: "Publicación no encontrada", status: 404 as const };

      const actor = await tx.usuario.findUnique({
        where: { id: user.id },
        select: { nombre: true, email: true },
      });
      if (!actor) return { error: "No autorizado", status: 401 as const };

      const reviewKey = { usuarioId_productoId: { usuarioId: user.id, productoId } };
      const existing = await tx.resenaProducto.findUnique({ where: reviewKey, select: { id: true } });
      const resena = await tx.resenaProducto.upsert({
        where: reviewKey,
        create: { usuarioId: user.id, productoId, puntuacion: score, comentario: comentario || null },
        update: { puntuacion: score, comentario: comentario || null },
      });
      if (!existing && producto.usuarioId !== user.id) {
        const actorName = actor.nombre?.trim() || actor.email.split("@")[0];
        await createMarketplaceNotification(tx, {
          recipientId: producto.usuarioId,
          actorId: user.id,
          productId: producto.id,
          type: "RESENA_PRODUCTO",
          message: `${actorName} dejó una reseña de ${score} ${score === 1 ? "estrella" : "estrellas"} en "${producto.titulo}".`,
        });
      }
      return { resena };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ resena: result.resena }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error al guardar la reseña:", error);
    return NextResponse.json({ error: "No se pudo guardar la reseña" }, { status: 500 });
  }
}