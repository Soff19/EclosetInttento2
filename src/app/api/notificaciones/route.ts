import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

function getUser(request: NextRequest) {
  const token = extractToken(request);
  return token ? verifyToken(token) : null;
}

export async function GET(request: NextRequest) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const requestedPage = Number(params.get("page") || "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedLimit = Number(params.get("limit") || "20");
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;

  try {
    const [items, noLeidas] = await Promise.all([
      prisma.notificacion.findMany({
        where: { destinatarioId: user.id },
        orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit + 1,
        include: {
          actor: { select: { id: true, nombre: true } },
          producto: { select: { id: true, titulo: true, imagen: true, contacto: true } },
        },
      }),
      prisma.notificacion.count({ where: { destinatarioId: user.id, leidaEn: null } }),
    ]);
    const hasMore = items.length > limit;
    return NextResponse.json({ items: items.slice(0, limit), noLeidas, page, hasMore });
  } catch (error: unknown) {
    console.error("Error al consultar notificaciones:", error);
    return NextResponse.json({ error: "No se pudieron cargar las notificaciones" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    await prisma.notificacion.updateMany({
      where: { destinatarioId: user.id, leidaEn: null },
      data: { leidaEn: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error al marcar notificaciones:", error);
    return NextResponse.json({ error: "No se pudieron actualizar las notificaciones" }, { status: 500 });
  }
}