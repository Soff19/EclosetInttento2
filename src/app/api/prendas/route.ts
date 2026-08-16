import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";
import { getImageKit } from "@/lib/imagekit";

async function requireUser(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

function parseEtiquetas(raw: FormDataEntryValue | null): string | null {
  if (raw == null || raw === "") return null;
  const text = String(raw);
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return JSON.stringify(
        parsed.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
      );
    }
  } catch {
    // texto plano separado por comas
  }
  const list = text
    .split(",")
    .map((t) => t.toLowerCase().trim().replace(/^#/, ""))
    .filter(Boolean);
  return list.length ? JSON.stringify(list) : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const prendas = await prisma.prenda.findMany({
      where: { usuarioId: user.id },
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ prendas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const formData = await request.formData();
    const categoria = String(formData.get("categoria") || formData.get("tipo") || "");
    const nombre = String(formData.get("nombre") || "") || null;
    const color = String(formData.get("color") || "") || null;
    const talle = String(formData.get("talle") || "") || null;
    const descripcion = String(formData.get("descripcion") || "") || null;
    const etiquetas = parseEtiquetas(formData.get("etiquetas"));
    const imagenFile = formData.get("imagen") as File | null;

    if (!categoria) {
      return NextResponse.json({ error: "categoria/tipo es obligatorio" }, { status: 400 });
    }

    let urlImagen = String(formData.get("urlImagen") || "");
    if (imagenFile && imagenFile.size > 0) {
      const buffer = Buffer.from(await imagenFile.arrayBuffer());
      const upload = await getImageKit().upload({
        file: buffer,
        fileName: imagenFile.name,
        folder: "/ecloset/prendas",
        useUniqueFileName: true,
      });
      urlImagen = upload.url;
    }
    if (!urlImagen) {
      return NextResponse.json({ error: "urlImagen o imagen es obligatorio" }, { status: 400 });
    }

    const prenda = await prisma.prenda.create({
      data: {
        categoria,
        nombre,
        color,
        talle,
        etiquetas,
        descripcion,
        urlImagen,
        usuarioId: user.id,
      },
    });
    return NextResponse.json({ prenda }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
