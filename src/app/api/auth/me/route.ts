import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getUserById } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    if (!authenticatedUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const user = await getUserById(authenticatedUser.id);
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
