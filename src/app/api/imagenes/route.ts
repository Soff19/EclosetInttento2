import { NextRequest, NextResponse } from "next/server";
import { getImageKit } from "@/lib/imagekit";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 });
    const response = await getImageKit().upload({
      file: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      folder: "/ecloset/prendas",
      useUniqueFileName: true,
    });
    return NextResponse.json({ url: response.url, fileId: response.fileId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileId } = await request.json();
    if (!fileId) return NextResponse.json({ error: "fileId es obligatorio" }, { status: 400 });
    await getImageKit().deleteFile(fileId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar la imagen" }, { status: 500 });
  }
}
