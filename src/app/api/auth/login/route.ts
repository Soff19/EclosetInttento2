import { NextResponse } from "next/server";
import { generateToken, loginUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }
    const user = await loginUser(email, password);
    const token = generateToken(user);
    const res = NextResponse.json({ success: true, user, token, redirectTo: "/home" });
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
    const status = message.includes("Credenciales") || message.includes("Google") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
