import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";

type UserChanges = { rol?: "ADMIN" | "USUARIA"; estado?: "ACTIVA" | "SUSPENDIDA" };

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await context.params;
  let changes: UserChanges;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Datos de usuario inválidos." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const rol = payload.rol;
    const estado = payload.estado;
    if (
      (rol !== undefined && rol !== "ADMIN" && rol !== "USUARIA") ||
      (estado !== undefined && estado !== "ACTIVA" && estado !== "SUSPENDIDA") ||
      (rol === undefined && estado === undefined)
    ) {
      return NextResponse.json({ error: "El rol o estado indicado no es válido." }, { status: 400 });
    }
    changes = {
      ...(rol !== undefined ? { rol } : {}),
      ...(estado !== undefined ? { estado } : {}),
    };
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
  }

  try {
    const usuario = await prisma.$transaction(async (transaction) => {
      const target = await transaction.usuario.findUnique({
        where: { id },
        select: { id: true, rol: true, estado: true },
      });
      if (!target) return null;

      const revokingAdmin =
        target.rol === "ADMIN" &&
        ((changes.rol !== undefined && changes.rol !== "ADMIN") ||
          (changes.estado !== undefined && changes.estado !== "ACTIVA"));
      if (revokingAdmin) {
        if (target.id === admin.id) {
          throw new Error("No podés cambiar tu propio acceso de administrador.");
        }
        const adminsActivos = await transaction.usuario.count({
          where: { rol: "ADMIN", estado: "ACTIVA" },
        });
        if (adminsActivos <= 1) {
          throw new Error("No se puede quitar el acceso al último administrador activo.");
        }
      }

      return transaction.usuario.update({
        where: { id },
        data: changes,
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
    }, { isolationLevel: "Serializable" });

    if (!usuario) return NextResponse.json({ error: "No encontramos a esa usuaria." }, { status: 404 });
    return NextResponse.json({
      usuario: {
        ...usuario,
        nombre: usuario.nombre || usuario.email.split("@")[0],
        fechaCreacion: usuario.fechaCreacion.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la usuaria.";
    const status = message.startsWith("No podés") || message.startsWith("No se puede") ? 409 : 500;
    if (status === 500) console.error("Error al actualizar una usuaria desde administración.", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await context.params;
  try {
    const deleted = await prisma.$transaction(async (transaction) => {
      const target = await transaction.usuario.findUnique({
        where: { id },
        select: { id: true, rol: true },
      });
      if (!target) return "NOT_FOUND" as const;
      if (target.id === admin.id) return "SELF_DELETE" as const;

      if (target.rol === "ADMIN") {
        const adminsActivos = await transaction.usuario.count({
          where: { rol: "ADMIN", estado: "ACTIVA" },
        });
        if (adminsActivos <= 1) return "LAST_ADMIN" as const;
      }

      await transaction.usuario.delete({ where: { id } });
      return "DELETED" as const;
    }, { isolationLevel: "Serializable" });

    if (deleted === "NOT_FOUND") {
      return NextResponse.json({ error: "No encontramos a esa usuaria." }, { status: 404 });
    }
    if (deleted === "SELF_DELETE") {
      return NextResponse.json({ error: "No podés eliminar tu propia cuenta desde el panel." }, { status: 409 });
    }
    if (deleted === "LAST_ADMIN") {
      return NextResponse.json({ error: "No se puede eliminar al último administrador activo." }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar una cuenta desde administración.", error);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
  }
}
