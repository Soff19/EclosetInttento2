import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

async function requireUser(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Verificar que el evento pertenece al usuario
    const evento = await prisma.eventoCalendario.findFirst({
      where: { id, usuarioId: user.id },
    });

    if (!evento) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    await prisma.eventoCalendario.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
