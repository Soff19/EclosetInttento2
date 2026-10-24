import { NextResponse } from "next/server";
import { generateToken, loginUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }
    
    const user = await loginUser(email, password);
    const token = generateToken(user);
    
    // Validamos el rol basado en el dominio del email
    const rol = email.endsWith("@ecloset.com") ? "admin" : "user";
    
    // Agregamos la propiedad rol al objeto usuario que se envía en el JSON
    const userWithRole = { ...user, rol };

// Si el usuario no completó el perfil, redirigimos al onboarding
const userFromDb = await prisma.usuario.findUnique({ where: { id: user.id } });
const shouldOnboard = userFromDb ? !userFromDb.perfilCompletado : false;

// FORZAMOS LAS RUTAS ABSOLUTAS CORRECTAS
let redirectTo = shouldOnboard ? "/onboarding" : "/home";

if (email.endsWith("@ecloset.com")) {
  // Probá cambiando esta ruta al destino exacto donde Next.js mapea tu admin.
  // Si tu carpeta 'admin' está directo en src/app, esto debería ser "/admin"
  // Pero si usás un prefijo, asegrate de ponerlo acá:
  redirectTo = "/admin"; // Cambia esto según tu estructura de carpetas
}

const res = NextResponse.json({ success: true, user: userWithRole, token, redirectTo });

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
