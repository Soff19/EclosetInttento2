"use client";

import { useEffect, useState } from "react";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";

type Producto = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: string;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/productos");
      const data = await res.json();
      if (res.ok) setProductos(data.productos || []);
    })();
  }, []);

  return (
    <main className="min-h-screen px-5 pt-6 pb-32" style={{ background: "#F9F5F0" }}>
      <div className="max-w-xl mx-auto">
        <BackLink href="/home" label="Volver al home" />
        <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>
          Market
        </p>
        <h1 className="text-[2rem] font-light mt-1 mb-6">Marketplace ✦</h1>
        <div className="grid gap-4">
          {productos.map((p) => (
            <article
              key={p.id}
              className="rounded-[24px] p-5"
              style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
            >
              <h2 className="font-light text-lg">{p.titulo}</h2>
              <p className="text-sm mt-1" style={{ color: "#9a9a8e" }}>
                {p.descripcion}
              </p>
              <p className="mt-3 font-medium">${p.precio}</p>
            </article>
          ))}
          {productos.length === 0 && (
            <p style={{ color: "#9a9a8e" }}>Todavía no hay productos publicados.</p>
          )}
        </div>
      </div>
      <BottomNavigation />
    </main>
  );
}
