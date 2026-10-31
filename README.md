This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Correo de solicitudes de compra

El envío se realiza desde el servidor mediante Nodemailer. Configurá estas variables en `.env.local` (este archivo está excluido de Git):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=eclosetasms@gmail.com
SMTP_PASSWORD=<contraseña-de-aplicación-de-Google>
```

`SMTP_HOST` y `SMTP_PORT` tienen valores predeterminados compatibles con Gmail. El remitente es `eclosetasms@gmail.com`; no se configura desde el navegador. Para Gmail, usá una contraseña de aplicación y no la contraseña habitual de la cuenta. No agregues credenciales a variables `NEXT_PUBLIC_*`.

La solicitud de compra y la notificación interna se confirman primero en la base de datos. Un fallo SMTP no revierte la operación; la API devuelve el resultado del correo para que la interfaz informe al comprador. Los reintentos de una solicitud ya registrada no vuelven a enviar el correo.

Cuando el vendedor acepta o deniega una solicitud, la decisión y las notificaciones internas se guardan antes de enviar el correo correspondiente al comprador. Un fallo SMTP no revierte la decisión y no se reenvía el correo al repetir una decisión ya resuelta.

El vendedor solo reserva la publicación al aceptar una solicitud. El comprador puede confirmar que concretó la operación y, después, dejar una puntuación opcional del vendedor desde su perfil público. Las migraciones aditivas de puntuaciones y del índice para el contador de avisos no leídos se aplican con `npm run db:deploy`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
