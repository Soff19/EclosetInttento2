import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = extractToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Iniciá sesión para dejar una reseña" }, { status: 401 });
  const { id: productoId } = await context.params;
  const { puntuacion, comentario } = await request.json();
  const score = Number(puntuacion);
  if (!Number.isInteger(score) || score < 1 || score > 5) return NextResponse.json({ error: "La puntuación debe ser de 1 a 5" }, { status: 400 });
  const resena = await prisma.resenaProducto.upsert({ where: { usuarioId_productoId: { usuarioId: user.id, productoId } }, create: { usuarioId: user.id, productoId, puntuacion: score, comentario: comentario || null }, update: { puntuacion: score, comentario: comentario || null } });
  return NextResponse.json({ resena }, { status: 201 });
}