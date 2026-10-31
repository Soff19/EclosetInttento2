import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";

function tiempoRelativo(fecha: Date, ahora: number) {
  const minutos = Math.max(0, Math.floor((ahora - fecha.getTime()) / 60_000));
  if (minutos < 1) return "Hace un momento";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias} d`;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const [usuarias, publicacionesActivas, solicitudesPendientes, publicacionesEliminadas, productosNuevos, productosEliminados, usuariosNuevos, comprasNuevas] =
      await Promise.all([
        prisma.usuario.count(),
        prisma.producto.count({ where: { estado: "DISPONIBLE" } }),
        prisma.compra.count({ where: { estado: "PENDIENTE" } }),
        prisma.producto.count({ where: { estado: "ELIMINADA" } }),
        prisma.producto.findMany({
          where: { estado: "DISPONIBLE" },
          orderBy: { fechaInicio: "desc" },
          take: 4,
          select: { id: true, titulo: true, fechaInicio: true, usuario: { select: { nombre: true, email: true } } },
        }),
        prisma.producto.findMany({
          where: { estado: "ELIMINADA", fechaEliminacion: { not: null } },
          orderBy: { fechaEliminacion: "desc" },
          take: 4,
          select: { id: true, titulo: true, fechaEliminacion: true },
        }),
        prisma.usuario.findMany({
          orderBy: { fechaCreacion: "desc" },
          take: 4,
          select: { id: true, nombre: true, fechaCreacion: true },
        }),
        prisma.compra.findMany({
          orderBy: { creadoEn: "desc" },
          take: 4,
          select: { id: true, estado: true, creadoEn: true, producto: { select: { titulo: true } } },
        }),
      ]);

    const actividades = [
      ...productosNuevos.map((producto) => ({
        id: `producto-${producto.id}`,
        tipo: "prenda" as const,
        texto: `Nueva publicación de ${producto.usuario.nombre || producto.usuario.email} en el marketplace`,
        fecha: producto.fechaInicio,
      })),
      ...productosEliminados.flatMap((producto) =>
        producto.fechaEliminacion
          ? [{
              id: `eliminado-${producto.id}`,
              tipo: "prenda" as const,
              texto: `Publicación eliminada del marketplace: ${producto.titulo}`,
              fecha: producto.fechaEliminacion,
            }]
          : [],
      ),
      ...usuariosNuevos.map((usuario) => ({
        id: `usuario-${usuario.id}`,
        tipo: "usuaria" as const,
        texto: `${usuario.nombre || "Una usuaria"} se unió a ECloset`,
        fecha: usuario.fechaCreacion,
      })),
      ...comprasNuevas.map((compra) => ({
        id: `compra-${compra.id}`,
        tipo: "solicitud" as const,
        texto: `Solicitud de compra ${compra.estado.toLowerCase()} · ${compra.producto.titulo}`,
        fecha: compra.creadoEn,
      })),
    ]
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 4)
      .map(({ fecha, ...actividad }) => ({
        ...actividad,
        tiempo: tiempoRelativo(fecha, Date.now()),
      }));

    return NextResponse.json({
      resumen: { usuarias, activas: publicacionesActivas, solicitudes: solicitudesPendientes, eliminadas: publicacionesEliminadas },
      actividades,
    });
  } catch (error) {
    console.error("Error al consultar el resumen de administración.", error);
    return NextResponse.json({ error: "No se pudo cargar el resumen de administración." }, { status: 500 });
  }
}
