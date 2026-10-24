import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = extractToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await context.params;
  try {
    const result = await prisma.notificacion.updateMany({
      where: { id, destinatarioId: user.id, leidaEn: null },
      data: { leidaEn: new Date() },
    });
    if (result.count === 0) {
      const notification = await prisma.notificacion.findFirst({
        where: { id, destinatarioId: user.id },
        select: { id: true },
      });
      if (!notification) {
        return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error al marcar notificación:", error);
    return NextResponse.json({ error: "No se pudo actualizar la notificación" }, { status: 500 });
  }
}