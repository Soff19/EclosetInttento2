"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, Star } from "lucide-react";
import BottomNavigation from "@/components/closet/BottomNavigation";

type PublicReview = {
  id: string;
  puntuacion: number;
  comentario: string | null;
  creadoEn: string;
  comprador: { nombre: string | null };
};

type ReviewablePurchase = {
  id: string;
  producto: { titulo: string };
};

type SellerProfile = {
  seller: { id: string; nombre: string | null; fotoPerfil: string | null; fechaCreacion: string };
  average: number | null;
  reviewCount: number;
  reviews: PublicReview[];
  reviewablePurchases: ReviewablePurchase[];
};

async function readJson(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    throw new Error(`El servidor devolvió una respuesta inesperada (HTTP ${response.status}).`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`El servidor devolvió una respuesta inesperada (HTTP ${response.status}).`);
  }
}

export default function PublicSellerProfilePage() {
  const params = useParams<{ id: string }>();
  const sellerId = params.id;
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState("");
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/usuarios/${encodeURIComponent(sellerId)}`, {
        cache: "no-store",
        headers: token ? { Authorization: "Bearer " + token } : undefined,
        credentials: "include",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el perfil.");
      setProfile(data as SellerProfile);
      setSelectedPurchaseId((current) =>
        current && data.reviewablePurchases.some((purchase: ReviewablePurchase) => purchase.id === current)
          ? current
          : data.reviewablePurchases[0]?.id || "",
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPurchaseId || submitting) return;
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/compras/${selectedPurchaseId}/resena`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ puntuacion, comentario }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "No se pudo enviar la puntuación.");
      setMessage("Gracias por compartir tu experiencia en EClOset.");
      setComentario("");
      await loadProfile();
      window.dispatchEvent(new Event("notificaciones:actualizadas"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo enviar la puntuación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-5 pt-6 pb-32" style={{ background: "#F9F5F0" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/notificaciones" className="inline-flex items-center gap-2 text-xs mb-6" style={{ color: "#6b6b60" }}>
          <ArrowLeft size={15} /> Volver a notificaciones
        </Link>

        {loading && <p className="py-12 text-center text-sm" style={{ color: "#9a9a8e" }}>Cargando perfil...</p>}
        {!loading && error && (
          <div role="alert" className="rounded-xl px-4 py-3 text-sm" style={{ background: "#fff0f0", color: "#b85555" }}>
            {error}
            <button type="button" onClick={() => void loadProfile()} className="ml-2 underline">Reintentar</button>
          </div>
        )}

        {profile && (
          <>
            <section className="rounded-[30px] p-6 mb-5 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-2xl" style={{ background: "linear-gradient(135deg,#d7ead4,#f4ede2)" }}>
                {profile.seller.fotoPerfil
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.seller.fotoPerfil} alt="" className="w-full h-full object-cover" />
                  : "👤"}
              </div>
              <div className="min-w-0">
                <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#6b6b60" }}>Perfil del vendedor</p>
                <h1 className="text-2xl font-light truncate">{profile.seller.nombre || "Usuario de EClOset"}</h1>
                <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: "#6b6b60" }}>
                  <span className="inline-flex items-center gap-1" style={{ color: "#8a6b35" }}>
                    <Star size={15} fill="currentColor" />
                    {profile.average === null ? "Sin puntuaciones" : profile.average.toFixed(1)}
                  </span>
                  {profile.average !== null && <span>· {profile.reviewCount} {profile.reviewCount === 1 ? "reseña" : "reseñas"}</span>}
                </div>
              </div>
            </section>

            {profile.reviewablePurchases.length > 0 && (
              <form onSubmit={submitReview} className="rounded-3xl p-5 mb-6" style={{ background: "#fff", border: "1px solid #e8e4de" }}>
                <h2 className="text-lg font-light">¿Cómo fue tu experiencia?</h2>
                <p className="text-xs mt-1 mb-4" style={{ color: "#9a9a8e" }}>
                  Compartí tu puntuación después de concretar la compra. Es opcional y ayuda a la comunidad.
                </p>
                {profile.reviewablePurchases.length > 1 && (
                  <label className="block text-xs mb-3" style={{ color: "#6b6b60" }}>
                    Compra
                    <select value={selectedPurchaseId} onChange={(event) => setSelectedPurchaseId(event.target.value)} className="block w-full mt-1 rounded-xl p-3 text-sm" style={{ border: "1px solid #e8e4de", background: "#F9F5F0" }}>
                      {profile.reviewablePurchases.map((purchase) => (
                        <option key={purchase.id} value={purchase.id}>{purchase.producto.titulo}</option>
                      ))}
                    </select>
                  </label>
                )}
                <fieldset className="mb-3">
                  <legend className="text-xs mb-2" style={{ color: "#6b6b60" }}>Puntuación</legend>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button key={value} type="button" onClick={() => setPuntuacion(value)} aria-label={`${value} estrellas`} aria-pressed={puntuacion === value}>
                        <Star size={23} fill={puntuacion >= value ? "#b18b4a" : "transparent"} color={puntuacion >= value ? "#b18b4a" : "#c9c5bd"} />
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="block text-xs" style={{ color: "#6b6b60" }}>
                  Comentario (opcional)
                  <textarea value={comentario} onChange={(event) => setComentario(event.target.value)} maxLength={2000} rows={3} className="block w-full mt-1 rounded-xl p-3 text-sm resize-y" style={{ border: "1px solid #e8e4de", background: "#F9F5F0" }} />
                </label>
                <button type="submit" disabled={submitting || !selectedPurchaseId} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 mt-4 text-sm disabled:opacity-50" style={{ background: "#2C3E2D", color: "#fff" }}>
                  {submitting && <LoaderCircle size={15} className="animate-spin" />}
                  Enviar puntuación
                </button>
              </form>
            )}

            {message && <p role="status" className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#edf4ea", color: "#2C3E2D" }}>{message}</p>}
            {!profile.reviews.length ? (
              <section className="py-12 text-center rounded-3xl" style={{ border: "1px solid #e8e4de", color: "#9a9a8e" }}>
                <Star size={25} className="mx-auto mb-2" />
                <p className="text-sm">Todavía no hay puntuaciones para este vendedor.</p>
              </section>
            ) : (
              <section>
                <h2 className="text-lg font-light mb-2">Opiniones de la comunidad</h2>
                <div className="divide-y" style={{ borderColor: "#e8e4de" }}>
                  {profile.reviews.map((review) => (
                    <article key={review.id} className="py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{review.comprador.nombre || "Usuario de EClOset"}</p>
                        <span className="inline-flex items-center gap-1 text-sm" style={{ color: "#8a6b35" }}>
                          <Star size={14} fill="currentColor" /> {review.puntuacion}/5
                        </span>
                      </div>
                      {review.comentario && <p className="text-sm mt-2 leading-relaxed" style={{ color: "#6b6b60" }}>{review.comentario}</p>}
                      <p className="text-xs mt-2" style={{ color: "#9a9a8e" }}>{new Date(review.creadoEn).toLocaleDateString("es", { dateStyle: "medium" })}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
