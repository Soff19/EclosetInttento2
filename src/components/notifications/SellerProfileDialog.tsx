"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Star, X } from "lucide-react";

type PublicReview = {
  id: string;
  puntuacion: number;
  comentario: string | null;
  creadoEn: string;
  comprador: { nombre: string | null };
};

type SellerProfile = {
  seller: {
    id: string;
    nombre: string | null;
    fotoPerfil: string | null;
    fechaCreacion: string;
  };
  average: number | null;
  reviewCount: number;
  completedSalesCount: number;
  reviews: PublicReview[];
};

type SellerProfileResponse = {
  error?: string;
  seller?: SellerProfile["seller"];
  average?: number | null;
  reviewCount?: number;
  completedSalesCount?: number;
  reviews?: PublicReview[];
};

type SellerProfileDialogProps = {
  sellerId: string;
  onClose: () => void;
};

async function readProfile(response: Response): Promise<SellerProfileResponse> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    throw new Error(`El servidor devolvió una respuesta inesperada (HTTP ${response.status}).`);
  }
  try {
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Respuesta inválida");
    }
    return data as SellerProfileResponse;
  } catch {
    throw new Error(`El servidor devolvió una respuesta inesperada (HTTP ${response.status}).`);
  }
}

export default function SellerProfileDialog({ sellerId, onClose }: SellerProfileDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/usuarios/${encodeURIComponent(sellerId)}`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      const data = await readProfile(response);
      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar el perfil del vendedor.");
      }
      if (
        !data.seller
        || typeof data.reviewCount !== "number"
        || typeof data.completedSalesCount !== "number"
        || !Array.isArray(data.reviews)
      ) {
        throw new Error("La respuesta del perfil del vendedor está incompleta.");
      }
      setProfile({
        seller: data.seller,
        average: data.average ?? null,
        reviewCount: data.reviewCount,
        completedSalesCount: data.completedSalesCount,
        reviews: data.reviews,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el perfil del vendedor.");
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProfile(), 0);
    closeButtonRef.current?.focus();
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
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
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B493D]/45 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleDialogKeyDown}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-profile-title"
        className="flex max-h-[min(90dvh,52rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#A8BC99] bg-[#F9E6D2] text-[#333333] shadow-[0_24px_80px_rgba(11,73,61,0.24)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#A8BC99] bg-[#F7F1E7] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B493D]">Marketplace</p>
            <h2 id="seller-profile-title" className="font-[family-name:var(--font-cormorant-garamond)] text-2xl font-semibold text-[#0B493D]">
              Perfil del vendedor
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar perfil del vendedor"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#A8BC99] bg-white text-[#0B493D] transition hover:bg-[#C6EFD6]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loading && (
            <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-[#6b6b60]">
              <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
              Cargando perfil...
            </p>
          )}
          {!loading && error && (
            <div role="alert" className="rounded-2xl border border-[#FF8F7E] bg-[#FFF3F0] p-4 text-sm text-[#702D25]">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadProfile()}
                className="mt-3 min-h-10 rounded-lg px-3 font-semibold text-[#0B493D] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
              >
                Reintentar
              </button>
            </div>
          )}
          {!loading && profile && (
            <div className="space-y-4">
              <section className="flex items-center gap-4 rounded-3xl border border-[#A8BC99] bg-white/90 p-5 shadow-[0_8px_28px_rgba(51,51,51,0.06)] sm:gap-5 sm:p-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#C6EFD6] bg-[#F2E6D5] text-2xl font-bold text-[#0B493D] sm:h-24 sm:w-24">
                  {profile.seller.fotoPerfil ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.seller.fotoPerfil} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (profile.seller.nombre || "U").slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b6b60]">Perfil del vendedor</p>
                  <h3 className="truncate text-xl font-bold text-[#0B493D] sm:text-2xl">
                    {profile.seller.nombre || "Usuario de EClOset"}
                  </h3>
                  <p className="mt-1 text-xs text-[#6b6b60]">
                    En EClOset desde {new Date(profile.seller.fechaCreacion).toLocaleDateString("es", { month: "long", year: "numeric" })}
                  </p>
                </div>
              </section>

              <section aria-label="Actividad del vendedor" className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#A8BC99] bg-white/90 p-4 text-center">
                  <p className="text-2xl font-bold text-[#0B493D]">{profile.completedSalesCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b6b60]">Ventas concretadas</p>
                </div>
                <div className="rounded-2xl border border-[#A8BC99] bg-white/90 p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-[#0B493D]">
                    <Star size={20} className="text-[#B18B4A]" fill="currentColor" aria-hidden="true" />
                    {profile.average === null ? "—" : profile.average.toFixed(1)}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b6b60]">
                    {profile.reviewCount} {profile.reviewCount === 1 ? "reseña" : "reseñas"}
                  </p>
                </div>
              </section>

              <section className="rounded-3xl border border-[#A8BC99] bg-white/90 p-5 shadow-[0_8px_28px_rgba(51,51,51,0.04)] sm:p-6">
                <h3 className="font-[family-name:var(--font-cormorant-garamond)] text-xl font-semibold text-[#0B493D]">
                  Opiniones de la comunidad
                </h3>
                {profile.reviews.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[#6b6b60]">
                    <Star size={24} className="mx-auto mb-2 text-[#A8BC99]" aria-hidden="true" />
                    Todavía no hay puntuaciones para este vendedor.
                  </div>
                ) : (
                  <div className="mt-2 divide-y divide-[#A8BC99]/60">
                    {profile.reviews.map((review) => (
                      <article key={review.id} className="py-4 first:pt-3 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-[#0B493D]">
                            {review.comprador.nombre || "Usuario de EClOset"}
                          </p>
                          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#8A6B35]">
                            <Star size={14} fill="currentColor" aria-hidden="true" />
                            {review.puntuacion}/5
                          </span>
                        </div>
                        {review.comentario && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#55524C]">{review.comentario}</p>
                        )}
                        <p className="mt-2 text-xs text-[#6b6b60]">
                          {new Date(review.creadoEn).toLocaleDateString("es", { dateStyle: "medium" })}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
