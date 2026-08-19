import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = extractToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id: productoId } = await context.params;
  const existing = await prisma.favoritoProducto.findUnique({ where: { usuarioId_productoId: { usuarioId: user.id, productoId } } });
  if (existing) {
    await prisma.favoritoProducto.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorito: false });
  }
  await prisma.favoritoProducto.create({ data: { usuarioId: user.id, productoId } });
  return NextResponse.json({ favorito: true });
}