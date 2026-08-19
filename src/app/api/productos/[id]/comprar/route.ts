import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = extractToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Iniciá sesión para comprar" }, { status: 401 });
  const { id: productoId } = await context.params;
  const producto = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!producto || producto.estado !== "DISPONIBLE") return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
  if (producto.usuarioId === user.id) return NextResponse.json({ error: "No podés comprar tu propia publicación" }, { status: 400 });
  const compra = await prisma.compra.upsert({ where: { compradorId_productoId: { compradorId: user.id, productoId } }, create: { compradorId: user.id, productoId }, update: {} });
  await prisma.producto.update({ where: { id: productoId }, data: { estado: "RESERVADO" } });
  return NextResponse.json({ compra }, { status: 201 });
}