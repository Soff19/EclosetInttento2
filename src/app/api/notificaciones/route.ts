import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

function getUser(request: NextRequest) {
  return getAuthenticatedUser(request);
}

type NotificationRow = {
  id: string;
  tipo: string;
  mensaje: string;
  leidaEn: Date | null;
  creadoEn: Date;
  actorId: string | null;
  actorNombre: string | null;
  productoId: string | null;
  productoTitulo: string | null;
  productoImagen: string | null;
  productoContacto: string | null;
  compraId: string | null;
  compraEstado: string | null;
};

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const requestedPage = Number(params.get("page") || "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedLimit = Number(params.get("limit") || "20");
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;

  try {
    const [rows, noLeidas] = await Promise.all([
      prisma.$queryRaw<NotificationRow[]>`
        SELECT
          n.id,
          n.tipo,
          n.mensaje,
          n.leidaEn,
          n.creadoEn,
          a.id AS actorId,
          a.nombre AS actorNombre,
          p.id AS productoId,
          p.titulo AS productoTitulo,
          p.imagen AS productoImagen,
          p.contacto AS productoContacto,
          CASE
            WHEN n.tipo = 'SOLICITUD_COMPRA' THEN sellerCompra.id
            ELSE buyerCompra.id
          END AS compraId,
          CASE
            WHEN n.tipo = 'SOLICITUD_COMPRA' THEN sellerCompra.estado
            ELSE buyerCompra.estado
          END AS compraEstado
        FROM Notificacion n
        LEFT JOIN Usuario a ON a.id = n.actorId
        LEFT JOIN Producto p ON p.id = n.productoId
        LEFT JOIN Compra sellerCompra
          ON n.tipo = 'SOLICITUD_COMPRA'
          AND sellerCompra.compradorId = n.actorId
          AND sellerCompra.productoId = n.productoId
          AND p.usuarioId = n.destinatarioId
        LEFT JOIN Compra buyerCompra
          ON n.tipo IN (
            'SOLICITUD_COMPRA_ACEPTADA',
            'SOLICITUD_COMPRA_DENEGADA',
            'COMPRA_CONCRETADA'
          )
          AND buyerCompra.compradorId = n.destinatarioId
          AND buyerCompra.productoId = n.productoId
          AND p.usuarioId = n.actorId
        WHERE n.destinatarioId = ${user.id}
        ORDER BY n.creadoEn DESC, n.id DESC
        LIMIT ${limit + 1}
        OFFSET ${(page - 1) * limit}
      `,
      prisma.notificacion.count({ where: { destinatarioId: user.id, leidaEn: null } }),
    ]);
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map((row) => ({
      id: row.id,
      tipo: row.tipo,
      mensaje: row.mensaje,
      leidaEn: row.leidaEn,
      creadoEn: row.creadoEn,
      actor: row.actorId ? { id: row.actorId, nombre: row.actorNombre } : null,
      producto: row.productoId
        ? {
            id: row.productoId,
            titulo: row.productoTitulo,
            imagen: row.productoImagen,
            contacto: row.productoContacto,
          }
        : null,
      compra: row.compraId && row.compraEstado
        ? { id: row.compraId, estado: row.compraEstado }
        : null,
    }));
    return NextResponse.json(
      { items, noLeidas, page, hasMore },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error: unknown) {
    console.error("Error al consultar notificaciones:", error);
    return NextResponse.json({ error: "No se pudieron cargar las notificaciones" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    await prisma.notificacion.updateMany({
      where: { destinatarioId: user.id, leidaEn: null },
      data: { leidaEn: new Date() },
    });
    const noLeidas = await prisma.notificacion.count({
      where: { destinatarioId: user.id, leidaEn: null },
    });
    return NextResponse.json({ success: true, noLeidas });
  } catch (error: unknown) {
    console.error("Error al marcar notificaciones:", error);
    return NextResponse.json({ error: "No se pudieron actualizar las notificaciones" }, { status: 500 });
  }
}