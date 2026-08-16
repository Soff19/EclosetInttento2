import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "mi_secreto_temporal";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export type AuthUser = {
  id: string;
  email: string;
  nombre: string | null;
  fotoPerfil?: string | null;
};

export function generateToken(user: AuthUser) {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(
    { id: user.id, email: user.email, nombre: user.nombre },
    JWT_SECRET,
    options
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function extractToken(request: NextRequest | Request) {
  if ("cookies" in request && typeof (request as NextRequest).cookies?.get === "function") {
    const cookieToken = (request as NextRequest).cookies.get("token")?.value;
    if (cookieToken) return cookieToken;
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];
  return null;
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
  const { password: _, ...rest } = user;
  return rest;
}

export async function getUserById(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nombre: true,
      fotoPerfil: true,
      fechaCreacion: true,
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
