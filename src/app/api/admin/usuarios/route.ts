import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { fechaCreacion: "desc" },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        estado: true,
        fechaCreacion: true,
        perfilCompletado: true,
      },
    });

    return NextResponse.json({
      usuarios: usuarios.map((usuario) => ({
        ...usuario,
        nombre: usuario.nombre || usuario.email.split("@")[0],
        fechaCreacion: usuario.fechaCreacion.toISOString().slice(0, 10),
      })),
    });
  } catch (error) {
    console.error("Error al consultar usuarios para administración.", error);
    return NextResponse.json({ error: "No se pudieron cargar las usuarias." }, { status: 500 });
  }
}
