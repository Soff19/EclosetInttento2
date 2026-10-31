"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Heart, Plus, Search, Trash2, X } from "lucide-react";
import BackLink from "@/components/BackLink";
import BottomNavigation from "@/components/closet/BottomNavigation";
import NuevoProductoForm, {
  MARKETPLACE_COLORS,
  MARKETPLACE_SIZES,
  MARKETPLACE_STYLES,
  MARKETPLACE_TYPES,
} from "@/components/productos/NuevoProductoForm";
import EditorialSectionBanner from "@/components/EditorialSectionBanner";
import styles from "../fashion-sections.module.css";

type Producto = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: string;
  imagen: string | null;
  etiquetas: string[];
  contacto: string | null;
  favorito: boolean;
  solicitudEstado: string | null;
  promedio: number | null;
  esPropio: boolean;
  usuario: {
    id: string;
    nombre: string | null;
    email: string;
  };
};

type ApiResponse = Record<string, unknown>;
type MarketplaceFilter = "style" | "type" | "color" | "size";

function unexpectedResponseMessage(status: number) {
  if (status === 404) {
    return "El servidor no encontró esta ruta (404). Actualizá la página y, si el problema continúa, contactá al equipo de EClOset.";
  }
  return `El servidor devolvió una respuesta inesperada (HTTP ${status}). Intentá nuevamente.`;
}

async function readApiResponse<T extends ApiResponse>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    throw new Error(unexpectedResponseMessage(response.status));
  }

  try {
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Respuesta JSON inválida");
    }
    return data as T;
  } catch {
    throw new Error(unexpectedResponseMessage(response.status));
  }
}

function getApiError(data: ApiResponse, fallback: string) {
  return typeof data.error === "string" ? data.error : fallback;
}

function getProductTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim().toLowerCase());
  }
  if (typeof value !== "string") return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim().toLowerCase());
    }
  } catch {
    return value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  }

  return [];
}

