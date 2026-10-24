"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, Sun } from "lucide-react";
import BottomNavigation from "@/components/closet/BottomNavigation";

type User = { nombre: string | null; email: string };

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [noLeidas, setNoLeidas] = useState(0);

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
    async function loadUnread() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/notificaciones?limit=1", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setNoLeidas(data.noLeidas || 0);
        }
      } catch {
        setNoLeidas(0);
      }
    }

    void loadUnread();
    window.addEventListener("notificaciones:actualizadas", loadUnread);
    return () => window.removeEventListener("notificaciones:actualizadas", loadUnread);
  }, []);

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
