"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check, CheckCheck, ExternalLink, LoaderCircle, Star, X } from "lucide-react";
import BottomNavigation from "@/components/closet/BottomNavigation";
import { getContactHref } from "@/lib/contact";

type Notification = {
  id: string;
  tipo: string;
  mensaje: string;
  leidaEn: string | null;
  creadoEn: string;
  actor: { id: string; nombre: string | null } | null;
  producto: { id: string; titulo: string; imagen: string | null; contacto: string | null } | null;
  compra: { id: string; estado: string } | null;
};

type ApiData = {
  error?: string;
  items?: Notification[];
  noLeidas?: number;
  page?: number;
  hasMore?: boolean;
  decision?: string;
  emailSent?: boolean;
  success?: boolean;
};

async function readApiData(response: Response): Promise<ApiData> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    throw new Error(`El servidor devolvió una respuesta inesperada (HTTP ${response.status}).`);
  }
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && !Array.isArray(data)) return data as ApiData;
  } catch {
    // The response body is not usable JSON; report a safe, user-facing error below.
  }
  throw new Error(`El servidor devolvió una respuesta inesperada (HTTP ${response.status}).`);
}

export default function NotificacionesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [processingCompraId, setProcessingCompraId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"ACEPTADA" | "DENEGADA" | "CONCRETADA" | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const load = useCallback(async (nextPage = 1, append = false, preserveItems = false) => {
    if (!preserveItems) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/notificaciones?page=${nextPage}&limit=20`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      const data = await readApiData(response);
      if (response.status === 401) {
        router.push("/");
        return;
      }
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar las notificaciones");
      const receivedItems = data.items || [];
      setItems((current) => {
        if (append) {
          const knownIds = new Set(current.map((item) => item.id));
          return [...current, ...receivedItems.filter((item) => !knownIds.has(item.id))];
        }
        if (preserveItems) {
          const receivedIds = new Set(receivedItems.map((item) => item.id));
          return [...receivedItems, ...current.filter((item) => !receivedIds.has(item.id))];
        }
        return receivedItems;
      });
      setNoLeidas(data.noLeidas || 0);
      if (!preserveItems) setPage(data.page || 1);
      setHasMore(Boolean(data.hasMore));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error de conexión");
    } finally {
      if (!preserveItems) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load(1, false, true);
    };
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load]);

  async function openNotification(item: Notification) {
    setError("");
    if (!item.leidaEn) {
      setOpeningId(item.id);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/notificaciones/${item.id}`, {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        const data = await readApiData(response);
        if (!response.ok) throw new Error(data.error || "No se pudo marcar la notificación como leída.");
        setItems((current) => current.map((entry) => entry.id === item.id
          ? { ...entry, leidaEn: new Date().toISOString() }
          : entry));
        setNoLeidas(data.noLeidas ?? 0);
        window.dispatchEvent(new Event("notificaciones:actualizadas"));
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "No se pudo actualizar la notificación.");
        return;
      } finally {
        setOpeningId(null);
      }
    }
    if (item.producto) router.push(`/productos?producto=${encodeURIComponent(item.producto.id)}`);
  }

  async function markAllRead() {
    setError("");
    setMarkingAll(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      const data = await readApiData(response);
      if (!response.ok) throw new Error(data.error || "No se pudieron marcar las notificaciones como leídas.");
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, leidaEn: item.leidaEn || now })));
      setNoLeidas(data.noLeidas ?? 0);
      window.dispatchEvent(new Event("notificaciones:actualizadas"));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No se pudieron actualizar las notificaciones.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function decidePurchase(item: Notification, decision: "ACEPTADA" | "DENEGADA") {
    if (!item.compra || processingCompraId) return;
    setError("");
    setActionMessage("");
    setProcessingCompraId(item.compra.id);
    setProcessingAction(decision);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/compras/${item.compra.id}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ decision }),
      });
      const data = await readApiData(response);
      if (!response.ok) throw new Error(data.error || "No se pudo procesar la solicitud.");
      const message = decision === "ACEPTADA"
        ? "Solicitud aceptada."
        : "Solicitud denegada; la publicación permanece disponible.";
      setActionMessage(data.emailSent ? `${message} También se envió el correo al comprador.` : `${message} La notificación interna se guardó, pero no se pudo enviar el correo.`);
      setItems((current) => current.map((entry) => entry.id === item.id
        ? {
            ...entry,
            mensaje: decision === "ACEPTADA"
              ? `Aceptaste la solicitud de ${item.actor?.nombre || "un usuario"} por "${item.producto?.titulo || "tu publicación"}".`
              : `Denegaste la solicitud de ${item.actor?.nombre || "un usuario"} por "${item.producto?.titulo || "tu publicación"}".`,
            leidaEn: entry.leidaEn || new Date().toISOString(),
            compra: entry.compra ? { ...entry.compra, estado: decision } : null,
          }
        : entry));
      window.dispatchEvent(new Event("notificaciones:actualizadas"));
      await load(1, false, true);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo procesar la solicitud.");
    } finally {
      setProcessingCompraId(null);
      setProcessingAction(null);
    }
  }

  async function confirmCompletion(item: Notification) {
    if (!item.compra || processingCompraId) return;
    setError("");
    setActionMessage("");
    setProcessingCompraId(item.compra.id);
    setProcessingAction("CONCRETADA");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/compras/${item.compra.id}/concretar`, {
        method: "POST",
        headers: token ? { Authorization: "Bearer " + token } : undefined,
        credentials: "include",
      });
      const data = await readApiData(response);
      if (!response.ok) throw new Error(data.error || "No se pudo confirmar la compra.");
      setActionMessage("Compra confirmada. Ahora podés puntuar el servicio del vendedor.");
      setItems((current) => current.map((entry) => entry.id === item.id
        ? {
            ...entry,
            mensaje: `Confirmaste que concretaste la compra de "${item.producto?.titulo || "la publicación"}".`,
            compra: entry.compra ? { ...entry.compra, estado: "CONCRETADA" } : null,
          }
        : entry));
      window.dispatchEvent(new Event("notificaciones:actualizadas"));
      await load(1, false, true);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo confirmar la compra.");
    } finally {
      setProcessingCompraId(null);
      setProcessingAction(null);
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
            <button type="button" onClick={markAllRead} disabled={markingAll || openingId !== null} aria-label="Marcar todas como leídas" title="Marcar todas como leídas" className="p-3 rounded-full disabled:opacity-50" style={{ background: "#fff", border: "1px solid #e8e4de", color: "#2C3E2D" }}>
              <CheckCheck size={19} />
            </button>
          )}
        </header>

        {error && <div role="alert" className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#fff0f0", color: "#b85555" }}>{error}</div>}
        {actionMessage && <div role="status" className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#edf4ea", color: "#2C3E2D" }}>{actionMessage}</div>}
        {!loading && !error && items.length === 0 && (
          <section className="py-16 text-center" style={{ borderTop: "1px solid #e8e4de", borderBottom: "1px solid #e8e4de" }}>
            <Bell size={28} className="mx-auto mb-3" color="#9a9a8e" />
            <h2 className="text-lg font-light">Todavía no tienes avisos</h2>
            <p className="text-sm mt-1" style={{ color: "#9a9a8e" }}>Aquí aparecerán las interacciones sobre tus publicaciones.</p>
          </section>
        )}

        <div className="divide-y" style={{ borderColor: "#e8e4de" }}>
          {items.map((item) => (
            <article key={item.id} className="py-4 flex items-start gap-3">
              <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: item.leidaEn ? "transparent" : "#b85555", border: item.leidaEn ? "1px solid #c9c5bd" : "none" }} aria-label={item.leidaEn ? "Leída" : "Sin leer"} />
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => void openNotification(item)} disabled={openingId !== null || markingAll} className="text-left w-full disabled:opacity-60">
                  <p className="text-sm" style={{ color: "#2a2a26", fontWeight: item.leidaEn ? 400 : 600 }}>
                    {item.tipo === "SOLICITUD_COMPRA"
                      ? `${item.actor?.nombre || "Un usuario"} quiere comprar ${item.producto?.titulo ? `“${item.producto.titulo}”` : "tu publicación"}.`
                      : item.mensaje}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#9a9a8e" }}>
                    {new Date(item.creadoEn).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </button>
                {item.tipo === "SOLICITUD_COMPRA" && (
                  item.compra?.estado === "PENDIENTE" ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => void decidePurchase(item, "ACEPTADA")}
                        disabled={processingCompraId !== null}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                        style={{ background: "#2C3E2D", color: "#fff" }}
                      >
                        {processingCompraId === item.compra.id && processingAction === "ACEPTADA" ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                        Aceptar solicitud
                      </button>
                      <button
                        type="button"
                        onClick={() => void decidePurchase(item, "DENEGADA")}
                        disabled={processingCompraId !== null}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                        style={{ background: "#fff", border: "1px solid #e8e4de", color: "#8f4646" }}
                      >
                        {processingCompraId === item.compra.id && processingAction === "DENEGADA" ? <LoaderCircle size={15} className="animate-spin" /> : <X size={15} />}
                        Denegar solicitud
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs mt-2" style={{ color: "#6b6b60" }}>
                      Estado: {item.compra?.estado === "ACEPTADA" ? "Aceptada" : item.compra?.estado === "DENEGADA" ? "Denegada" : item.compra?.estado === "CONCRETADA" ? "Compra concretada" : "Solicitud ya resuelta"}
                    </p>
                  )
                )}
                {item.tipo === "SOLICITUD_COMPRA_ACEPTADA" && item.actor && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs leading-relaxed" style={{ color: "#6b6b60" }}>
                      Podés comunicarte con el vendedor para coordinar. Después de concretar la compra, podés confirmar el encuentro y puntuar su servicio para ayudar a otros usuarios.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {getContactHref(item.producto?.contacto) && (
                        <a href={getContactHref(item.producto?.contacto) || undefined} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline" style={{ color: "#2C3E2D" }}>
                          Contactar al vendedor <ExternalLink size={13} />
                        </a>
                      )}
                      <Link href={`/perfil/${item.actor.id}`} className="inline-flex items-center gap-1 text-xs underline" style={{ color: "#2C3E2D" }}>
                        Ver perfil del vendedor <Star size={13} />
                      </Link>
                    </div>
                    {item.compra?.estado === "ACEPTADA" && (
                      <button
                        type="button"
                        onClick={() => void confirmCompletion(item)}
                        disabled={processingCompraId !== null}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                        style={{ background: "#2C3E2D", color: "#fff" }}
                      >
                        {processingCompraId === item.compra.id && processingAction === "CONCRETADA" ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                        Confirmar compra concretada
                      </button>
                    )}
                    {item.compra?.estado === "CONCRETADA" && (
                      <Link href={`/perfil/${item.actor.id}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm" style={{ background: "#2C3E2D", color: "#fff" }}>
                        <Star size={15} /> Puntuar al vendedor
                      </Link>
                    )}
                  </div>
                )}
                {item.producto && (
                  <button type="button" onClick={() => void openNotification(item)} disabled={openingId !== null || markingAll} className="inline-flex items-center gap-1 mt-2 text-xs disabled:opacity-60" style={{ color: "#2C3E2D" }}>
                    Ver publicación <ExternalLink size={13} />
                  </button>
                )}
              </div>
              {item.producto?.imagen && <img src={item.producto.imagen} alt="" className="w-14 h-14 object-cover rounded-lg" />}
            </article>
          ))}
        </div>

        {loading && <p className="py-5 text-sm text-center" style={{ color: "#9a9a8e" }}>Cargando notificaciones...</p>}
        {error && !loading && (
          <button type="button" onClick={() => void load()} className="mt-3 text-sm underline" style={{ color: "#2C3E2D" }}>
            Actualizar la lista
          </button>
        )}
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