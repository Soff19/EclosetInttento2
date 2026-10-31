import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { parseProductTags } from "@/lib/product-tags";

type Periodo = "7dias" | "30dias" | "3meses";
type Punto = { etiqueta: string; usuarias: number; prendas: number };

function inicioDelDia(fecha: Date) {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

function porcentajeCambio(actual: number, anterior: number) {
  if (anterior === 0) return actual === 0 ? 0 : 100;
  return Math.round(((actual - anterior) / anterior) * 100);
}

function etiquetaFecha(fecha: Date, periodo: Periodo) {
  if (periodo === "7dias") {
    return new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" })
      .format(fecha)
      .replace(".", "");
  }
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(fecha);
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rawPeriodo = new URL(request.url).searchParams.get("periodo");
  const periodo: Periodo = rawPeriodo === "7dias" || rawPeriodo === "3meses" ? rawPeriodo : "30dias";
  const dias = periodo === "7dias" ? 7 : periodo === "30dias" ? 30 : 90;
  const hoy = inicioDelDia(new Date());
  const fin = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
  const inicio = new Date(hoy.getTime() - (dias - 1) * 24 * 60 * 60 * 1000);
  const inicioAnterior = new Date(inicio.getTime() - dias * 24 * 60 * 60 * 1000);

  try {
    const periodoActual = { gte: inicio, lt: fin };
    const periodoAnterior = { gte: inicioAnterior, lt: inicio };
    const [
      usuariasNuevas,
      usuariasAnteriores,
      prendasSubidas,
      prendasAnteriores,
      outfitsCreados,
      outfitsAnteriores,
      comprasRealizadas,
      comprasAnteriores,
      usuariasPorFecha,
      prendasPorFecha,
      prendasPorCategoria,
      destacadas,
    ] = await Promise.all([
      prisma.usuario.count({ where: { fechaCreacion: periodoActual } }),
      prisma.usuario.count({ where: { fechaCreacion: periodoAnterior } }),
      prisma.prenda.count({ where: { fechaCreacion: periodoActual } }),
      prisma.prenda.count({ where: { fechaCreacion: periodoAnterior } }),
      prisma.outfit.count({ where: { fechaCreacion: periodoActual } }),
      prisma.outfit.count({ where: { fechaCreacion: periodoAnterior } }),
      prisma.compra.count({ where: { estado: "CONCRETADA", fechaConcretada: periodoActual } }),
      prisma.compra.count({ where: { estado: "CONCRETADA", fechaConcretada: periodoAnterior } }),
      prisma.usuario.findMany({
        where: { fechaCreacion: periodoActual },
        select: { fechaCreacion: true },
      }),
      prisma.prenda.findMany({
        where: { fechaCreacion: periodoActual },
        select: { fechaCreacion: true },
      }),
      prisma.prenda.groupBy({
        by: ["categoria"],
        where: { fechaCreacion: periodoActual },
        _count: { _all: true },
        orderBy: { _count: { categoria: "desc" } },
        take: 5,
      }),
      prisma.producto.findMany({
        where: { fechaInicio: periodoActual },
        orderBy: [{ favoritos: { _count: "desc" } }, { fechaInicio: "desc" }],
        take: 5,
        select: {
          id: true,
          titulo: true,
          etiquetas: true,
          _count: { select: { favoritos: true } },
        },
      }),
    ]);

    const cantidadDeBarras = periodo === "7dias" ? 7 : periodo === "30dias" ? 5 : 3;
    const diasPorBarra = periodo === "7dias" ? 1 : periodo === "30dias" ? 7 : 30;
    const evolucion: Punto[] = Array.from({ length: cantidadDeBarras }, (_, indice) => {
      const inicioBarra = new Date(inicio.getTime() + indice * diasPorBarra * 24 * 60 * 60 * 1000);
      const finBarra = new Date(Math.min(
        inicioBarra.getTime() + diasPorBarra * 24 * 60 * 60 * 1000,
        fin.getTime(),
      ));
      return {
        etiqueta: periodo === "7dias"
          ? etiquetaFecha(inicioBarra, periodo)
          : `${periodo === "30dias" ? "Sem." : "Mes"} ${indice + 1}`,
        usuarias: usuariasPorFecha.filter(({ fechaCreacion }) =>
          fechaCreacion >= inicioBarra && fechaCreacion < finBarra,
        ).length,
        prendas: prendasPorFecha.filter(({ fechaCreacion }) =>
          fechaCreacion !== null && fechaCreacion >= inicioBarra && fechaCreacion < finBarra,
        ).length,
      };
    });

    const totalCategorias = prendasSubidas;
    const categorias = prendasPorCategoria.map((categoria) => ({
      nombre: categoria.categoria,
      cantidad: categoria._count._all,
      porcentaje: totalCategorias === 0 ? 0 : Math.round((categoria._count._all / totalCategorias) * 100),
    }));

    return NextResponse.json({
      informe: {
        indicadores: {
          usuariasNuevas,
          variacionUsuarias: porcentajeCambio(usuariasNuevas, usuariasAnteriores),
          prendasSubidas,
          variacionPrendas: porcentajeCambio(prendasSubidas, prendasAnteriores),
          outfitsCreados,
          variacionOutfits: porcentajeCambio(outfitsCreados, outfitsAnteriores),
          comprasRealizadas,
          variacionCompras: porcentajeCambio(comprasRealizadas, comprasAnteriores),
        },
        evolucion,
        categorias,
        destacadas: destacadas.map((producto) => ({
          id: producto.id,
          nombre: producto.titulo,
          tipo: "Producto" as const,
          categoria: parseProductTags(producto.etiquetas)[0] || "Sin categoría",
          favoritos: producto._count.favoritos,
        })),
      },
    });
  } catch (error) {
    console.error("Error al generar métricas de administración.", error);
    return NextResponse.json({ error: "No se pudo generar el informe." }, { status: 500 });
  }
}
