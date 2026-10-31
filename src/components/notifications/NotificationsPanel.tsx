"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, ExternalLink, LoaderCircle, Star, X } from "lucide-react";
import { getContactHref } from "@/lib/contact";
import SellerProfileDialog from "@/components/notifications/SellerProfileDialog";

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

interface NotificationsPanelProps {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sellerProfileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [sellerProfileId, setSellerProfileId] = useState<string | null>(null);
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

  const closeSellerProfile = useCallback(() => {
    setSellerProfileId(null);
    requestAnimationFrame(() => sellerProfileTriggerRef.current?.focus());
  }, []);

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

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKeys);
    return () => window.removeEventListener("keydown", handleDialogKeys);
  }, [onClose]);

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
    <>
      <button
        type="button"
        aria-label="Cerrar notificaciones"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-[#0B493D]/10"
      />
      <section
        id="notifications-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
        className="fixed right-3 top-24 z-50 flex max-h-[calc(100dvh-7rem)] w-[min(34rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[#E5E1D9] bg-[#FFFEFB] font-[family-name:var(--font-nunito-sans)] text-[#333333] shadow-[0_20px_70px_rgba(11,73,61,0.2)] sm:right-6 sm:top-28 sm:max-h-[calc(100dvh-8rem)]"
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#E5E1D9] bg-[#F7F1E7] px-4 py-4 sm:flex-nowrap sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6CAF7B]">Tu actividad</p>
            <h2 id="notifications-title" className="font-[family-name:var(--font-cormorant-garamond)] text-2xl font-semibold leading-tight text-[#0B493D]">
              Notificaciones
            </h2>
            <p className="mt-0.5 text-xs text-[#6b6b60]">
              {noLeidas === 1 ? "Tenés 1 aviso sin leer." : `Tenés ${noLeidas} avisos sin leer.`}
            </p>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll || openingId !== null}
                aria-label="Marcar todas como leídas"
                title="Marcar todas como leídas"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#A8BC99] bg-white text-[#0B493D] transition hover:bg-[#C6EFD6]/60 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] active:scale-[0.98]"
              >
                <CheckCheck size={18} aria-hidden="true" />
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Volver al Home"
              title="Volver al Home"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E5E1D9] bg-white px-3 text-sm font-semibold text-[#0B493D] transition hover:bg-[#C6EFD6]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
            >
              <span>Volver al Home</span>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">

        {error && <div role="alert" className="mb-4 rounded-xl border border-[#FF8F7E] bg-[#FFF3F0] px-4 py-3 text-sm text-[#702D25]">{error}</div>}
        {actionMessage && <div role="status" className="mb-4 rounded-xl border border-[#A8BC99] bg-[#C6EFD6]/70 px-4 py-3 text-sm text-[#0B493D]">{actionMessage}</div>}
        {!loading && !error && items.length === 0 && (
          <section className="rounded-2xl border border-[#E5E1D9] bg-white px-5 py-14 text-center">
            <Bell size={28} className="mx-auto mb-3 text-[#6CAF7B]" aria-hidden="true" />
            <h2 className="font-[family-name:var(--font-cormorant-garamond)] text-2xl text-[#0B493D]">Todavía no tienes avisos</h2>
            <p className="mt-1 text-sm text-[#6b6b60]">Aquí aparecerán las interacciones sobre tus publicaciones.</p>
          </section>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`flex items-start gap-3 rounded-xl border p-4 transition-colors sm:p-5 ${
                item.leidaEn
                  ? "border-[#E5E1D9] bg-white"
                  : "border-[#A8BC99] bg-[#C6EFD6]/35 shadow-[0_3px_14px_rgba(11,73,61,0.05)]"
              }`}
            >
              <span
                className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.leidaEn ? "border border-[#C7C2B8] bg-white" : "bg-[#6CAF7B]"}`}
                aria-label={item.leidaEn ? "Leída" : "Sin leer"}
              />
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => void openNotification(item)} disabled={openingId !== null || markingAll} className="w-full text-left disabled:opacity-60 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]">
                  <p className={`text-sm leading-6 ${item.leidaEn ? "font-normal text-[#55524C]" : "font-bold text-[#0B493D]"}`}>
                    {item.tipo === "SOLICITUD_COMPRA"
                      ? `${item.actor?.nombre || "Un usuario"} quiere comprar ${item.producto?.titulo ? `“${item.producto.titulo}”` : "tu publicación"}.`
                      : item.mensaje}
                  </p>
                  <p className="mt-1 text-xs text-[#6b6b60]">
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
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#A8BC99] bg-[#A8BC99] px-4 py-2 text-sm font-bold text-[#0B493D] transition hover:border-[#93AA84] hover:bg-[#93AA84] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] active:scale-[0.98]"
                      >
                        {processingCompraId === item.compra.id && processingAction === "ACEPTADA" ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                        Aceptar solicitud
                      </button>
                      <button
                        type="button"
                        onClick={() => void decidePurchase(item, "DENEGADA")}
                        disabled={processingCompraId !== null}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E5E1D9] bg-white px-4 py-2 text-sm font-semibold text-[#8f4646] transition hover:border-[#FF8F7E] hover:bg-[#FFF3F0] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] active:scale-[0.98]"
                      >
                        {processingCompraId === item.compra.id && processingAction === "DENEGADA" ? <LoaderCircle size={15} className="animate-spin" /> : <X size={15} />}
                        Denegar solicitud
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#6b6b60]">
                      Estado: {item.compra?.estado === "ACEPTADA" ? "Aceptada" : item.compra?.estado === "DENEGADA" ? "Denegada" : item.compra?.estado === "CONCRETADA" ? "Compra concretada" : "Solicitud ya resuelta"}
                    </p>
                  )
                )}
                {item.tipo === "SOLICITUD_COMPRA_ACEPTADA" && item.actor && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm leading-6 text-[#55524C]">
                      Podés comunicarte con el vendedor para coordinar. Después de concretar la compra, podés confirmar el encuentro y puntuar su servicio para ayudar a otros usuarios.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {getContactHref(item.producto?.contacto) && (
                        <a href={getContactHref(item.producto?.contacto) || undefined} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#0B493D] underline underline-offset-2 hover:bg-[#C6EFD6]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]">
                          Contactar al vendedor <ExternalLink size={13} />
                        </a>
                      )}
                      <button
                        ref={sellerProfileTriggerRef}
                        type="button"
                        onClick={(event) => {
                          sellerProfileTriggerRef.current = event.currentTarget;
                          setSellerProfileId(item.actor?.id ?? null);
                        }}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#0B493D] underline underline-offset-2 hover:bg-[#C6EFD6]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
                      >
                        Ver perfil del vendedor <Star size={13} />
                      </button>
                    </div>
                    {item.compra?.estado === "ACEPTADA" && (
                      <button
                        type="button"
                        onClick={() => void confirmCompletion(item)}
                        disabled={processingCompraId !== null}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#A8BC99] bg-[#A8BC99] px-4 py-2 text-sm font-bold text-[#0B493D] transition hover:border-[#93AA84] hover:bg-[#93AA84] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] active:scale-[0.98]"
                      >
                        {processingCompraId === item.compra.id && processingAction === "CONCRETADA" ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                        Confirmar compra concretada
                      </button>
                    )}
                    {item.compra?.estado === "CONCRETADA" && (
                      <Link href={`/perfil/${item.actor.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#A8BC99] bg-[#A8BC99] px-4 py-2 text-sm font-bold text-[#0B493D] transition hover:border-[#93AA84] hover:bg-[#93AA84] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] active:scale-[0.98]">
                        <Star size={15} /> Puntuar al vendedor
                      </Link>
                    )}
                  </div>
                )}
                {item.producto && (
                  <button type="button" onClick={() => void openNotification(item)} disabled={openingId !== null || markingAll} className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#0B493D] hover:bg-[#C6EFD6]/50 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]">
                    Ver publicación <ExternalLink size={13} />
                  </button>
                )}
              </div>
              {item.producto?.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.producto.imagen} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-[#E5E1D9] bg-[#F2E6D5] object-contain p-1 sm:h-20 sm:w-20" />
              )}
            </article>
          ))}
        </div>

        {loading && <p className="py-8 text-center text-sm text-[#6b6b60]" role="status">Cargando notificaciones...</p>}
        {error && !loading && (
          <button type="button" onClick={() => void load()} className="mt-3 min-h-10 rounded-lg px-3 text-sm font-semibold text-[#0B493D] underline underline-offset-2 hover:bg-[#C6EFD6]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]">
            Actualizar la lista
          </button>
        )}
        {!loading && hasMore && (
          <button type="button" onClick={() => void load(page + 1, true)} className="mt-4 min-h-11 w-full rounded-xl border border-[#E5E1D9] bg-white py-3 text-sm font-bold text-[#0B493D] transition hover:border-[#A8BC99] hover:bg-[#C6EFD6]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]">
            Ver más
          </button>
        )}
        </div>
      </section>
      {sellerProfileId && (
        <SellerProfileDialog sellerId={sellerProfileId} onClose={closeSellerProfile} />
      )}
    </>
  );
}