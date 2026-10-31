"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";
import EditorialSectionBanner from "@/components/EditorialSectionBanner";
import styles from "../fashion-sections.module.css";

type User = {
  id: string;
  email: string;
  nombre: string | null;
  fotoPerfil?: string | null;
  fechaCreacion?: string;
  _count?: { prendas: number; outfits: number; productos: number };
};

type Preferences = {
  genero: string;
  tallaSistema: string;
  tallesArriba: string[];
  tallesAbajo: string[];
  tallesCalzado: string[];
  estilos: string[];
  colores: string;
};

const EMPTY_PREFERENCES: Preferences = {
  genero: "",
  tallaSistema: "AR",
  tallesArriba: [],
  tallesAbajo: [],
  tallesCalzado: [],
  estilos: [],
  colores: "",
};

const SIZE_OPTIONS = {
  tallesArriba: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"],
  tallesAbajo: ["30", "32", "34", "36", "38", "40", "42", "44", "46"],
  tallesCalzado: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47"],
} as const;
const STYLE_OPTIONS = ["Casual", "Formal", "Deportivo", "Boho", "Minimalista"];

function readPreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_PREFERENCES;
  const preferences = value as Partial<Preferences>;
  return {
    genero: typeof preferences.genero === "string" ? preferences.genero : "",
    tallaSistema: typeof preferences.tallaSistema === "string" ? preferences.tallaSistema : "AR",
    tallesArriba: Array.isArray(preferences.tallesArriba) ? preferences.tallesArriba.filter((size): size is string => typeof size === "string") : [],
    tallesAbajo: Array.isArray(preferences.tallesAbajo) ? preferences.tallesAbajo.filter((size): size is string => typeof size === "string") : [],
    tallesCalzado: Array.isArray(preferences.tallesCalzado) ? preferences.tallesCalzado.filter((size): size is string => typeof size === "string") : [],
    estilos: Array.isArray(preferences.estilos) ? preferences.estilos.filter((style): style is string => typeof style === "string") : [],
    colores: typeof preferences.colores === "string" ? preferences.colores : "",
  };
}

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
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(EMPTY_PREFERENCES);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [preferencesError, setPreferencesError] = useState("");

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        headers: token ? { Authorization: "Bearer " + token } : undefined,
        credentials: "include",
      });
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setNombre(data.user.nombre || "");

      const authHeaders = token ? { Authorization: "Bearer " + token } : undefined;
      try {
        const preferencesResponse = await fetch("/api/user/preferences", {
          headers: authHeaders,
          credentials: "include",
        });
        const preferencesData = await preferencesResponse.json();
        if (!preferencesResponse.ok) throw new Error(preferencesData.error || "No se pudieron cargar tus preferencias.");
        setPreferences(readPreferences(preferencesData.preferences));
        setPreferencesError("");
      } catch (preferencesLoadError) {
        setPreferencesError(preferencesLoadError instanceof Error ? preferencesLoadError.message : "No se pudieron cargar tus preferencias.");
      }
    } catch (loadError) {
      setPreferencesError(loadError instanceof Error ? loadError.message : "No se pudieron cargar tus preferencias.");
    } finally {
      setPreferencesLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

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
      setEditProfileOpen(false);
      setMessage("Perfil actualizado");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  function togglePreference(key: "tallesArriba" | "tallesAbajo" | "tallesCalzado" | "estilos", value: string) {
    setPreferences((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
    setPreferencesMessage("");
    setPreferencesError("");
  }

  async function savePreferences(event: React.FormEvent) {
    event.preventDefault();
    setPreferencesSaving(true);
    setPreferencesError("");
    setPreferencesMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        credentials: "include",
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron guardar tus preferencias.");
      setPreferences(readPreferences(data.preferences));
      setPreferencesMessage("Preferencias actualizadas.");
    } catch (saveError) {
      setPreferencesError(saveError instanceof Error ? saveError.message : "No se pudieron guardar tus preferencias.");
    } finally {
      setPreferencesSaving(false);
    }
  }

  async function reloadPreferences() {
    setPreferencesLoading(true);
    setPreferencesError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/preferences", {
        headers: token ? { Authorization: "Bearer " + token } : undefined,
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar tus preferencias.");
      setPreferences(readPreferences(data.preferences));
    } catch (loadError) {
      setPreferencesError(loadError instanceof Error ? loadError.message : "No se pudieron cargar tus preferencias.");
    } finally {
      setPreferencesLoading(false);
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
    return <main className="min-h-screen p-8 text-[#55524C]" style={{ background: "#F7F1E7" }}>Cargando perfil...</main>;
  }

  const choiceClass = (active: boolean) =>
    `min-h-10 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] ${
      active
        ? "border-[#0B493D] bg-[#C6EFD6] text-[#0B493D]"
        : "border-[#E5E1D9] bg-white text-[#55524C] hover:border-[#A8BC99]"
    }`;

  return (
    <main className={`${styles.page} min-h-screen px-0 pb-32 pt-0 text-[#333333]`}>
      <EditorialSectionBanner
        id="profile-banner-title"
        eyebrow=""
        title=""
        description=""
        intro={<BackLink href="/home" label="Volver al inicio" iconOnly className={`!mb-0 ${styles.bannerBackLink}`} />}
      />
      <div className="relative z-10 w-full px-4 pt-5 sm:px-6 sm:pt-7 lg:px-10">

        <div
          className="mb-5 flex flex-wrap items-center gap-4 rounded-3xl border border-[#E5E1D9] bg-white/90 p-5 shadow-[0_8px_28px_rgba(51,51,51,0.06)] sm:p-6"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Cambiar foto de perfil"
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#C6EFD6] bg-[#F2E6D5] text-2xl"
          >
            {user.fotoPerfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.fotoPerfil} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-bold text-[#0B493D]">
                {(user.nombre || user.email).slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-[#0B493D]/70 text-xs font-bold text-white opacity-0 transition-opacity hover:opacity-100">
              Cambiar
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-bold text-[#0B493D]">{user.nombre || "Sin nombre"}</p>
            <p className="truncate text-sm text-[#6b6b60]">
              {user.email}
            </p>
            <p className="mt-1 text-xs text-[#6b6b60]">Tocá la foto para cambiarla</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNombre(user.nombre || "");
              setError("");
              setMessage("");
              setEditProfileOpen(true);
            }}
            className="min-h-11 w-full rounded-xl bg-[#A8BC99] px-5 font-bold text-[#0B493D] transition-colors hover:bg-[#9fb58f] sm:w-auto"
          >
            Editar perfil
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) selectImage(file);
          event.target.value = "";
        }} />

        {editorOpen && imageSource && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B493D]/50 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-[#E5E1D9] bg-[#F7F1E7] p-5 shadow-2xl sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0B493D]">Foto de perfil</p><h2 className="text-xl font-bold text-[#333333]">Ajustá tu imagen</h2></div>
                <button type="button" onClick={() => { setEditorOpen(false); setImageSource(null); setSelectedFile(null); }} className="min-h-10 rounded-xl border border-[#E5E1D9] bg-white px-3 text-sm font-bold text-[#0B493D]" aria-label="Cerrar editor">Cerrar</button>
              </div>
              <div className="relative mx-auto h-64 w-64 cursor-grab touch-none overflow-hidden rounded-full bg-[#E5E1D9]" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); setDragStart({ x: event.clientX, y: event.clientY }); }} onPointerMove={moveImage} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSource} alt="Vista previa de foto de perfil" onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="absolute max-w-none" style={{ width: `${imageSize.width * Math.max(256 / imageSize.width, 256 / imageSize.height)}px`, height: `${imageSize.height * Math.max(256 / imageSize.width, 256 / imageSize.height)}px`, left: "50%", top: "50%", transform: `translate(calc(-50% + ${position.x / 2}px), calc(-50% + ${position.y / 2}px)) scale(${zoom})` }} />
              </div>
              <label className="mt-5 block text-sm font-bold text-[#333333]">
                Zoom
                <input aria-label="Zoom de la imagen" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-[#0B493D]" />
              </label>
              <button type="button" onClick={() => setEditorOpen(false)} className="mt-5 min-h-12 w-full rounded-xl bg-[#A8BC99] px-4 font-bold text-[#0B493D] transition-colors hover:bg-[#9fb58f]">Usar esta foto</button>
            </div>
          </div>
        )}

        {message && <p role="status" className="mb-4 text-sm text-[#0B493D]">{message}</p>}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.7fr)]">
          <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Prendas", user._count?.prendas ?? 0],
            ["Outfits", user._count?.outfits ?? 0],
            ["Productos", user._count?.productos ?? 0],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-[#E5E1D9] bg-white/90 p-4 text-center shadow-[0_4px_16px_rgba(51,51,51,0.04)]"
            >
              <p className="text-2xl font-bold text-[#0B493D]">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b6b60]">
                {label}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={logout}
          className="min-h-12 w-full rounded-xl border border-[#E5E1D9] bg-white px-4 font-bold text-[#9b4141] transition-colors hover:bg-[#fff3f0]"
        >
          Cerrar sesión
        </button>
          </div>

        <form
          onSubmit={savePreferences}
          className="space-y-6 rounded-3xl border border-[#E5E1D9] bg-white/90 p-5 shadow-[0_8px_28px_rgba(51,51,51,0.06)] sm:p-6"
        >
          <header className="border-b border-[#E5E1D9] pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B493D]">Personalización</p>
            <h2 className="mt-1 text-xl font-bold text-[#333333]">Tus preferencias de estilo</h2>
            <p className="mt-1 text-sm leading-5 text-[#6b6b60]">
              Actualizá tus estilos favoritos, colores y talles cuando quieras.
            </p>
          </header>

          {preferencesLoading ? (
            <p role="status" className="py-4 text-center text-sm text-[#6b6b60]">Cargando tus preferencias...</p>
          ) : (
            <>
              {preferencesError && (
                <div role="alert" className="text-sm text-[#9b4141]">
                  <p>{preferencesError}</p>
                  <button type="button" onClick={() => void reloadPreferences()} className="mt-1 font-bold text-[#0B493D] underline">
                    Reintentar
                  </button>
                </div>
              )}
              <details className="rounded-2xl border border-[#E5E1D9] bg-[#F7F1E7] p-4">
                <summary className="cursor-pointer text-sm font-bold text-[#0B493D] marker:text-[#0B493D]">
                  Talles <span className="font-normal text-[#6b6b60]">
                    · {preferences.tallesArriba.length + preferences.tallesAbajo.length + preferences.tallesCalzado.length} seleccionados · Sistema {preferences.tallaSistema}
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-[#333333]">Sistema de talles</legend>
                    <div className="flex flex-wrap gap-2">
                      {(["AR", "EU", "US"] as const).map((system) => (
                        <button
                          key={system}
                          type="button"
                          onClick={() => setPreferences((current) => ({ ...current, tallaSistema: system }))}
                          aria-pressed={preferences.tallaSistema === system}
                          className={choiceClass(preferences.tallaSistema === system)}
                        >
                          {system}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {([
                    ["tallesArriba", "Parte de arriba"],
                    ["tallesAbajo", "Parte de abajo"],
                    ["tallesCalzado", "Calzado"],
                  ] as const).map(([key, label]) => (
                    <fieldset key={key}>
                      <legend className="mb-2 text-sm font-semibold text-[#333333]">{label}</legend>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {SIZE_OPTIONS[key].map((size) => {
                          const selected = preferences[key].includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => togglePreference(key, size)}
                              aria-pressed={selected}
                              className={choiceClass(selected)}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </details>

              <details className="rounded-2xl border border-[#E5E1D9] bg-[#F7F1E7] p-4">
                <summary className="cursor-pointer text-sm font-bold text-[#0B493D] marker:text-[#0B493D]">
                  Estilos favoritos <span className="font-normal text-[#6b6b60]">· {preferences.estilos.length} seleccionados</span>
                </summary>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STYLE_OPTIONS.map((style) => {
                    const selected = preferences.estilos.includes(style);
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => togglePreference("estilos", style)}
                        aria-pressed={selected}
                        className={choiceClass(selected)}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </details>

              <details className="rounded-2xl border border-[#E5E1D9] bg-[#F7F1E7] p-4">
                <summary className="cursor-pointer text-sm font-bold text-[#0B493D] marker:text-[#0B493D]">
                  Colores favoritos <span className="font-normal text-[#6b6b60]">· {preferences.colores.trim() || "Sin definir"}</span>
                </summary>
                <div className="mt-4">
                  <label htmlFor="profile-favorite-colors" className="mb-2 block text-sm font-semibold text-[#333333]">
                    Colores favoritos (separados por comas)
                  </label>
                  <input
                    id="profile-favorite-colors"
                    value={preferences.colores}
                    onChange={(event) => {
                      setPreferences((current) => ({ ...current, colores: event.target.value }));
                      setPreferencesMessage("");
                    }}
                    placeholder="Ej.: verde, crema, azul"
                    className="min-h-12 w-full rounded-xl border border-[#C7C2B8] bg-white px-4 py-3 outline-none transition placeholder:text-[#8a887f] focus:border-[#0B493D] focus:ring-2 focus:ring-[#0B493D]/15"
                  />
                </div>
              </details>
            </>
          )}

          {preferencesMessage && <p role="status" className="text-sm text-[#0B493D]">{preferencesMessage}</p>}
          <button
            type="submit"
            disabled={preferencesLoading || preferencesSaving || Boolean(preferencesError)}
            className="min-h-12 w-full rounded-xl bg-[#A8BC99] px-4 font-bold text-[#0B493D] transition-colors hover:bg-[#9fb58f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {preferencesSaving ? "Guardando preferencias..." : "Guardar preferencias"}
          </button>
        </form>
        </div>

        {editProfileOpen && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0B493D]/50 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) setEditProfileOpen(false);
            }}
          >
            <form
              onSubmit={saveProfile}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-profile-title"
              className="w-full max-w-md space-y-5 rounded-3xl border border-[#E5E1D9] bg-[#F7F1E7] p-5 shadow-2xl sm:p-6"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B493D]">Cuenta</p>
                <h2 id="edit-profile-title" className="mt-1 text-2xl font-bold text-[#333333]">Editar perfil</h2>
              </div>
              <div>
                <label htmlFor="profile-display-name" className="mb-2 block text-sm font-bold text-[#333333]">Nombre visible</label>
                <input
                  id="profile-display-name"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  autoFocus
                  className="min-h-12 w-full rounded-xl border border-[#C7C2B8] bg-white px-4 py-3 outline-none transition focus:border-[#0B493D] focus:ring-2 focus:ring-[#0B493D]/15"
                />
              </div>
              {error && <p role="alert" className="text-sm text-[#9b4141]">{error}</p>}
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditProfileOpen(false)}
                  className="min-h-12 flex-1 rounded-xl border border-[#C7C2B8] bg-white px-4 font-bold text-[#0B493D] disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-12 flex-1 rounded-xl bg-[#A8BC99] px-4 font-bold text-[#0B493D] transition-colors hover:bg-[#9fb58f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (uploading ? "Subiendo foto..." : "Guardando...") : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
