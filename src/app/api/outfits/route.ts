import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

async function requireUser(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const outfits = await prisma.outfit.findMany({
      where: { usuarioId: user.id },
      include: { outfitPrendas: { include: { prenda: true } } },
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ outfits });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { nombre, categoria, descripcion, prendas_ids } = await request.json();
    if (!nombre) {
      return NextResponse.json({ error: "El nombre del outfit es obligatorio" }, { status: 400 });
    }

    const ids: string[] = Array.isArray(prendas_ids) ? prendas_ids : [];
    if (ids.length) {
      const owned = await prisma.prenda.count({
        where: { usuarioId: user.id, id: { in: ids } },
      });
      if (owned !== ids.length) {
        return NextResponse.json({ error: "Algunas prendas no pertenecen al usuario" }, { status: 400 });
      }
    }

    const outfit = await prisma.outfit.create({
      data: {
        nombre,
        categoria: categoria || null,
        descripcion: descripcion || null,
        usuarioId: user.id,
        outfitPrendas: ids.length
          ? { create: ids.map((prendaId: string) => ({ prendaId })) }
          : undefined,
      },
      include: { outfitPrendas: { include: { prenda: true } } },
    });

    return NextResponse.json({ outfit }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
