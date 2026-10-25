import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const auth = verifyToken(token);
    if (!auth) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const body = await request.json();
    // Guardamos las preferencias en JSON y marcamos perfil como completado
    const updated = await prisma.usuario.update({
      where: { id: auth.id },
      data: { preferencias: body, perfilCompletado: true },
      select: { id: true, preferencias: true, perfilCompletado: true },
    });

    return NextResponse.json({ success: true, preferences: updated.preferencias });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const auth = verifyToken(token);
    if (!auth) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const user = await prisma.usuario.findUnique({ where: { id: auth.id }, select: { preferencias: true, perfilCompletado: true } });
    return NextResponse.json({ success: true, preferences: user?.preferencias ?? null, perfilCompletado: user?.perfilCompletado ?? false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
