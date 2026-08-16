import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: { estado: "DISPONIBLE" },
      orderBy: { fechaInicio: "desc" },
      take: 50,
    });
    return NextResponse.json({ productos });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { titulo, descripcion, precio, estado } = await request.json();
    if (!titulo || precio == null) {
      return NextResponse.json({ error: "titulo y precio son obligatorios" }, { status: 400 });
    }
    const producto = await prisma.producto.create({
      data: {
        titulo,
        descripcion: descripcion || "",
        precio: Number(precio),
        estado: estado || "DISPONIBLE",
        usuarioId: user.id,
      },
    });
    return NextResponse.json({ producto }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
