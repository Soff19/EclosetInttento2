import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await context.params;
  try {
    const outfit = await prisma.outfit.findFirst({
      where: { id, usuarioId: user.id },
      select: { id: true },
    });
    if (!outfit) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.outfit.delete({ where: { id: outfit.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el outfit" }, { status: 500 });
  }
}
