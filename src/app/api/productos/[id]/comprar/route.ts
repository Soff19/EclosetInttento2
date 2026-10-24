import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = extractToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Iniciá sesión para comprar" }, { status: 401 });
  const { id: productoId } = await context.params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({ where: { id: productoId } });
      if (!producto) return { error: "Publicación no encontrada", status: 404 as const };
      if (producto.usuarioId === user.id) {
        return { error: "No podés comprar tu propia publicación", status: 400 as const };
      }

      const existing = await tx.compra.findUnique({
        where: { compradorId_productoId: { compradorId: user.id, productoId } },
      });
      if (existing) {
        const existingNotification = await tx.notificacion.findFirst({
          where: {
            destinatarioId: producto.usuarioId,
            actorId: user.id,
            productoId,
            tipo: "SOLICITUD_COMPRA",
          },
          select: { id: true },
        });
        if (!existingNotification) {
          await tx.notificacion.create({
            data: {
              destinatarioId: producto.usuarioId,
              actorId: user.id,
              productoId,
              tipo: "SOLICITUD_COMPRA",
              mensaje: "Una persona quiere comprar tu publicación.",
            },
          });
        }
        return { compra: existing, created: false };
      }
      if (producto.estado !== "DISPONIBLE") {
        return { error: "Producto no disponible", status: 409 as const };
      }

      const reservation = await tx.producto.updateMany({
        where: { id: productoId, estado: "DISPONIBLE" },
        data: { estado: "RESERVADO" },
      });
      if (reservation.count !== 1) {
        return { error: "Producto no disponible", status: 409 as const };
      }

      const compra = await tx.compra.create({
        data: { compradorId: user.id, productoId },
      });
      await tx.notificacion.create({
        data: {
          destinatarioId: producto.usuarioId,
          actorId: user.id,
          productoId,
          tipo: "SOLICITUD_COMPRA",
          mensaje: "Una persona quiere comprar tu publicación.",
        },
      });

      return { compra, created: true };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error: unknown) {
    console.error("Error al registrar solicitud de compra:", error);
    return NextResponse.json({ error: "No se pudo registrar la solicitud" }, { status: 500 });
  }
}