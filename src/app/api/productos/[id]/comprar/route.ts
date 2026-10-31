import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { createMarketplaceNotification } from "@/lib/notifications";
import { sendPurchaseRequestEmail } from "@/lib/mailer";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Iniciá sesión para comprar" }, { status: 401 });
  const buyerId = user.id;
  const { id: productoId } = await context.params;

  try {
    const [comprador, producto, existingPurchase] = await Promise.all([
      prisma.usuario.findUnique({
        where: { id: buyerId },
        select: { id: true, nombre: true, email: true },
      }),
      prisma.producto.findUnique({
        where: { id: productoId },
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
      }),
      prisma.compra.findUnique({
        where: { compradorId_productoId: { compradorId: buyerId, productoId } },
      }),
    ]);

    if (!comprador) return NextResponse.json({ error: "Iniciá sesión para comprar" }, { status: 401 });
    if (!producto) return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    if (producto.usuarioId === buyerId) {
      return NextResponse.json({ error: "No podés comprar tu propia publicación" }, { status: 400 });
    }

    const buyerName = comprador.nombre?.trim() || comprador.email.split("@")[0];
    const notification = {
      recipientId: producto.usuarioId,
      actorId: buyerId,
      productId: productoId,
      type: "SOLICITUD_COMPRA" as const,
      message: `${buyerName} quiere comprar "${producto.titulo}".`,
    };

    if (existingPurchase) {
      await createMarketplaceNotification(prisma, notification);
      return NextResponse.json(
        { compra: existingPurchase, created: false, emailSent: null },
        { status: 200 },
      );
    }
    if (producto.estado !== "DISPONIBLE") {
      return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
    }

    const purchaseResult = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM Producto WHERE id = ${productoId} FOR UPDATE`;
      const currentProduct = await tx.producto.findUnique({
        where: { id: productoId },
        select: { estado: true, usuarioId: true },
      });
      if (
        !currentProduct ||
        currentProduct.usuarioId !== producto.usuarioId ||
        currentProduct.estado !== "DISPONIBLE"
      ) {
        return { available: false as const };
      }

      const compra = await tx.compra.create({
        data: { compradorId: buyerId, productoId },
      });
      await createMarketplaceNotification(tx, notification);
      return { available: true as const, compra };
    }, { maxWait: 5_000, timeout: 10_000 });

    if (!purchaseResult.available) {
      const existing = await prisma.compra.findUnique({
        where: { compradorId_productoId: { compradorId: buyerId, productoId } },
      });
      if (existing) {
        await createMarketplaceNotification(prisma, notification);
        return NextResponse.json(
          { compra: existing, created: false, emailSent: null },
          { status: 200 },
        );
      }
      return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
    }

    try {
      await sendPurchaseRequestEmail({
        recipientEmail: producto.usuario.email,
        recipientName: producto.usuario.nombre?.trim() || "allí",
        buyerName,
        productTitle: producto.titulo,
        productPrice: producto.precio,
      });
      return NextResponse.json(
        { compra: purchaseResult.compra, created: true, emailSent: true },
        { status: 201 },
      );
    } catch (error: unknown) {
      const code = error instanceof Error && "code" in error && typeof error.code === "string"
        ? error.code
        : "SMTP_ERROR";
      console.error("No se pudo enviar el correo de la solicitud de compra.", { code });
      return NextResponse.json(
        { compra: purchaseResult.compra, created: true, emailSent: false },
        { status: 201 },
      );
    }
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const existing = await prisma.compra.findUnique({
        where: { compradorId_productoId: { compradorId: buyerId, productoId } },
      });
      if (existing) {
        return NextResponse.json(
          { compra: existing, created: false, emailSent: null },
          { status: 200 },
        );
      }
    }

    const code = error instanceof Error && "code" in error && typeof error.code === "string"
      ? error.code
      : "INTERNAL_ERROR";
    console.error("Error al registrar solicitud de compra.", { code });
    return NextResponse.json({ error: "No se pudo registrar la solicitud" }, { status: 500 });
  }
}
