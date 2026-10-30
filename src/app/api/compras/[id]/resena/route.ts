import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = extractToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Iniciá sesión para puntuar al vendedor" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("puntuacion" in body)) {
    return NextResponse.json({ error: "La puntuación es obligatoria" }, { status: 400 });
  }

  const puntuacion = Number(body.puntuacion);
  const comentario = "comentario" in body ? body.comentario : undefined;
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    return NextResponse.json({ error: "La puntuación debe ser de 1 a 5" }, { status: 400 });
  }
  if (comentario !== undefined && comentario !== null && typeof comentario !== "string") {
    return NextResponse.json({ error: "El comentario debe ser texto" }, { status: 400 });
  }
  if (typeof comentario === "string" && comentario.length > 2000) {
    return NextResponse.json({ error: "El comentario no puede superar los 2000 caracteres" }, { status: 400 });
  }

  const { id: compraId } = await context.params;
  try {
    const compra = await prisma.compra.findUnique({
      where: { id: compraId },
      select: {
        compradorId: true,
        estado: true,
        comprador: { select: { nombre: true, email: true } },
        producto: { select: { id: true, usuarioId: true } },
      },
    });
    if (!compra) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    if (compra.compradorId !== user.id) {
      return NextResponse.json({ error: "No tenés permiso para puntuar esta compra" }, { status: 403 });
    }
    if (compra.producto.usuarioId === user.id) {
      return NextResponse.json({ error: "No podés puntuarte a vos mismo" }, { status: 409 });
    }
    if (compra.estado !== "CONCRETADA") {
      return NextResponse.json({ error: "Podés puntuar después de confirmar que concretaste la compra" }, { status: 409 });
    }

    const reviewerName = compra.comprador.nombre?.trim()
      || compra.comprador.email.split("@")[0];
    const notificationMessage = Array.from(
      `${reviewerName} te puntuó con ${puntuacion} ${puntuacion === 1 ? "estrella" : "estrellas"} como vendedor.`,
    ).slice(0, 255).join("");
    const [review] = await prisma.$transaction([
      prisma.resenaVendedor.create({
        data: {
          compraId,
          compradorId: user.id,
          vendedorId: compra.producto.usuarioId,
          puntuacion,
          comentario: typeof comentario === "string" && comentario.trim() ? comentario.trim() : null,
        },
      }),
      prisma.notificacion.upsert({
        where: {
          destinatarioId_actorId_productoId_tipo: {
            destinatarioId: compra.producto.usuarioId,
            actorId: user.id,
            productoId: compra.producto.id,
            tipo: "RESENA_VENDEDOR",
          },
        },
        create: {
          destinatarioId: compra.producto.usuarioId,
          actorId: user.id,
          productoId: compra.producto.id,
          tipo: "RESENA_VENDEDOR",
          mensaje: notificationMessage,
        },
        update: {},
      }),
    ]);

    return NextResponse.json({ resena: review }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Ya enviaste una puntuación para esta compra" }, { status: 409 });
    }
    const code = error instanceof Error && "code" in error && typeof error.code === "string"
      ? error.code
      : "INTERNAL_ERROR";
    console.error("Error al guardar puntuación del vendedor.", { code });
    return NextResponse.json({ error: "No se pudo guardar la puntuación" }, { status: 500 });
  }
}
