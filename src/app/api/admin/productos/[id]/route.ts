import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { motivosDecisionPrenda } from "@/lib/admin-moderation";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await context.params;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Datos de eliminación inválidos." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const motivo = payload.motivo;
    const explicacion = typeof payload.explicacion === "string" ? payload.explicacion.trim() : "";
    if (
      typeof motivo !== "string" ||
      !motivosDecisionPrenda.includes(motivo as (typeof motivosDecisionPrenda)[number]) ||
      explicacion.length < 15 ||
      explicacion.length > 300
    ) {
      return NextResponse.json({ error: "El motivo o la explicación no son válidos." }, { status: 400 });
    }

    const result = await prisma.producto.updateMany({
      where: { id, estado: "DISPONIBLE" },
      data: {
        estado: "ELIMINADA",
        motivoEliminacion: motivo,
        explicacionEliminacion: explicacion,
        fechaEliminacion: new Date(),
      },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "La publicación no existe o ya no está activa." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }
    console.error("Error al eliminar una publicación desde administración.", error);
    return NextResponse.json({ error: "No se pudo eliminar la publicación." }, { status: 500 });
  }
}
