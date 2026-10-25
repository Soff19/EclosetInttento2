import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

async function requireUser(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get("mes") || String(new Date().getMonth() + 1));
    const anio = parseInt(searchParams.get("anio") || String(new Date().getFullYear()));

    // Crear rango de fechas para el mes completo
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0, 23, 59, 59);

    const eventos = await prisma.eventoCalendario.findMany({
      where: {
        usuarioId: user.id,
        fecha: {
          gte: inicio,
          lte: fin,
        },
      },
      include: {
        outfit: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fecha: "asc" },
    });

    return NextResponse.json({ eventos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
