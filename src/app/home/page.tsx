"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, Sun } from "lucide-react";
import BottomNavigation from "@/components/closet/BottomNavigation";
import HomeCarousel, { type HomeCarouselItem } from "@/components/home/HomeCarousel";
import type { Prenda } from "@/types/prenda";

type User = { nombre: string | null; email: string };
type Outfit = {
  id: string;
  nombre: string;
  categoria?: string | null;
  descripcion?: string | null;
  outfitPrendas: { prenda: Prenda }[];
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [noLeidas, setNoLeidas] = useState(0);
  const [unreadError, setUnreadError] = useState("");
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loadingCloset, setLoadingCloset] = useState(true);
  const [closetError, setClosetError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    })();
  }, [router]);

  useEffect(() => {
    async function loadCloset() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [prendasResponse, outfitsResponse] = await Promise.all([
          fetch("/api/prendas", { headers, credentials: "include" }),
          fetch("/api/outfits", { headers, credentials: "include" }),
        ]);
        if (!prendasResponse.ok || !outfitsResponse.ok) {
          throw new Error("No pudimos cargar tu closet. Intentá actualizar la página.");
        }
        const [prendasData, outfitsData] = await Promise.all([
          prendasResponse.json(),
          outfitsResponse.json(),
        ]);
        setPrendas(prendasData.prendas || []);
        setOutfits(outfitsData.outfits || []);
      } catch (error) {
        setClosetError(error instanceof Error ? error.message : "Error al cargar tu closet.");
      } finally {
        setLoadingCloset(false);
      }
    }

    void loadCloset();
  }, []);

  useEffect(() => {
    async function loadUnread() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/notificaciones?limit=1", {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "No se pudo actualizar el contador de notificaciones.");
        }
        setNoLeidas(data.noLeidas);
        setUnreadError("");
      } catch (error) {
        setUnreadError(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el contador de notificaciones.",
        );
      }
    }

    void loadUnread();
    window.addEventListener("notificaciones:actualizadas", loadUnread);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadUnread();
    };
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("notificaciones:actualizadas", loadUnread);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(interval);
    };
  }, []);

  const prendasCarousel: HomeCarouselItem[] = prendas.map((prenda) => ({
    id: prenda.id,
    title: prenda.nombre || prenda.categoria,
    category: prenda.categoria,
    description: [
      prenda.color ? `Color ${prenda.color}` : "",
      prenda.talle ? `Talle ${prenda.talle}` : "",
      prenda.descripcion || "",
    ].filter(Boolean).join(" · ") || "Una prenda de tu closet.",
    href: "/closet",
    images: [{ src: prenda.urlImagen, alt: prenda.nombre || prenda.categoria }],
    details: [prenda.color, prenda.talle ? `Talle ${prenda.talle}` : ""].filter((value): value is string => Boolean(value)),
  }));

  const outfitsCarousel: HomeCarouselItem[] = outfits.map((outfit) => ({
    id: outfit.id,
    title: outfit.nombre,
    category: outfit.categoria || "Sin categoría",
    description: outfit.descripcion || `${outfit.outfitPrendas.length} prendas en este look.`,
    href: `/outfits?outfit=${encodeURIComponent(outfit.id)}`,
    images: outfit.outfitPrendas.slice(0, 4).map(({ prenda }) => ({
      src: prenda.urlImagen,
      alt: prenda.nombre || prenda.categoria,
    })),
    details: [`${outfit.outfitPrendas.length} ${outfit.outfitPrendas.length === 1 ? "prenda" : "prendas"}`],
  }));

  return (
    <main className="min-h-screen relative overflow-hidden px-5 pb-28 pt-6" style={{ backgroundColor: "#F9F5F0" }}>
      <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#A8C5A0" }} />
      <div className="absolute bottom-0 right-[-80px] w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#C9A96E" }} />

      <section className="flex items-center justify-between mb-7 relative z-10">
        <div>
          <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
            Tu espacio sostenible
          </p>
          <h1 className="text-[2rem] font-light tracking-[-0.02em] mt-1">
            Hola, {user?.nombre || "usuaria"} ✨
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/closet"
            aria-label="Buscar en mi closet"
            title="Buscar en mi closet"
            className="w-11 h-11 rounded-full flex items-center justify-center border"
            style={{ borderColor: "#e8e4de", background: "rgba(255,255,255,0.85)" }}
          >
            <Search size={18} />
          </Link>
          <Link
            href="/notificaciones"
            aria-label={noLeidas ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
            title="Notificaciones"
            className="relative w-11 h-11 rounded-full flex items-center justify-center border"
            style={{ borderColor: "#e8e4de", background: "#2C3E2D", color: "#F9F5F0", boxShadow: "0 5px 16px rgba(44,62,45,0.18)" }}
          >
            <Bell size={18} />
            {noLeidas > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-medium" style={{ background: "#b85555", color: "#fff", border: "2px solid #F9F5F0" }}>
                {noLeidas > 99 ? "99+" : noLeidas}
              </span>
            )}
          </Link>
        </div>
      </section>
      {unreadError && (
        <p role="status" className="relative z-10 -mt-5 mb-5 text-xs" style={{ color: "#b85555" }}>
          {unreadError} El contador conserva el último dato disponible.
        </p>
      )}

      <section
        className="rounded-[24px] p-5 mb-7 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #A8C5A0, #d7ead4)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-light">Tu closet en la nube</p>
            <h2 className="text-3xl font-light mt-2">Listo</h2>
            <p className="text-sm mt-1 opacity-70">Prendas y outfits sincronizados</p>
          </div>
          <Sun size={42} color="#F9F5F0" />
        </div>
      </section>

      <div className="relative z-10 mx-auto mb-7 grid w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <HomeCarousel
          title="Mis prendas"
          eyebrow="Tu colección"
          items={prendasCarousel}
          loading={loadingCloset}
          error={closetError}
          emptyMessage="Todavía no tenés prendas. Sumá la primera a tu closet."
          layout="garment"
        />

        <HomeCarousel
          title="Mis outfits"
          eyebrow="Looks guardados"
          items={outfitsCarousel}
          loading={loadingCloset}
          error={closetError}
          emptyMessage="Todavía no guardaste outfits. ¡Armá tu primer look!"
          layout="outfit"
        />
      </div>

      <section className="grid grid-cols-2 gap-3 relative z-10">
        {[
          { href: "/closet", title: "Mi Closet", desc: "Ver prendas" },
          { href: "/outfits", title: "Outfits", desc: "Armar looks" },
          { href: "/prendas/nueva", title: "Nueva prenda", desc: "Subir foto" },
          { href: "/perfil", title: "Perfil", desc: "Tu cuenta" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-[24px] p-5"
            style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
          >
            <p className="font-light text-lg">{card.title}</p>
            <p className="text-xs mt-1" style={{ color: "#9a9a8e" }}>
              {card.desc}
            </p>
          </Link>
        ))}
      </section>

      <BottomNavigation />
    </main>
  );
}
