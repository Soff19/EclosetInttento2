import { NextResponse } from "next/server";
import { resetUserPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: "Completá todos los campos" }, { status: 400 });
    }

    await resetUserPassword(email, password, confirmPassword);
    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la contraseña";
    const status = message.includes("No encontramos") || message.includes("Google") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}