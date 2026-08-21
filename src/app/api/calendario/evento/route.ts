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

    const { fecha, titulo } = await request.json();

    if (!fecha || !titulo) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: fecha, titulo" },
        { status: 400 }
      );
    }

    const evento = await prisma.eventoCalendario.create({
      data: {
        usuarioId: user.id,
        fecha: new Date(fecha),
        tipo: "evento",
        titulo,
      },
    });

    return NextResponse.json({ evento }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
