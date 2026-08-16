import { NextRequest, NextResponse } from "next/server";
import { extractToken, updateUserProfile, verifyToken } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded?.id) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const body = await request.json();
    const user = await updateUserProfile(decoded.id, {
      nombre: body.nombre,
      fotoPerfil: body.fotoPerfil,
    });
    return NextResponse.json({ user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
