import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const code = new URL(request.url).searchParams.get("code");
    if (!code) return NextResponse.redirect(`${base}/?error=no_code`);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${base}/api/auth/google/callback`
    );
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    if (!data.email) return NextResponse.redirect(`${base}/?error=no_email`);

    let user = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (!user) {
      user = await prisma.usuario.create({
        data: {
          email: data.email,
          nombre: data.name || data.email.split("@")[0],
          password: "GOOGLE_AUTH",
          fotoPerfil: data.picture || null,
        },
      });
    } else if (!user.fotoPerfil && data.picture) {
      user = await prisma.usuario.update({
        where: { id: user.id },
        data: { fotoPerfil: data.picture, nombre: user.nombre || data.name || user.nombre },
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      fotoPerfil: user.fotoPerfil,
    });

    const response = NextResponse.redirect(`${base}/home`);
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(`${base}/?error=auth_failed`);
  }
}
