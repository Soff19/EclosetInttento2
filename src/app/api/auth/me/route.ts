import { NextRequest, NextResponse } from "next/server";
import { extractToken, getUserById, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded?.id) return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    const user = await getUserById(decoded.id);
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
