"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Home,
  Menu,
  Shirt,
  UsersRound,
  X,
} from "lucide-react";

const enlaces = [
  { href: "/admin", label: "Inicio", Icono: Home },
  { href: "/admin/prendas", label: "Marketplace", Icono: Shirt },
  { href: "/admin/usuarios", label: "Usuarios", Icono: UsersRound },
  { href: "/admin/reportes", label: "Reportes", Icono: ClipboardList },
] as const;

function enlaceActivo(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function renderEnlaces(movil = false) {
    return enlaces.map(({ href, label, Icono }) => {
      const activo = enlaceActivo(pathname, href);
      return (
        <Link
          key={href}
          href={href}
          aria-current={activo ? "page" : undefined}
          onClick={() => {
            if (movil) setMenuAbierto(false);
          }}
          className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D] ${
            activo
              ? "font-medium"
              : "hover:bg-[#A8C5A0]/20"
          }`}
          style={{
            background: activo ? "rgba(168,197,160,0.32)" : undefined,
            color: activo ? "#2C3E2D" : "#55564d",
          }}
        >
          <Icono size={18} aria-hidden="true" />
          {label}
        </Link>
      );
    });
  }

  return (
    <>
      <header
        className="relative z-20 border-b border-[#e8e4de] px-4 py-3 lg:hidden"
        style={{ background: "rgba(255,255,255,0.9)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin"
            className="rounded-lg text-lg font-medium tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2C3E2D]"
            style={{ color: "#2C3E2D" }}
          >
            ECloset Admin
          </Link>
          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-label={menuAbierto ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={menuAbierto}
            aria-controls="admin-nav-movil"
            className="flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-[#A8C5A0]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
            style={{ color: "#2C3E2D" }}
          >
            {menuAbierto ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {menuAbierto && (
          <nav id="admin-nav-movil" aria-label="Navegación de administración" className="mt-3 space-y-1">
            {renderEnlaces(true)}
            <Link
              href="/home"
              onClick={() => setMenuAbierto(false)}
              className="mt-2 flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm transition hover:bg-[#A8C5A0]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
              style={{ color: "#55564d" }}
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Volver a la app
            </Link>
          </nav>
        )}
      </header>

      <aside
        className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-[#e8e4de] p-5 lg:flex"
        style={{ background: "rgba(255,255,255,0.72)" }}
      >
        <Link
          href="/admin"
          className="mb-9 rounded-lg px-2 py-1 text-xl font-medium tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2C3E2D]"
          style={{ color: "#2C3E2D" }}
        >
          ECloset Admin
        </Link>
        <nav aria-label="Navegación de administración" className="space-y-1">
          {renderEnlaces()}
        </nav>
        <Link
          href="/home"
          className="mt-auto flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm transition hover:bg-[#A8C5A0]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
          style={{ color: "#55564d" }}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver a la app
        </Link>
      </aside>
    </>
  );
}
