import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

async function requireUser(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { fecha, outfitId } = await request.json();

    if (!fecha || !outfitId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: fecha, outfitId" },
        { status: 400 }
      );
    }

    // Verificar que el outfit pertenece al usuario
    const outfit = await prisma.outfit.findFirst({
      where: { id: outfitId, usuarioId: user.id },
    });

    if (!outfit) {
      return NextResponse.json({ error: "Outfit no encontrado" }, { status: 404 });
    }

    const evento = await prisma.eventoCalendario.create({
      data: {
        usuarioId: user.id,
        fecha: new Date(fecha),
        tipo: "outfit",
        outfitId,
      },
      include: {
        outfit: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({ evento }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
