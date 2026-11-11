import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const AUTH_COOKIE_NAME = "token";
export const GOOGLE_STATE_COOKIE_NAME = "google_oauth_state";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export type AuthUser = {
  id: string;
  email: string;
  nombre: string | null;
  fotoPerfil?: string | null;
  rol?: string;
  estado?: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está configurado.");
  return secret;
}

export function generateToken(user: AuthUser) {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(
    { id: user.id, email: user.email, nombre: user.nombre },
    getJwtSecret(),
    options
  );
}

export function verifyToken(token: string): AuthUser | null {
  const secret = getJwtSecret();
  try {
    return jwt.verify(token, secret) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearAuthCookies(response: NextResponse) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
  response.cookies.set(AUTH_COOKIE_NAME, "", cookieOptions);
  clearGoogleOAuthStateCookie(response);
}

export function clearGoogleOAuthStateCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/api/auth/google",
  });
}

export function getAuthBaseUrl(request: Request) {
  const configuredUrl = process.env.NEXTAUTH_URL?.trim();
  const url = new URL(configuredUrl || new URL(request.url).origin);
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password
  ) {
    throw new Error("NEXTAUTH_URL debe ser una URL HTTP o HTTPS válida.");
  }
  return url.origin;
}

export async function getAuthenticatedUser(request: NextRequest | Request) {
  const token = extractToken(request);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded?.id) return null;

  const user = await prisma.usuario.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, nombre: true, fotoPerfil: true, rol: true, estado: true },
  });
  return user?.estado === "ACTIVA" ? user : null;
}

export async function getAdminUser(request: NextRequest | Request) {
  const user = await getAuthenticatedUser(request);
  return user?.rol === "ADMIN" ? user : null;
}

export function extractToken(request: NextRequest | Request) {
  if ("cookies" in request && typeof (request as NextRequest).cookies?.get === "function") {
    const cookieToken = (request as NextRequest).cookies.get(AUTH_COOKIE_NAME)?.value;
    if (cookieToken) return cookieToken;
  }
  const cookie = request.headers.get("cookie");
  const tokenCookie = cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (!tokenCookie) return null;
  return tokenCookie.slice(AUTH_COOKIE_NAME.length + 1);
}

export async function registerUser(data: { email: string; password: string; nombre?: string }) {
  const existing = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("El email ya está registrado");
  const hashed = await bcrypt.hash(data.password, 10);
  return prisma.usuario.create({
    data: {
      email: data.email,
      password: hashed,
      nombre: data.nombre || data.email.split("@")[0],
    },
    select: { id: true, email: true, nombre: true, fotoPerfil: true, fechaCreacion: true },
  });
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) throw new Error("Credenciales incorrectas");
  if (user.password === "GOOGLE_AUTH") {
    throw new Error("Esta cuenta usa Google. Continuá con Google.");
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("Credenciales incorrectas");
  if (user.estado !== "ACTIVA") throw new Error("Cuenta suspendida");
  const { password: storedPassword, googleId, ...rest } = user;
  void storedPassword;
  void googleId;
  return rest;
}

export async function resetUserPassword(
  email: string,
  password: string,
  confirmPassword: string
) {
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }
  if (password !== confirmPassword) {
    throw new Error("Las contraseñas no coinciden");
  }

  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) throw new Error("No encontramos una cuenta con ese email");
  if (user.password === "GOOGLE_AUTH") {
    throw new Error("Esta cuenta usa Google. Continuá con Google.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.usuario.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
}

export async function getUserById(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nombre: true,
      perfilCompletado: true,
      preferencias: true,
      fotoPerfil: true,
      fechaCreacion: true,
      rol: true,
      estado: true,
      _count: { select: { prendas: true, outfits: true, productos: true } },
    },
  });
}

export async function updateUserProfile(
  id: string,
  data: { nombre?: string; fotoPerfil?: string | null }
) {
  return prisma.usuario.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.fotoPerfil !== undefined ? { fotoPerfil: data.fotoPerfil } : {}),
    },
    select: { id: true, email: true, nombre: true, fotoPerfil: true, fechaCreacion: true },
  });
}
