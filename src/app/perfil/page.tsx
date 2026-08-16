"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";

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
  const [user, setUser] = useState<User | null>(null);
  const [nombre, setNombre] = useState("");
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
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
      setMessage("Perfil actualizado");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
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
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl"
            style={{ background: "linear-gradient(135deg,#d7ead4,#f4ede2)" }}
          >
            {user.fotoPerfil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.fotoPerfil} alt="" className="w-full h-full object-cover" />
            ) : (
              "👤"
            )}
          </div>
          <div>
            <p className="font-light text-lg">{user.nombre || "Sin nombre"}</p>
            <p className="text-sm" style={{ color: "#9a9a8e" }}>
              {user.email}
            </p>
          </div>
        </div>

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
            {saving ? "Guardando..." : "Guardar cambios"}
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
