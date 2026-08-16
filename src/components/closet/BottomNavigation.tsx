"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Shirt, Layers, User } from "lucide-react";

const items = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/productos", label: "Market", Icon: ShoppingBag },
  { href: "/closet", label: "Closet", Icon: Shirt, fab: true },
  { href: "/outfits", label: "Outfits", Icon: Layers },
  { href: "/perfil", label: "Perfil", Icon: User },
];

export default function BottomNavigation() {
  const pathname = usePathname();
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
      {items.map(({ href, label, Icon, fab }) => {
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
          <Link key={href} href={href} className="flex flex-col items-center gap-1 min-w-[48px]">
            <Icon size={21} color={active ? "#2C3E2D" : "#9a9a8e"} />
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
