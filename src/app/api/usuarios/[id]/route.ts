import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: sellerId } = await context.params;
  try {
    const token = extractToken(request);
    const currentUser = token ? verifyToken(token) : null;
    const [seller, reviews, aggregate, reviewablePurchases] = await Promise.all([
      prisma.usuario.findUnique({
        where: { id: sellerId },
        select: { id: true, nombre: true, fotoPerfil: true, fechaCreacion: true },
      }),
      prisma.resenaVendedor.findMany({
        where: { vendedorId: sellerId },
        orderBy: { creadoEn: "desc" },
        take: 50,
        select: {
          id: true,
          puntuacion: true,
          comentario: true,
          creadoEn: true,
          comprador: { select: { nombre: true } },
        },
      }),
      prisma.resenaVendedor.aggregate({
        where: { vendedorId: sellerId },
        _avg: { puntuacion: true },
        _count: { _all: true },
      }),
      currentUser && currentUser.id !== sellerId
        ? prisma.compra.findMany({
            where: {
              compradorId: currentUser.id,
              estado: "CONCRETADA",
              producto: { usuarioId: sellerId },
              resenaVendedor: null,
            },
            select: { id: true, producto: { select: { titulo: true } } },
            orderBy: { creadoEn: "desc" },
          })
        : Promise.resolve([]),
    ]);
    if (!seller) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

    return NextResponse.json({
      seller,
      average: aggregate._avg.puntuacion,
      reviewCount: aggregate._count._all,
      reviews,
      reviewablePurchases,
    });
  } catch (error: unknown) {
    const code = error instanceof Error && "code" in error && typeof error.code === "string"
      ? error.code
      : "INTERNAL_ERROR";
    console.error("Error al consultar perfil público.", { code });
    return NextResponse.json({ error: "No se pudo cargar el perfil" }, { status: 500 });
  }
}
