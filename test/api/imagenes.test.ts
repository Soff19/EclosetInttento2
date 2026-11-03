import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getImageKit } from "@/lib/imagekit";

function uploadRequest(file?: File, folder?: string) {
  const form = new FormData();
  if (file) form.set("image", file);
  if (folder) form.set("folder", folder);
  return new NextRequest("http://localhost/api/imagenes", { method: "POST", body: form });
}

describe("/api/imagenes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza subir sin archivo y procesa imagen para cada carpeta", async () => {
    const { POST } = await import("@/app/api/imagenes/route");
    expect((await POST(uploadRequest())).status).toBe(400);

    const image = new File(["image"], "photo.png", { type: "image/png" });
    for (const folder of ["productos", "perfiles", "prendas"]) {
      const result = await POST(uploadRequest(image, folder));
      expect(result.status).toBe(200);
      expect(await result.json()).toEqual({
        url: "https://ik.imagekit.io/test/image.jpg",
        fileId: "test-file-id",
      });
    }
    expect(getImageKit).toHaveBeenCalledTimes(3);
  });

  it("elimina archivo y valida fileId", async () => {
    const { DELETE } = await import("@/app/api/imagenes/route");
    const missing = await DELETE(new NextRequest("http://localhost/api/imagenes", {
      method: "DELETE",
      body: JSON.stringify({}),
    }));
    expect(missing.status).toBe(400);

    const result = await DELETE(new NextRequest("http://localhost/api/imagenes", {
      method: "DELETE",
      body: JSON.stringify({ fileId: "file-1" }),
    }));
    expect(result.status).toBe(200);
  });
});