function formatProductTag(tag: string): string {
  const [category, ...parts] = tag.split("-");
  const value = parts.join("-");
  if (category === "tipo" && value) {
    const type = MARKETPLACE_TYPES.find(([option]) => option === value)?.[1];
    return `Tipo: ${type || value}`;
  }
  if (category === "color" && value) {
    const color = MARKETPLACE_COLORS.find(([option]) => option === value)?.[1];
    return `Color: ${color || value}`;
  }
  if (category === "talle" && value) return `Talle: ${value.toUpperCase()}`;
  if (category === "sistema" && value) return `Sistema de talles: ${value.toUpperCase()}`;
  const style = MARKETPLACE_STYLES.find(([option]) => option === tag)?.[1];
  if (style) return style;
  return tag.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [openFilter, setOpenFilter] = useState<MarketplaceFilter | null>(null);
  const [activeTab, setActiveTab] = useState<"explorar" | "mias">("explorar");
  const [selected, setSelected] = useState<Producto | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changePriceOpen, setChangePriceOpen] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishedProductsVersion, setPublishedProductsVersion] = useState(0);
  const publishButtonRef = useRef<HTMLButtonElement>(null);

  const closePublish = useCallback(() => {
    setPublishOpen(false);
    requestAnimationFrame(() => publishButtonRef.current?.focus());
  }, []);

  const handleProductPublished = useCallback(() => {
    setPublishOpen(false);
    setPublishedProductsVersion((version) => version + 1);
    requestAnimationFrame(() => publishButtonRef.current?.focus());
  }, []);

  const visibleProducts = productos.filter((producto) => {
    const productTags = getProductTags(producto.etiquetas);
    const productDetails = `${producto.titulo} ${producto.descripcion}`.toLowerCase();
    return (
      (!typeFilter || productDetails.includes(typeFilter) || productTags.includes(`tipo-${typeFilter}`)) &&
      (!colorFilter || productTags.includes(`color-${colorFilter}`)) &&
      (!sizeFilter || productTags.includes(`talle-${sizeFilter.toLowerCase()}`))
    );
  });
  const selectedProductTags = selected ? getProductTags(selected.etiquetas) : [];
  const filterControls = [
    {
      id: "style" as const,
      label: "Estilo",
      value: tag,
      options: [
        { value: "", label: "Todos" },
        ...MARKETPLACE_STYLES.map(([value, label]) => ({ value, label })),
      ],
      onSelect: setTag,
    },
    {
      id: "type" as const,
      label: "Tipo",
      value: typeFilter,
      options: [
        { value: "", label: "Todos" },
        ...MARKETPLACE_TYPES.map(([value, label]) => ({ value, label })),
      ],
      onSelect: setTypeFilter,
    },
    {
      id: "color" as const,
      label: "Color",
      value: colorFilter,
      options: [
        { value: "", label: "Todos" },
        ...MARKETPLACE_COLORS.map(([value, label]) => ({ value, label })),
      ],
      onSelect: setColorFilter,
    },
    {
      id: "size" as const,
      label: "Talle",
      value: sizeFilter,
      options: [
        { value: "", label: "Todos" },
        ...MARKETPLACE_SIZES.map((value) => ({ value, label: value })),
      ],
      onSelect: setSizeFilter,
    },
  ];

  useEffect(() => {
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (tag) params.set("etiqueta", tag);
      if (activeTab === "mias") params.set("mias", "true");
      const res = await fetch(`/api/productos?${params}`);
      const data = await readApiResponse<{ productos?: Producto[]; error?: string }>(res);
      if (!res.ok) {
        setProductos([]);
        setLoadError(getApiError(data, "No se pudieron cargar las publicaciones."));
        return;
      }
      setLoadError("");
      const loadedProducts = data.productos || [];
      setProductos(loadedProducts);
      const requestedProductId = new URLSearchParams(window.location.search).get("producto");
      if (requestedProductId) {
        const requestedProduct = loadedProducts.find((item: Producto) => item.id === requestedProductId);
        if (requestedProduct) setSelected(requestedProduct);
        else {
          const response = await fetch(`/api/productos?id=${encodeURIComponent(requestedProductId)}`);
          const result = await readApiResponse<{ productos?: Producto[] }>(response);
          if (response.ok && result.productos?.[0]) setSelected(result.productos[0]);
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, tag, activeTab, publishedProductsVersion]);

  async function action<T extends ApiResponse = ApiResponse>(path: string, body?: object): Promise<T> {
    const token = localStorage.getItem("token");
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await readApiResponse<T>(res);
    if (!res.ok)
      throw new Error(getApiError(data, "No se pudo completar la acción"));
    return data;
  }

  async function toggleFavorite(producto: Producto) {
    try {
      const data = await action<{ favorito: boolean }>(`/api/productos/${producto.id}/favorito`);
      setProductos((items) =>
        items.map((item) =>
          item.id === producto.id ? { ...item, favorito: data.favorito } : item,
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Iniciá sesión para guardar favoritos",
      );
    }
  }

  async function buy(producto: Producto) {
    try {
      const result = await action<{
        created?: boolean;
        emailSent?: boolean | null;
        compra?: { estado: string };
      }>(`/api/productos/${producto.id}/comprar`);
      const solicitudEstado = result.compra?.estado || "PENDIENTE";
      window.dispatchEvent(new Event("notificaciones:actualizadas"));
      setMessage(
        result.created === false
          ? `Ya existe una solicitud tuya para esta publicación (estado: ${solicitudEstado.toLowerCase()}).`
          : result.emailSent
            ? "Solicitud pendiente registrada. El vendedor recibió una notificación en EClOset y un correo."
            : "Solicitud pendiente registrada y aviso guardado en EClOset. No pudimos enviar el correo al vendedor; no hace falta que repitas la solicitud.",
      );
      setProductos((items) =>
        items.map((item) =>
          item.id === producto.id ? { ...item, solicitudEstado } : item,
        ),
      );
      setSelected({ ...producto, solicitudEstado });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la compra",
      );
    }
  }

  async function deleteProduct() {
    if (!selected) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/productos/${selected.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      const data = await readApiResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(getApiError(data, "No se pudo eliminar la publicación"));
      setProductos((items) => items.filter((item) => item.id !== selected.id));
      setSelected(null);
      setConfirmDelete(false);
      setDeleteError("");
      setMessage("Publicación eliminada.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "No se pudo eliminar la publicación");
    } finally {
      setDeleting(false);
    }
  }

  async function changeProductPrice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || savingPrice) return;
    const price = Number(priceInput);
    if (!Number.isFinite(price) || price < 0) {
      setPriceError("Ingresá un precio válido.");
      return;
    }

    setSavingPrice(true);
    setPriceError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/productos/${encodeURIComponent(selected.id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ precio: price }),
      });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(getApiError(data, "No se pudo actualizar el precio."));

      setProductos((items) =>
        items.map((item) => item.id === selected.id ? { ...item, precio: price } : item),
      );
      setSelected((item) => item?.id === selected.id ? { ...item, precio: price } : item);
      setChangePriceOpen(false);
      setMessage("Precio actualizado.");
    } catch (error) {
      setPriceError(error instanceof Error ? error.message : "No se pudo actualizar el precio.");
    } finally {
      setSavingPrice(false);
    }
  }

  return (
    <main className={`${styles.page} ${styles.marketplacePage} min-h-screen px-0 pb-32 pt-0`}>
      <EditorialSectionBanner
        id="marketplace-title"
        eyebrow="Compra, vende y reutiliza"
        title="Marketplace"
        description="Explorá publicaciones de la comunidad y encontrá prendas para reutilizar."
        intro={<BackLink href="/home" label="Volver al inicio" iconOnly className={`!mb-0 ${styles.bannerBackLink}`} />}
      >
        <div className={styles.marketplaceBannerActions}>
          <div className={styles.marketplaceTabs} role="group" aria-label="Publicaciones">
            {([
              ["explorar", "Explorar"],
              ["mias", "Mis publicaciones"],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className={styles.marketplaceTab}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            ref={publishButtonRef}
            type="button"
            onClick={() => setPublishOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={publishOpen}
            aria-controls="marketplace-publish-dialog"
            className={styles.marketplacePublish}
          >
            <Plus size={16} aria-hidden="true" /> Publicar
          </button>
        </div>
      </EditorialSectionBanner>
      <div className={`${styles.content} relative z-10 px-4 pt-6 sm:px-6`}>
        <div className={styles.marketplaceToolbar}>
          <label className={styles.marketplaceSearch}>
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar publicaciones</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar prendas, estilos..."
            />
          </label>
          <div className={styles.marketplaceAttributeFilters}>
            {filterControls.map((filter) => {
              const selectedLabel = filter.options.find((option) => option.value === filter.value)?.label;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-label={`${filter.label}${selectedLabel && filter.value ? `: ${selectedLabel}` : ""}`}
                  aria-expanded={openFilter === filter.id}
                  aria-controls="marketplace-filter-options"
                  onClick={() => setOpenFilter(openFilter === filter.id ? null : filter.id)}
                  className={styles.marketplaceAttributeTrigger}
                >
                  <span className={styles.marketplaceAttributeLabel}>
                    {filter.label}
                    {filter.value && <small>{selectedLabel}</small>}
                  </span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          {openFilter && (
            <div
              id="marketplace-filter-options"
              className={styles.marketplaceAttributeOptions}
              role="group"
              aria-label={`${filterControls.find((filter) => filter.id === openFilter)?.label} opciones`}
            >
              {filterControls
                .find((filter) => filter.id === openFilter)
                ?.options.map((option) => {
                  const filter = filterControls.find((item) => item.id === openFilter);
                  if (!filter) return null;
                  return (
                    <button
                      key={option.value || "todos"}
                      type="button"
                      aria-pressed={filter.value === option.value}
                      onClick={() => {
                        filter.onSelect(option.value);
                        setOpenFilter(null);
                      }}
                      className={styles.marketplaceAttributeOption}
                    >
                      {option.label}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
        {(message || loadError) && (
          <p
            className={`${styles.marketplaceMessage} ${loadError ? styles.marketplaceError : ""}`}
            role={loadError ? "alert" : "status"}
          >
            {loadError || message}
          </p>
        )}
        <div className={styles.marketplaceGrid}>
          {visibleProducts.map((producto) => (
            <article key={producto.id} className={styles.marketplaceCard}>
              <button
                onClick={() => {
                  setSelected(producto);
                }}
                className={styles.marketplaceProduct}
              >
                <div className={styles.marketplaceImage}>
                  {producto.imagen && (
                    <img
                      src={producto.imagen}
                      alt={producto.titulo}
                    />
                  )}
                </div>
                <div className={styles.marketplaceProductInfo}>
                  <div className={styles.marketplaceProductHeading}>
                    <h2>{producto.titulo}</h2>
                    <span>${producto.precio}</span>
                  </div>
                  <p className={styles.marketplaceMeta}>
                    {producto.esPropio ? "Mi publicación" : producto.usuario.nombre || producto.usuario.email} · {producto.estado}
                  </p>
                  <div className={styles.marketplaceTags}>
                    {getProductTags(producto.etiquetas).slice(0, 3).map((item) => (
                      <span key={item}>#{item}</span>
                    ))}
                  </div>
                </div>
              </button>
              <div className={styles.marketplaceCardFooter}>
                <span className={styles.marketplaceRating}>
                  {producto.promedio
                    ? `★ ${producto.promedio.toFixed(1)}`
                    : "Sin reseñas"}
                </span>
                <button
                  aria-label="Guardar en favoritos"
                  onClick={() => toggleFavorite(producto)}
                  className={`${styles.marketplaceFavorite} ${producto.favorito ? styles.marketplaceFavoriteActive : ""}`}
                >
                  <Heart
                    size={17}
                    fill={producto.favorito ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </article>
          ))}
        </div>
        {visibleProducts.length === 0 && !loadError && (
          <p className={styles.marketplaceEmpty}>
            {activeTab === "mias"
              ? "Todavía no hiciste publicaciones."
              : "No encontramos publicaciones con esos filtros."}
          </p>
        )}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(26,26,26,0.4)" }}
        >
          <section
            className={`${styles.marketplaceModal} w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6`}
          >
            <div className="flex justify-between">
              <div>
                <p
                  className="uppercase text-[10px] tracking-wider"
                  style={{ color: "#9a9a8e" }}
                >
                  Detalle de publicación
                </p>
                <h2 className="text-2xl font-light mt-1">{selected.titulo}</h2>
              </div>
              <button
                aria-label="Cerrar detalle"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={`${styles.marketplaceDetailImage} mt-5`}>
              {selected.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.imagen} alt={selected.titulo} />
              ) : (
                <span>Imagen no disponible</span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl">${selected.precio}</span>
              <span className="text-xs uppercase tracking-wider">
                {selected.estado}
              </span>
            </div>
            <p className="text-sm mt-3 whitespace-pre-wrap" style={{ color: "#6b6b60" }}>
              {selected.descripcion || "Sin descripción."}
            </p>
            {selectedProductTags.length > 0 && (
              <div className={styles.marketplaceTags} aria-label="Información de la prenda">
                {selectedProductTags.map((item) => (
                  <span key={item}>{formatProductTag(item)}</span>
                ))}
              </div>
            )}
            <div className="mt-4">
              {selected.esPropio ? (
                <strong className="text-sm">Tu publicación</strong>
              ) : (
                <p className="text-sm">
                  Vende <strong>{selected.usuario.nombre || selected.usuario.email}</strong>
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              {selected.esPropio ? (
                <button
                  onClick={() => {
                    setDeleteError("");
                    setConfirmDelete(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm"
                  style={{ background: "#b85555", color: "#fff" }}
                >
                  <Trash2 size={16} /> Eliminar publicación
                </button>
              ) : (
                <button
                  disabled={selected.estado !== "DISPONIBLE" || selected.solicitudEstado !== null}
                  onClick={() => buy(selected)}
                  className="flex-1 rounded-xl py-3 text-sm disabled:opacity-40"
                  style={{ background: "#2C3E2D", color: "#fff" }}
                >
                  {selected.solicitudEstado === "PENDIENTE"
                    ? "Solicitud pendiente"
                    : selected.solicitudEstado === "ACEPTADA"
                      ? "Solicitud aceptada"
                      : selected.solicitudEstado === "CONCRETADA"
                        ? "Compra concretada"
                        : selected.solicitudEstado === "DENEGADA"
                          ? "Solicitud denegada"
                          : "Solicitar compra"}
                </button>
              )}
              {!selected.esPropio && selected.contacto && (
                <a
                  href={selected.contacto}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl px-4 text-sm"
                  style={{ border: "1px solid #2C3E2D", color: "#2C3E2D" }}
                >
                  Contactar <ExternalLink size={15} />
                </a>
              )}
            </div>
            {selected.esPropio && (
              <button
                type="button"
                onClick={() => {
                  setPriceInput(String(selected.precio));
                  setPriceError("");
                  setChangePriceOpen(true);
                }}
                className="mt-3 w-full rounded-xl py-3 text-sm font-semibold"
                style={{ border: "1px solid #2C3E2D", color: "#2C3E2D", background: "#fff" }}
              >
                Cambiar precio
              </button>
            )}
          </section>
        </div>
      )}
      {changePriceOpen && selected?.esPropio && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{ background: "rgba(26,26,26,0.55)" }}
        >
          <form
            onSubmit={changeProductPrice}
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-change-price-title"
            className={`${styles.marketplaceConfirmModal} w-full max-w-sm rounded-2xl p-6`}
          >
            <h2 id="marketplace-change-price-title" className="text-lg font-medium">Cambiar precio</h2>
            <label className="mt-4 block text-sm" htmlFor="marketplace-new-price">
              Nuevo precio
            </label>
            <input
              id="marketplace-new-price"
              type="number"
              min="0"
              step="0.01"
              required
              autoFocus
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E5E1D9] bg-white p-3 text-base outline-none focus:border-[#0B493D]"
            />
            {priceError && (
              <p className="mt-3 text-sm" role="alert" style={{ color: "#b85555" }}>{priceError}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={savingPrice}
                onClick={() => setChangePriceOpen(false)}
                className="flex-1 rounded-xl py-3 text-sm disabled:opacity-50"
                style={{ border: "1px solid #e8e4de", color: "#2C3E2D" }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPrice}
                className="flex-1 rounded-xl py-3 text-sm disabled:opacity-50"
                style={{ background: "#2C3E2D", color: "#fff" }}
              >
                {savingPrice ? "Guardando..." : "Guardar precio"}
              </button>
            </div>
          </form>
        </div>
      )}
      {confirmDelete && selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{ background: "rgba(26,26,26,0.55)" }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className={`${styles.marketplaceConfirmModal} w-full max-w-sm rounded-2xl p-6`}
          >
            <h2 id="confirm-delete-title" className="text-lg font-medium">
              ¿Estás seguro de eliminar esta publicación?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#6b6b60" }}>
              Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm" style={{ color: "#b85555" }}>{deleteError}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl py-3 text-sm disabled:opacity-50"
                style={{ border: "1px solid #e8e4de", color: "#2C3E2D" }}
              >
                Cancelar
              </button>
              <button
                disabled={deleting}
                onClick={deleteProduct}
                className="flex-1 rounded-xl py-3 text-sm disabled:opacity-50"
                style={{ background: "#b85555", color: "#fff" }}
              >
                {deleting ? "Eliminando..." : "Aceptar"}
              </button>
            </div>
          </section>
        </div>
      )}
      {publishOpen && (
        <NuevoProductoForm
          modal
          onClose={closePublish}
          onPublished={handleProductPublished}
        />
      )}
      <BottomNavigation />
    </main>
  );
}