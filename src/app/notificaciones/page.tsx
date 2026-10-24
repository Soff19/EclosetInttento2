"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck, ExternalLink } from "lucide-react";
import BottomNavigation from "@/components/closet/BottomNavigation";

type Notification = {
  id: string;
  tipo: string;
  mensaje: string;
  leidaEn: string | null;
  creadoEn: string;
  actor: { id: string; nombre: string | null } | null;
  producto: { id: string; titulo: string; imagen: string | null; contacto: string | null } | null;
};

export default function NotificacionesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (nextPage = 1, append = false) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/notificaciones?page=${nextPage}&limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      const data = await response.json();
      if (response.status === 401) {
        router.push("/");
        return;
      }
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar las notificaciones");
      setItems((current) => append ? [...current, ...data.items] : data.items);
      setNoLeidas(data.noLeidas);
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openNotification(item: Notification) {
    if (!item.leidaEn) {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/notificaciones/${item.id}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      if (response.ok) {
        setItems((current) => current.map((entry) => entry.id === item.id
          ? { ...entry, leidaEn: new Date().toISOString() }
          : entry));
        setNoLeidas((current) => Math.max(0, current - 1));
        window.dispatchEvent(new Event("notificaciones:actualizadas"));
      }
    }
    if (item.producto) router.push(`/productos?producto=${encodeURIComponent(item.producto.id)}`);
  }

  async function markAllRead() {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/notificaciones", {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });
    if (response.ok) {
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, leidaEn: item.leidaEn || now })));
      setNoLeidas(0);
      window.dispatchEvent(new Event("notificaciones:actualizadas"));
    }
  }

  return (
    <main className="min-h-screen px-5 pt-6 pb-32" style={{ background: "#F9F5F0" }}>
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-7">
          <div>
            <Link href="/productos" className="inline-flex items-center gap-2 text-xs mb-4" style={{ color: "#6b6b60" }}>
              <ArrowLeft size={15} /> Volver al marketplace
            </Link>
            <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>Marketplace</p>
            <h1 className="text-[2rem] font-light mt-1">Notificaciones</h1>
            <p className="text-sm mt-1" style={{ color: "#9a9a8e" }}>
              {noLeidas === 1 ? "1 aviso sin leer" : `${noLeidas} avisos sin leer`}
            </p>
          </div>
          {noLeidas > 0 && (
            <button type="button" onClick={markAllRead} aria-label="Marcar todas como leídas" title="Marcar todas como leídas" className="p-3 rounded-full" style={{ background: "#fff", border: "1px solid #e8e4de", color: "#2C3E2D" }}>
              <CheckCheck size={19} />
            </button>
          )}
        </header>

        {error && <div role="alert" className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#fff0f0", color: "#b85555" }}>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <section className="py-16 text-center" style={{ borderTop: "1px solid #e8e4de", borderBottom: "1px solid #e8e4de" }}>
            <Bell size={28} className="mx-auto mb-3" color="#9a9a8e" />
            <h2 className="text-lg font-light">Todavía no tienes avisos</h2>
            <p className="text-sm mt-1" style={{ color: "#9a9a8e" }}>Aquí aparecerán las solicitudes sobre tus publicaciones.</p>
          </section>
        )}

        <div className="divide-y" style={{ borderColor: "#e8e4de" }}>
          {items.map((item) => (
            <article key={item.id} className="py-4 flex items-start gap-3">
              <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: item.leidaEn ? "transparent" : "#b85555", border: item.leidaEn ? "1px solid #c9c5bd" : "none" }} aria-label={item.leidaEn ? "Leída" : "Sin leer"} />
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => void openNotification(item)} className="text-left w-full">
                  <p className="text-sm" style={{ color: "#2a2a26", fontWeight: item.leidaEn ? 400 : 600 }}>
                    {item.actor?.nombre || "Un usuario"} quiere comprar {item.producto?.titulo ? `“${item.producto.titulo}”` : "tu publicación"}.
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#9a9a8e" }}>
                    {new Date(item.creadoEn).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </button>
                <p className="text-xs mt-2" style={{ color: "#9a9a8e" }}>
                  {item.producto?.contacto
                    ? "El comprador puede usar el contacto que publicaste para comunicarse contigo."
                    : "No agregaste un medio de contacto a esta publicación."}
                </p>
                {item.producto && (
                  <button type="button" onClick={() => void openNotification(item)} className="inline-flex items-center gap-1 mt-2 text-xs" style={{ color: "#2C3E2D" }}>
                    Ver publicación <ExternalLink size={13} />
                  </button>
                )}
              </div>
              {item.producto?.imagen && <img src={item.producto.imagen} alt="" className="w-14 h-14 object-cover rounded-lg" />}
            </article>
          ))}
        </div>

        {loading && <p className="py-5 text-sm text-center" style={{ color: "#9a9a8e" }}>Cargando notificaciones...</p>}
        {!loading && hasMore && (
          <button type="button" onClick={() => void load(page + 1, true)} className="w-full py-3 mt-3 text-sm" style={{ border: "1px solid #e8e4de", background: "#fff", color: "#2C3E2D" }}>
            Ver más
          </button>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}