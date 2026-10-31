import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { parseProductTags } from "@/lib/product-tags";

function mapProduct(producto: {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  etiquetas: string | null;
  usuario: { nombre: string | null; email: string };
  motivoEliminacion: string | null;
  explicacionEliminacion: string | null;
  fechaEliminacion: Date | null;
}) {
  const etiquetas = parseProductTags(producto.etiquetas);
  return {
    id: producto.id,
    titulo: producto.titulo,
    descripcion: producto.descripcion,
    precio: producto.precio,
    imagen: producto.imagen,
    etiquetas,
    categoria: etiquetas[0] || "Sin categoría",
    vendedora: producto.usuario.nombre || producto.usuario.email,
    motivoEliminacion: producto.motivoEliminacion,
    explicacionEliminacion: producto.explicacionEliminacion,
    fechaEliminacion: producto.fechaEliminacion?.toISOString() || null,
  };
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const [activas, eliminadas] = await Promise.all([
      prisma.producto.findMany({
        where: { estado: "DISPONIBLE" },
        orderBy: { fechaInicio: "desc" },
        include: { usuario: { select: { nombre: true, email: true } } },
      }),
      prisma.producto.findMany({
        where: { estado: "ELIMINADA" },
        orderBy: { fechaEliminacion: "desc" },
        include: { usuario: { select: { nombre: true, email: true } } },
      }),
    ]);

    return NextResponse.json({
      publicaciones: activas.map(mapProduct),
      historial: eliminadas.map(mapProduct),
    });
  } catch (error) {
    console.error("Error al consultar publicaciones para administración.", error);
    return NextResponse.json({ error: "No se pudieron cargar las publicaciones." }, { status: 500 });
  }
}
