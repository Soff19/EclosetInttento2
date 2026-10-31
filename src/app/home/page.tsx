"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Layers, Plus, Shirt, User } from "lucide-react";
import EditorialSectionBanner from "@/components/EditorialSectionBanner";
import BottomNavigation from "@/components/closet/BottomNavigation";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import HomeCarousel, { type HomeCarouselItem } from "@/components/home/HomeCarousel";
import ClimaActual from "@/components/home/ClimaActual";
import CarruselClima from "@/components/home/CarruselClima";
import type { DatosClima } from "@/types/clima";
import type { Prenda } from "@/types/prenda";
import styles from "./home.module.css";

type User = { nombre: string | null; email: string };
type Outfit = {
  id: string;
  nombre: string;
  categoria?: string | null;
  descripcion?: string | null;
  outfitPrendas: { prenda: Prenda }[];
};
type MarketProduct = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: string;
  imagen: string | null;
  favorito: boolean;
  usuario: { nombre: string | null; email: string };
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [noLeidas, setNoLeidas] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadError, setUnreadError] = useState("");
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [marketProducts, setMarketProducts] = useState<MarketProduct[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");
  const [favoriteError, setFavoriteError] = useState("");
  const [clima, setClima] = useState<DatosClima | null>(null);
  const [loadingCloset, setLoadingCloset] = useState(true);
  const [closetError, setClosetError] = useState("");
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
    notificationButtonRef.current?.focus();
  }, []);

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
    async function loadCloset() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [prendasResponse, outfitsResponse] = await Promise.all([
          fetch("/api/prendas", { headers, credentials: "include" }),
          fetch("/api/outfits", { headers, credentials: "include" }),
        ]);
        if (!prendasResponse.ok || !outfitsResponse.ok) {
          throw new Error("No pudimos cargar tu closet. Intentá actualizar la página.");
        }
        const [prendasData, outfitsData] = await Promise.all([
          prendasResponse.json(),
          outfitsResponse.json(),
        ]);
        setPrendas(prendasData.prendas || []);
        setOutfits(outfitsData.outfits || []);
      } catch (error) {
        setClosetError(error instanceof Error ? error.message : "Error al cargar tu closet.");
      } finally {
        setLoadingCloset(false);
      }
    }

    void loadCloset();
  }, []);

  useEffect(() => {
    async function loadUnread() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/notificaciones?limit=1", {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "No se pudo actualizar el contador de notificaciones.");
        }
        setNoLeidas(data.noLeidas);
        setUnreadError("");
      } catch (error) {
        setUnreadError(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el contador de notificaciones.",
        );
      }
    }

    void loadUnread();
    window.addEventListener("notificaciones:actualizadas", loadUnread);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadUnread();
    };
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("notificaciones:actualizadas", loadUnread);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    async function loadMarketProducts() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/productos", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        const data: { productos?: MarketProduct[]; error?: string } = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar las recomendaciones del Market.");
        }
        setMarketProducts(data.productos || []);
        setMarketError("");
      } catch (error) {
        setMarketError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las recomendaciones del Market.",
        );
      } finally {
        setMarketLoading(false);
      }
    }

    void loadMarketProducts();
  }, []);

  const prendasCarousel: HomeCarouselItem[] = prendas.map((prenda) => ({
    id: prenda.id,
    title: prenda.nombre || prenda.categoria,
    category: prenda.categoria,
    description: [
      prenda.color ? `Color ${prenda.color}` : "",
      prenda.talle ? `Talle ${prenda.talle}` : "",
      prenda.descripcion || "",
    ].filter(Boolean).join(" · ") || "Una prenda de tu closet.",
    href: "/closet",
    images: [{ src: prenda.urlImagen, alt: prenda.nombre || prenda.categoria }],
    details: [prenda.color, prenda.talle ? `Talle ${prenda.talle}` : ""].filter((value): value is string => Boolean(value)),
  }));

  const outfitsCarousel: HomeCarouselItem[] = outfits.map((outfit) => ({
    id: outfit.id,
    title: outfit.nombre,
    category: outfit.categoria || "Sin categoría",
    description: outfit.descripcion || `${outfit.outfitPrendas.length} prendas en este look.`,
    href: `/outfits?outfit=${encodeURIComponent(outfit.id)}`,
    images: outfit.outfitPrendas.slice(0, 4).map(({ prenda }) => ({
      src: prenda.urlImagen,
      alt: prenda.nombre || prenda.categoria,
    })),
    details: [`${outfit.outfitPrendas.length} ${outfit.outfitPrendas.length === 1 ? "prenda" : "prendas"}`],
  }));

  const marketCarousel: HomeCarouselItem[] = marketProducts.map((producto) => ({
    id: producto.id,
    title: producto.titulo,
    category: producto.estado,
    description: producto.descripcion || `Publicado por ${producto.usuario.nombre || producto.usuario.email}.`,
    href: `/productos?producto=${encodeURIComponent(producto.id)}`,
    images: producto.imagen ? [{ src: producto.imagen, alt: producto.titulo }] : [],
    details: [`$${producto.precio}`],
    favorite: producto.favorito,
  }));

  const favoritesCarousel = marketProducts
    .filter((producto) => producto.favorito)
    .map((producto) => ({
      id: producto.id,
      title: producto.titulo,
      category: producto.estado,
      description: producto.descripcion || `Publicado por ${producto.usuario.nombre || producto.usuario.email}.`,
      href: `/productos?producto=${encodeURIComponent(producto.id)}`,
      images: producto.imagen ? [{ src: producto.imagen, alt: producto.titulo }] : [],
      details: [`$${producto.precio}`],
      favorite: producto.favorito,
    }));

  async function toggleMarketFavorite(item: HomeCarouselItem) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/productos/${encodeURIComponent(item.id)}/favorito`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      const data: { favorito?: boolean; error?: string } = await response.json();
      if (!response.ok || typeof data.favorito !== "boolean") {
        throw new Error(data.error || "No se pudo actualizar el favorito.");
      }
      const favorito = data.favorito;

      setMarketProducts((products) =>
        products.map((product) =>
          product.id === item.id ? { ...product, favorito } : product,
        ),
      );
      setFavoriteError("");
    } catch (error) {
      setFavoriteError(
        error instanceof Error ? error.message : "No se pudo actualizar el favorito.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F1E7] pb-32 font-[family-name:var(--font-nunito-sans)] text-[#333333]">
      <EditorialSectionBanner
        id="home-title"
        eyebrow="Tu guardarropa, en un solo lugar"
        title={`Hola, ${user?.nombre || "usuaria"}`}
        description="Tu closet en la nube. Prendas y outfits sincronizados."
      >
        <div className={styles.bannerActionLinks}>
          <button
            ref={notificationButtonRef}
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-expanded={notificationsOpen}
            aria-controls="notifications-panel"
            aria-label={noLeidas ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
            title="Notificaciones"
            className={`${styles.bannerActionLink} relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]`}
          >
            <Bell size={18} aria-hidden="true" />
            {noLeidas > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#A8BC99] bg-[#FF8F7E] px-1 text-[10px] font-bold text-[#333333]">
                {noLeidas > 99 ? "99+" : noLeidas}
              </span>
            )}
          </button>
        </div>
      </EditorialSectionBanner>
      {notificationsOpen && <NotificationsPanel onClose={closeNotifications} />}
      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6">
        {unreadError && (
          <p role="status" className="mb-4 text-sm text-[#8b3838]">
            {unreadError} El contador conserva el último dato disponible.
          </p>
        )}

        <div className="mb-5 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
          <ClimaActual onWeatherChange={setClima} />
          <CarruselClima
            clima={clima}
            prendas={prendas}
            outfits={outfits}
            cargandoPrendas={loadingCloset}
          />
        </div>

        <div className="mb-5">
          <HomeCarousel
            title="Recomendaciones del Market"
            eyebrow="Publicaciones disponibles"
            items={marketCarousel}
            loading={marketLoading}
            error={marketError}
            emptyMessage="Todavía no hay publicaciones disponibles en el Market."
            layout="market"
            onToggleFavorite={toggleMarketFavorite}
          />
        </div>

        {favoriteError && (
          <p role="alert" className="mb-4 text-sm text-[#8b3838]">
            {favoriteError}
          </p>
        )}

        <div className="mb-5">
          <HomeCarousel
            title="Mis favoritos"
            eyebrow="Guardados del Market"
            items={favoritesCarousel}
            loading={marketLoading}
            error={marketError}
            emptyMessage="Todavía no guardaste publicaciones en favoritos."
            layout="market"
            onToggleFavorite={toggleMarketFavorite}
          />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
          <HomeCarousel
            title="Mis prendas"
            eyebrow="Tu colección"
            items={prendasCarousel}
            loading={loadingCloset}
            error={closetError}
            emptyMessage="Todavía no tenés prendas. Sumá la primera a tu closet."
            layout="garment"
          />

          <HomeCarousel
            title="Mis outfits"
            eyebrow="Looks guardados"
            items={outfitsCarousel}
            loading={loadingCloset}
            error={closetError}
            emptyMessage="Todavía no guardaste outfits. ¡Armá tu primer look!"
            layout="outfit"
          />
        </div>

        <section aria-label="Accesos rápidos" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/closet", title: "Mi Closet", desc: "Ver prendas", Icon: Shirt },
            { href: "/outfits", title: "Outfits", desc: "Armar looks", Icon: Layers },
            { href: "/prendas/nueva", title: "Nueva prenda", desc: "Subir foto", Icon: Plus },
            { href: "/perfil", title: "Perfil", desc: "Tu cuenta", Icon: User },
          ].map(({ href, title, desc, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-[#E5E1D9] bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#A8BC99] hover:shadow-[0_8px_24px_rgba(11,73,61,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D] active:scale-[0.98] sm:p-5"
            >
              <Icon size={20} aria-hidden="true" className="mb-4 text-[#6CAF7B]" />
              <p className="text-base font-semibold text-[#0B493D]">{title}</p>
              <p className="mt-1 text-sm text-[#6b6b60]">{desc}</p>
            </Link>
          ))}
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
}
