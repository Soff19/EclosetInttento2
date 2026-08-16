import { NextResponse } from "next/server";
import { generateToken, registerUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, nombre, username } = body;
    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Las contraseñas no coinciden" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    const user = await registerUser({ email, password, nombre: nombre || username });
    const token = generateToken(user);
    const res = NextResponse.json(
      { success: true, user, token, redirectTo: "/onboarding" },
      { status: 201 }
    );
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: message.includes("email") ? 400 : 500 });
  }
}
