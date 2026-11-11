import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";
import {
  clearGoogleOAuthStateCookie,
  generateToken,
  getAuthBaseUrl,
  GOOGLE_STATE_COOKIE_NAME,
  setAuthCookie,
} from "@/lib/auth";

function mismoEstado(esperado: string, recibido: string) {
  const esperadoBuffer = Buffer.from(esperado);
  const recibidoBuffer = Buffer.from(recibido);
  return esperadoBuffer.length === recibidoBuffer.length &&
    timingSafeEqual(esperadoBuffer, recibidoBuffer);
}

function redirigirConError(base: string, error: string) {
  const response = NextResponse.redirect(new URL(`/?error=${error}`, base));
  clearGoogleOAuthStateCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  let base: string;
  try {
    base = getAuthBaseUrl(request);
  } catch {
    return NextResponse.json(
      { error: "NEXTAUTH_URL debe ser una URL HTTP o HTTPS válida." },
      { status: 503 },
    );
  }

  const estadoEsperado = request.cookies.get(GOOGLE_STATE_COOKIE_NAME)?.value;
  const estadoRecibido = request.nextUrl.searchParams.get("state");
  if (!estadoEsperado || !estadoRecibido || !mismoEstado(estadoEsperado, estadoRecibido)) {
    return redirigirConError(base, "google_state_invalid");
  }

  if (request.nextUrl.searchParams.has("error")) {
    return redirigirConError(base, "google_access_denied");
  }

  const code = request.nextUrl.searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) {
    return redirigirConError(base, "google_auth_failed");
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${base}/api/auth/google/callback`,
    );
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.id_token) return redirigirConError(base, "google_auth_failed");

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const identidad = ticket.getPayload();
    if (!identidad?.sub || !identidad.email || identidad.email_verified !== true) {
      return redirigirConError(base, "google_email_unverified");
    }

    let user = await prisma.usuario.findUnique({
      where: { googleId: identidad.sub },
    });
    if (!user) {
      const usuarioPorEmail = await prisma.usuario.findUnique({
        where: { email: identidad.email },
      });
      if (usuarioPorEmail) {
        if (usuarioPorEmail.googleId) {
          return redirigirConError(base, "google_account_conflict");
        }
        user = await prisma.usuario.update({
          where: { id: usuarioPorEmail.id },
          data: {
            googleId: identidad.sub,
            fotoPerfil: usuarioPorEmail.fotoPerfil || identidad.picture || null,
            nombre: usuarioPorEmail.nombre || identidad.name || null,
          },
        });
      } else {
        user = await prisma.usuario.create({
          data: {
            email: identidad.email,
            googleId: identidad.sub,
            nombre: identidad.name || identidad.email.split("@")[0],
            password: "GOOGLE_AUTH",
            fotoPerfil: identidad.picture || null,
          },
        });
      }
    }

    if (user.estado !== "ACTIVA") {
      return redirigirConError(base, "account_suspended");
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      fotoPerfil: user.fotoPerfil,
    });
    const destino = user.rol === "ADMIN"
      ? "/admin"
      : user.perfilCompletado
        ? "/home"
        : "/onboarding";
    const response = NextResponse.redirect(new URL(destino, base));
    setAuthCookie(response, token);
    clearGoogleOAuthStateCookie(response);
    return response;
  } catch (error) {
    console.error(
      "Google OAuth callback failed:",
      error instanceof Error ? error.name : "unknown error",
    );
    return redirigirConError(base, "google_auth_failed");
  }
}
