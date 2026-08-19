import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const token = extractToken(request);
  return token ? verifyToken(token) : null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nombre: true, fotoPerfil: true, email: true } },
      resenas: { include: { usuario: { select: { nombre: true } } }, orderBy: { creadoEn: "desc" } },
    },
  });
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json({ producto: { ...producto, etiquetas: producto.etiquetas ? JSON.parse(producto.etiquetas) : [] } });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await context.params;
  const existing = await prisma.producto.findFirst({ where: { id, usuarioId: user.id } });
  if (!existing) return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  const body = await request.json();
  const producto = await prisma.producto.update({
    where: { id },
    data: {
      titulo: body.titulo ?? existing.titulo,
      descripcion: body.descripcion ?? existing.descripcion,
      precio: body.precio !== undefined ? Number(body.precio) : existing.precio,
      estado: body.estado ?? existing.estado,
      imagen: body.imagen ?? existing.imagen,
      etiquetas: body.etiquetas !== undefined ? JSON.stringify(body.etiquetas) : existing.etiquetas,
      contacto: body.contacto ?? existing.contacto,
    },
  });
  return NextResponse.json({ producto });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await context.params;
  const deleted = await prisma.producto.deleteMany({ where: { id, usuarioId: user.id } });
  if (!deleted.count) return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  return NextResponse.json({ success: true });
}