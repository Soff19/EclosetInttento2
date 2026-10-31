import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { getContactHref } from "@/lib/contact";
import { sendPurchaseDecisionEmail } from "@/lib/mailer";

type Decision = "ACEPTADA" | "DENEGADA";

type LockedProduct = {
  id: string;
  estado: string;
  usuarioId: string;
  tieneCompraAceptada: number | boolean;
};

class DecisionConflict extends Error {}

function fitNotificationMessage(message: string) {
  return Array.from(message).slice(0, 255).join("");
}

function getMailErrorDetails(error: unknown) {
  const code = error instanceof Error && "code" in error && typeof error.code === "string"
    ? error.code
    : "SMTP_ERROR";
  const responseCode = error instanceof Error && "responseCode" in error
    && typeof error.responseCode === "number"
    ? error.responseCode
    : undefined;
  return {
    code,
    ...(responseCode ? { responseCode } : {}),
    ...(code === "EAUTH"
      ? { hint: "Gmail rechazó la autenticación; verificá SMTP_USER y una contraseña de aplicación vigente." }
      : {}),
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: compraId } = await context.params;
  let decision: Decision;
  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("decision" in body) ||
      (body.decision !== "ACEPTADA" && body.decision !== "DENEGADA")
    ) {
      return NextResponse.json({ error: "La decisión debe ser ACEPTADA o DENEGADA" }, { status: 400 });
    }
    decision = body.decision;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  try {
    const requestRecord = await prisma.compra.findUnique({
      where: { id: compraId },
      select: {
        id: true,
        compradorId: true,
        productoId: true,
        estado: true,
        comprador: { select: { nombre: true, email: true } },
        producto: {
          select: {
            id: true,
            titulo: true,
            usuarioId: true,
            contacto: true,
            usuario: { select: { nombre: true } },
          },
        },
      },
    });
    if (!requestRecord) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    if (requestRecord.producto.usuarioId !== user.id) {
      return NextResponse.json({ error: "No tenés permiso para decidir esta solicitud" }, { status: 403 });
    }
    if (requestRecord.estado !== "PENDIENTE") {
      return NextResponse.json({ error: "Esta solicitud ya fue resuelta" }, { status: 409 });
    }

    const sellerName = requestRecord.producto.usuario.nombre?.trim() || "El vendedor";
    const buyerName = requestRecord.comprador.nombre?.trim()
      || requestRecord.comprador.email.split("@")[0]
      || "Un usuario";
    const productTitle = requestRecord.producto.titulo;
    const buyerNotificationType = decision === "ACEPTADA"
      ? "SOLICITUD_COMPRA_ACEPTADA"
      : "SOLICITUD_COMPRA_DENEGADA";
    const sellerMessage = decision === "ACEPTADA"
      ? `Aceptaste la solicitud de ${buyerName} por "${productTitle}".`
      : `Denegaste la solicitud de ${buyerName} por "${productTitle}".`;
    const buyerMessage = decision === "ACEPTADA"
      ? `${sellerName} aceptó tu solicitud por "${productTitle}". Coordiná el encuentro y confirmá la compra cuando se concrete.`
      : `${sellerName} no pudo aceptar tu solicitud por "${productTitle}". Podés seguir explorando otras publicaciones.`;

    const result = await prisma.$transaction(async (tx) => {
      const lockedProducts = await tx.$queryRaw<LockedProduct[]>`
        SELECT
          p.id,
          p.estado,
          p.usuarioId,
          EXISTS (
            SELECT 1
            FROM Compra c
            WHERE c.productoId = p.id
              AND c.estado IN ('ACEPTADA', 'CONCRETADA')
          ) AS tieneCompraAceptada
        FROM Producto p
        WHERE p.id = ${requestRecord.productoId}
        FOR UPDATE
      `;
      const lockedProduct = lockedProducts[0];
      if (!lockedProduct || lockedProduct.usuarioId !== user.id) {
        return { error: "La publicación ya no está disponible", status: 409 as const };
      }

      const hasAcceptedPurchase = Boolean(Number(lockedProduct.tieneCompraAceptada));
      if (decision === "ACEPTADA") {
        if (hasAcceptedPurchase) {
          return { error: "La publicación ya tiene una solicitud aceptada", status: 409 as const };
        }
        if (!["DISPONIBLE", "RESERVADO"].includes(lockedProduct.estado)) {
          return { error: "La publicación no puede aceptar solicitudes", status: 409 as const };
        }
      }

      const changed = await tx.$executeRaw`
        UPDATE Compra c
        INNER JOIN Producto p ON p.id = c.productoId
        SET
          c.estado = ${decision},
          p.estado = CASE
            WHEN ${decision} = 'ACEPTADA' AND p.estado = 'DISPONIBLE' THEN 'RESERVADO'
            WHEN ${decision} = 'DENEGADA'
              AND p.estado = 'RESERVADO'
              AND ${hasAcceptedPurchase ? 1 : 0} = 0
              THEN 'DISPONIBLE'
            ELSE p.estado
          END
        WHERE c.id = ${compraId}
          AND c.productoId = ${requestRecord.productoId}
          AND c.estado = 'PENDIENTE'
          AND p.usuarioId = ${user.id}
          AND (
            ${decision} = 'DENEGADA'
            OR p.estado IN ('DISPONIBLE', 'RESERVADO')
          )
      `;
      if (changed === 0) throw new DecisionConflict();

      await tx.$executeRaw`
        INSERT INTO Notificacion (
          id, destinatarioId, actorId, productoId, tipo, mensaje, leidaEn, creadoEn
        )
        VALUES
          (
            ${randomUUID()},
            ${user.id},
            ${requestRecord.compradorId},
            ${requestRecord.productoId},
            'SOLICITUD_COMPRA',
            ${fitNotificationMessage(sellerMessage)},
            NOW(3),
            NOW(3)
          ),
          (
            ${randomUUID()},
            ${requestRecord.compradorId},
            ${user.id},
            ${requestRecord.productoId},
            ${buyerNotificationType},
            ${fitNotificationMessage(buyerMessage)},
            NULL,
            NOW(3)
          )
        ON DUPLICATE KEY UPDATE
          mensaje = VALUES(mensaje),
          leidaEn = CASE
            WHEN tipo = 'SOLICITUD_COMPRA' THEN VALUES(leidaEn)
            ELSE leidaEn
          END
      `;

      return { success: true as const };
    }, { maxWait: 5_000, timeout: 10_000 });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    let emailSent = false;
    try {
      const appUrl = new URL(process.env.NEXTAUTH_URL || "http://localhost:3000");
      await sendPurchaseDecisionEmail({
        decision,
        recipientEmail: requestRecord.comprador.email,
        recipientName: buyerName,
        sellerName,
        productTitle,
        contactHref: getContactHref(requestRecord.producto.contacto),
        sellerProfileUrl: new URL(`/perfil/${user.id}`, appUrl).toString(),
        marketplaceUrl: new URL("/productos", appUrl).toString(),
      });
      emailSent = true;
    } catch (error: unknown) {
      console.error("No se pudo enviar el correo de decisión de compra.", getMailErrorDetails(error));
    }

    return NextResponse.json(
      { success: true, decision, emailSent },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof DecisionConflict) {
      return NextResponse.json({ error: "La publicación o solicitud cambió; actualizá y volvé a intentar." }, { status: 409 });
    }
    const code = error instanceof Error && "code" in error && typeof error.code === "string"
      ? error.code
      : "INTERNAL_ERROR";
    console.error("Error al procesar decisión de compra.", { code });
    return NextResponse.json({ error: "No se pudo procesar la decisión" }, { status: 500 });
  }
}
