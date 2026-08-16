import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

async function requireUser(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await context.params;
  const prenda = await prisma.prenda.findFirst({ where: { id, usuarioId: user.id } });
  if (!prenda) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ prenda });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await context.params;
  const existing = await prisma.prenda.findFirst({ where: { id, usuarioId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const body = await request.json();
  const prenda = await prisma.prenda.update({
    where: { id },
    data: {
      nombre: body.nombre ?? existing.nombre,
      categoria: body.categoria ?? body.tipo ?? existing.categoria,
      color: body.color ?? existing.color,
      talle: body.talle ?? existing.talle,
      etiquetas:
        body.etiquetas !== undefined
          ? Array.isArray(body.etiquetas)
            ? JSON.stringify(body.etiquetas)
            : String(body.etiquetas)
          : existing.etiquetas,
      descripcion: body.descripcion ?? existing.descripcion,
      urlImagen: body.urlImagen ?? existing.urlImagen,
    },
  });
  return NextResponse.json({ prenda });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await context.params;
  const existing = await prisma.prenda.findFirst({ where: { id, usuarioId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  await prisma.prenda.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
