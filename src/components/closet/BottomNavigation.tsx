"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, ShoppingBag, Shirt, Layers, User } from "lucide-react";

export default function BottomNavigation() {
  const pathname = usePathname();
  const [noLeidas, setNoLeidas] = useState(0);

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

  const items = [
    { href: "/home", label: "Home", Icon: Home },
    { href: "/productos", label: "Market", Icon: ShoppingBag },
    { href: "/closet", label: "Closet", Icon: Shirt, fab: true },
    { href: "/notificaciones", label: "Avisos", Icon: Bell, badge: noLeidas },
    { href: "/outfits", label: "Outfits", Icon: Layers },
    { href: "/perfil", label: "Perfil", Icon: User },
  ];

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md rounded-[28px] px-4 py-4 flex justify-between items-center z-50"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(18px)",
        border: "1px solid #e8e4de",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      }}
    >
      {items.map(({ href, label, Icon, fab, badge }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        if (fab) {
          return (
            <Link
              key={href}
              href={href}
              className="w-14 h-14 rounded-full flex items-center justify-center -mt-10 relative"
              style={{ background: "#2C3E2D", boxShadow: "0 10px 24px rgba(44,62,45,0.22)" }}
            >
              <Icon size={22} color="#F9F5F0" />
              <div
                className="absolute -bottom-5 text-[9px] uppercase tracking-[0.14em]"
                style={{ color: "#2C3E2D" }}
              >
                {label}
              </div>
            </Link>
          );
        }
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 min-w-[40px]">
            <span className="relative">
              <Icon size={20} color={active ? "#2C3E2D" : "#9a9a8e"} />
              {badge ? <span className="absolute -right-2 -top-2 min-w-4 h-4 px-1 rounded-full flex items-center justify-center text-[9px]" style={{ background: "#b85555", color: "#fff" }}>{badge > 99 ? "99+" : badge}</span> : null}
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.14em]"
              style={{ color: active ? "#2C3E2D" : "#9a9a8e" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
