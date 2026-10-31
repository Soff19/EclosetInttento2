import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, updateUserProfile } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request);
    if (!decoded) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
