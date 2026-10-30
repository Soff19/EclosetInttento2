import nodemailer, { type Transporter } from "nodemailer";

const FROM_EMAIL = "eclosetasms@gmail.com";
const FROM_NAME = "EClOset";

type PurchaseRequestEmail = {
  recipientEmail: string;
  recipientName: string;
  buyerName: string;
  productTitle: string;
  productPrice: number;
};

type PurchaseDecisionEmail = {
  decision: "ACEPTADA" | "DENEGADA";
  recipientEmail: string;
  recipientName: string;
  sellerName: string;
  productTitle: string;
  contactHref: string | null;
  sellerProfileUrl: string;
  marketplaceUrl: string;
};

let transporter: Transporter | undefined;

function getTransporter() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const portValue = process.env.SMTP_PORT?.trim() || "587";
  const port = Number(portValue);
  const username = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase();

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT debe ser un puerto válido.");
  }
  if (!username || !password) {
    throw new Error("Faltan SMTP_USER o SMTP_PASSWORD para configurar el correo.");
  }
  if (secureValue && secureValue !== "true" && secureValue !== "false") {
    throw new Error("SMTP_SECURE debe ser true o false.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: secureValue ? secureValue === "true" : port === 465,
      auth: { user: username, pass: password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  return transporter;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function emailLayout(content: string) {
  return `
    <div style="background:#f9f5f0;padding:32px 16px;font-family:Arial,sans-serif;color:#2a2a26">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4de;border-radius:20px;overflow:hidden">
        <div style="padding:24px 28px;background:#2c3e2d;color:#f9f5f0;font-size:20px;letter-spacing:2px">EClOset</div>
        <div style="padding:30px 28px">${content}</div>
      </div>
    </div>
  `;
}

export async function sendPurchaseDecisionEmail({
  decision,
  recipientEmail,
  recipientName,
  sellerName,
  productTitle,
  contactHref,
  sellerProfileUrl,
  marketplaceUrl,
}: PurchaseDecisionEmail) {
  const safeRecipientName = escapeHtml(recipientName);
  const safeSellerName = escapeHtml(sellerName);
  const safeProductTitle = escapeHtml(productTitle);
  const safeProfileUrl = escapeHtml(sellerProfileUrl);
  const safeMarketplaceUrl = escapeHtml(marketplaceUrl);
  const safeContactHref = contactHref ? escapeHtml(contactHref) : null;
  const accepted = decision === "ACEPTADA";

  const subject = accepted
    ? "¡Tu solicitud de compra fue aceptada!"
    : "Actualización sobre tu solicitud de compra";
  const text = accepted
    ? [
      `Hola ${recipientName},`,
      "",
      `${sellerName} aceptó tu solicitud por "${productTitle}".`,
      ...(contactHref ? [`Podés comunicarte con el vendedor para coordinar: ${contactHref}`] : []),
      `Perfil del vendedor: ${sellerProfileUrl}`,
      "",
      "Cuando hayan concretado la compra, podés volver a EClOset, confirmarla y puntuar el servicio del vendedor. Tu opinión ayuda a otros usuarios y a quienes venden en EClOset.",
    ].join("\n")
    : [
      `Hola ${recipientName},`,
      "",
      `El vendedor no pudo aceptar tu solicitud por "${productTitle}".`,
      "Gracias por tu interés. Podés seguir explorando otras publicaciones disponibles en EClOset.",
      marketplaceUrl,
    ].join("\n");
  const content = accepted
    ? `
      <p style="margin:0 0 10px;color:#6b6b60">Hola ${safeRecipientName},</p>
      <h1 style="margin:0 0 18px;font-size:24px;font-weight:500">¡Solicitud aceptada!</h1>
      <p style="margin:0 0 20px;line-height:1.6"><strong>${safeSellerName}</strong> aceptó tu solicitud por <strong>“${safeProductTitle}”</strong>.</p>
      ${safeContactHref
        ? `<p style="margin:0 0 12px"><a href="${safeContactHref}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#2c3e2d;color:#fff;text-decoration:none">Contactar al vendedor</a></p>`
        : `<p style="margin:0 0 12px;color:#6b6b60">La publicación no tiene un enlace de contacto disponible. Podés visitar el perfil del vendedor.</p>`}
      <p style="margin:0 0 20px"><a href="${safeProfileUrl}" style="color:#2c3e2d">Ver perfil de ${safeSellerName}</a></p>
      <div style="padding:16px;border-radius:12px;background:#f9f5f0;line-height:1.6">
        Cuando hayan concretado la compra, volvé a EClOset para confirmarla. Después podés puntuar el servicio del vendedor; tu opinión ayuda a otros usuarios y a quienes venden en EClOset.
      </div>
    `
    : `
      <p style="margin:0 0 10px;color:#6b6b60">Hola ${safeRecipientName},</p>
      <h1 style="margin:0 0 18px;font-size:24px;font-weight:500">Actualización de tu solicitud</h1>
      <p style="margin:0 0 20px;line-height:1.6">El vendedor no pudo aceptar tu solicitud por <strong>“${safeProductTitle}”</strong>.</p>
      <p style="margin:0 0 24px;line-height:1.6;color:#6b6b60">Gracias por tu interés. Hay muchas otras prendas para descubrir en EClOset.</p>
      <a href="${safeMarketplaceUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#2c3e2d;color:#fff;text-decoration:none">Explorar publicaciones</a>
    `;

  await getTransporter().sendMail({
    from: { name: FROM_NAME, address: FROM_EMAIL },
    to: recipientEmail,
    subject,
    text,
    html: emailLayout(content),
  });
}

export async function sendPurchaseRequestEmail({
  recipientEmail,
  recipientName,
  buyerName,
  productTitle,
  productPrice,
}: PurchaseRequestEmail) {
  const safeRecipientName = escapeHtml(recipientName);
  const safeBuyerName = escapeHtml(buyerName);
  const safeProductTitle = escapeHtml(productTitle);
  const price = `ARS ${productPrice.toLocaleString("es-AR")}`;

  await getTransporter().sendMail({
    from: { name: FROM_NAME, address: FROM_EMAIL },
    to: recipientEmail,
    subject: "Nueva solicitud de compra en EClOset",
    text: [
      `Hola ${recipientName},`,
      "",
      `${buyerName} quiere comprar tu publicación "${productTitle}".`,
      `Precio publicado: ${price}.`,
      "",
      "Ingresá a EClOset para revisar la notificación y coordinar con la persona interesada.",
    ].join("\n"),
    html: `
      <div style="background:#f9f5f0;padding:32px 16px;font-family:Arial,sans-serif;color:#2a2a26">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4de;border-radius:20px;overflow:hidden">
          <div style="padding:24px 28px;background:#2c3e2d;color:#f9f5f0;font-size:20px;letter-spacing:2px">EClOset</div>
          <div style="padding:30px 28px">
            <p style="margin:0 0 10px;color:#6b6b60">Hola ${safeRecipientName},</p>
            <h1 style="margin:0 0 18px;font-size:24px;font-weight:500">Nueva solicitud de compra</h1>
            <p style="margin:0 0 20px;line-height:1.6"><strong>${safeBuyerName}</strong> quiere comprar tu publicación.</p>
            <div style="padding:16px;border-radius:12px;background:#f9f5f0">
              <p style="margin:0 0 8px;font-size:16px"><strong>${safeProductTitle}</strong></p>
              <p style="margin:0;color:#6b6b60">Precio publicado: ${price}</p>
            </div>
            <p style="margin:22px 0 0;line-height:1.6;color:#6b6b60">Ingresá a EClOset para revisar la notificación y coordinar con la persona interesada.</p>
          </div>
        </div>
      </div>
    `,
  });
}
