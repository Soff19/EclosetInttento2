import type { Prisma } from "@prisma/client";

type MarketplaceNotification = {
  recipientId: string;
  actorId: string;
  productId: string;
  type:
    | "SOLICITUD_COMPRA"
    | "SOLICITUD_COMPRA_ACEPTADA"
    | "SOLICITUD_COMPRA_DENEGADA"
    | "COMPRA_CONCRETADA"
    | "FAVORITO_PRODUCTO"
    | "RESENA_PRODUCTO";
  message: string;
};

export function createMarketplaceNotification(
  transaction: Pick<Prisma.TransactionClient, "notificacion">,
  notification: MarketplaceNotification,
) {
  return transaction.notificacion.upsert({
    where: {
      destinatarioId_actorId_productoId_tipo: {
        destinatarioId: notification.recipientId,
        actorId: notification.actorId,
        productoId: notification.productId,
        tipo: notification.type,
      },
    },
    create: {
      destinatarioId: notification.recipientId,
      actorId: notification.actorId,
      productoId: notification.productId,
      tipo: notification.type,
      mensaje: Array.from(notification.message).slice(0, 255).join(""),
    },
    update: {},
  });
}
