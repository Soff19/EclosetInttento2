"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";
import { ImagePlus, Minus, Plus, X } from "lucide-react";

type User = {
  id: string;
  email: string;
  nombre: string | null;
  fotoPerfil?: string | null;
  fechaCreacion?: string;
  _count?: { prendas: number; outfits: number; productos: number };
};

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [nombre, setNombre] = useState("");
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setUser(data.user);
    setNombre(data.user.nombre || "");
  }

  useEffect(() => {
    load();
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      let fotoPerfil = user?.fotoPerfil;
      if (selectedFile && imageSource) {
        setUploading(true);
        const cropped = await cropImage(imageSource, zoom, position);
        const upload = new FormData();
        upload.append("image", cropped, selectedFile.name);
        upload.append("folder", "perfiles");
        const imageResponse = await fetch("/api/imagenes", { method: "POST", body: upload });
        const imageData = await imageResponse.json();
        if (!imageResponse.ok) throw new Error(imageData.error || "No se pudo subir la foto");
        fotoPerfil = imageData.url;
      }
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ nombre, fotoPerfil }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
      setSelectedFile(null);
      setImageSource(null);
      setEditorOpen(false);
      setMessage("Perfil actualizado");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  function selectImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Elegí un archivo de imagen válido.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5MB.");
      return;
    }
    setError("");
    setSelectedFile(file);
    setImageSource(URL.createObjectURL(file));
    setEditorOpen(true);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  function moveImage(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setPosition((current) => ({
      x: current.x + event.clientX - dragStart.x,
      y: current.y + event.clientY - dragStart.y,
    }));
    setDragStart({ x: event.clientX, y: event.clientY });
  }

  function cropImage(source: string, scale: number, offset: { x: number; y: number }) {
    return new Promise<Blob>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 640;
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("No se pudo preparar la imagen"));
        const baseScale = Math.max(640 / image.width, 640 / image.height) * scale;
        const width = image.width * baseScale;
        const height = image.height * baseScale;
        context.drawImage(image, (640 - width) / 2 + offset.x, (640 - height) / 2 + offset.y, width, height);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo recortar la imagen")), "image/jpeg", 0.9);
      };
      image.onerror = () => reject(new Error("No se pudo leer la imagen"));
      image.src = source;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("token");
    router.push("/");
  }

  if (!user) {
    return <main className="min-h-screen p-8" style={{ background: "#F9F5F0" }}>Cargando perfil...</main>;
  }

  return (
    <main className="min-h-screen px-5 pt-6 pb-32 relative overflow-hidden" style={{ background: "#F9F5F0" }}>
      <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#A8C5A0" }} />
      <div className="relative z-10 max-w-lg mx-auto">
        <BackLink href="/home" label="Volver al home" />
        <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
          Cuenta
        </p>
        <h1 className="text-[2rem] font-light mt-1 mb-6">Mi Perfil ✦</h1>

        <div
          className="rounded-[30px] p-6 mb-4 flex items-center gap-4"
          style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Cambiar foto de perfil"
            className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl shrink-0"
            style={{ background: "linear-gradient(135deg,#d7ead4,#f4ede2)" }}
          >
            {user.fotoPerfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.fotoPerfil} alt="" className="w-full h-full object-cover" />
            ) : (
              "👤"
            )}
            <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: "rgba(44,62,45,0.65)" }}>
              <ImagePlus size={20} color="white" />
            </span>
          </button>
          <div>
            <p className="font-light text-lg">{user.nombre || "Sin nombre"}</p>
            <p className="text-sm" style={{ color: "#9a9a8e" }}>
              {user.email}
            </p>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) selectImage(file);
          event.target.value = "";
        }} />

        {editorOpen && imageSource && (
          <div className="fixed inset-0 z-70 flex items-center justify-center px-5" style={{ background: "rgba(26,26,26,0.55)", backdropFilter: "blur(5px)" }}>
            <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: "#F9F5F0", boxShadow: "0 8px 48px rgba(0,0,0,0.2)" }}>
              <div className="flex items-center justify-between mb-5">
                <div><p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#9a9a8e" }}>Foto de perfil</p><h2 className="text-xl font-light">Ajustá tu imagen</h2></div>
                <button type="button" onClick={() => { setEditorOpen(false); setImageSource(null); setSelectedFile(null); }} className="p-2 rounded-full" style={{ background: "rgba(0,0,0,0.05)" }} aria-label="Cerrar editor"><X size={18} /></button>
              </div>
              <div className="relative mx-auto w-64 h-64 rounded-full overflow-hidden cursor-grab touch-none" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); setDragStart({ x: event.clientX, y: event.clientY }); }} onPointerMove={moveImage} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)} style={{ background: "#dedbd4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSource} alt="Vista previa de foto de perfil" onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="absolute max-w-none" style={{ width: `${imageSize.width * Math.max(256 / imageSize.width, 256 / imageSize.height)}px`, height: `${imageSize.height * Math.max(256 / imageSize.width, 256 / imageSize.height)}px`, left: "50%", top: "50%", transform: `translate(calc(-50% + ${position.x / 2}px), calc(-50% + ${position.y / 2}px)) scale(${zoom})` }} />
              </div>
              <div className="flex items-center gap-3 mt-5"><Minus size={16} /><input aria-label="Zoom de la imagen" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-[#2C3E2D]" /><Plus size={16} /></div>
              <button type="button" onClick={() => setEditorOpen(false)} className="w-full py-3 rounded-2xl mt-5" style={{ background: "#2C3E2D", color: "#F9F5F0" }}>Usar esta foto</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            ["Prendas", user._count?.prendas ?? 0],
            ["Outfits", user._count?.outfits ?? 0],
            ["Productos", user._count?.productos ?? 0],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-[20px] p-4 text-center"
              style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
            >
              <p className="text-xl font-light">{value}</p>
              <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "#9a9a8e" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <form
          onSubmit={saveProfile}
          className="rounded-[30px] p-6 space-y-4 mb-4"
          style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <label className="block text-sm">Nombre visible</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 outline-none"
          />
          {message && <p className="text-sm" style={{ color: "#2C3E2D" }}>{message}</p>}
          {error && <p className="text-sm" style={{ color: "#b85555" }}>{error}</p>}
          <button
            disabled={saving}
            className="w-full py-4 rounded-2xl"
            style={{ background: "#2C3E2D", color: "#F9F5F0" }}
          >
            {saving ? (uploading ? "Subiendo foto..." : "Guardando...") : "Guardar cambios"}
          </button>
        </form>

        <button
          onClick={logout}
          className="w-full py-4 rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e8e4de", color: "#b85555" }}
        >
          Cerrar sesión
        </button>
      </div>
      <BottomNavigation />
    </main>
  );
}
