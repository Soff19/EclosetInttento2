import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

async function requireUser(request: NextRequest) {
  const token = extractToken(request);
  return token ? verifyToken(token) : null;
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value.map(String).map((tag) => tag.trim().toLowerCase()).filter(Boolean));
  if (typeof value !== "string") return null;
  return JSON.stringify(value.split(",").map((tag) => tag.trim().toLowerCase().replace(/^#/, "")).filter(Boolean));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const etiqueta = searchParams.get("etiqueta")?.trim().toLowerCase();
    const productId = searchParams.get("id")?.trim();
    const soloMios = searchParams.get("mias") === "true";
    const token = extractToken(request);
    const user = token ? verifyToken(token) : null;
    if (soloMios && !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const productos = await prisma.producto.findMany({
      where: {
        ...(productId
          ? { id: productId }
          : !soloMios
            ? { estado: searchParams.get("estado") || "DISPONIBLE" }
            : {}),
        ...(soloMios && user ? { usuarioId: user.id } : {}),
        ...(query ? { OR: [{ titulo: { contains: query } }, { descripcion: { contains: query } }, { etiquetas: { contains: query } }] } : {}),
        ...(etiqueta ? { etiquetas: { contains: etiqueta } } : {}),
      },
      orderBy: { fechaInicio: "desc" },
      ...(!soloMios ? { take: 50 } : {}),
      include: {
        usuario: { select: { id: true, nombre: true, fotoPerfil: true, email: true } },
        favoritos: { select: { usuarioId: true } },
        resenas: { include: { usuario: { select: { nombre: true, email: true } } }, orderBy: { creadoEn: "desc" } },
        compras: user
          ? { where: { compradorId: user.id }, select: { estado: true }, take: 1 }
          : false,
      },
    });
    return NextResponse.json({
    productos: productos.map(({ favoritos, resenas, compras, ...producto }) => ({
      ...producto,
      etiquetas: producto.etiquetas ? JSON.parse(producto.etiquetas) : [],
      favorito: user ? favoritos.some((item) => item.usuarioId === user.id) : false,
      solicitudEstado: compras[0]?.estado || null,
        esPropio: user?.id === producto.usuarioId,
        promedio: resenas.length ? resenas.reduce((sum, item) => sum + item.puntuacion, 0) / resenas.length : null,
        cantidadResenas: resenas.length,
        resenas,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { titulo, descripcion, precio, estado, imagen, etiquetas, contacto } = await request.json();
    if (!titulo || precio == null) {
      return NextResponse.json({ error: "titulo y precio son obligatorios" }, { status: 400 });
    }
    const producto = await prisma.producto.create({
      data: {
        titulo,
        descripcion: descripcion || "",
        precio: Number(precio),
        estado: estado || "DISPONIBLE",
        imagen: imagen || null,
        etiquetas: parseTags(etiquetas),
        contacto: contacto || null,
        usuarioId: user.id,
      },
    });
    return NextResponse.json({ producto }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
 