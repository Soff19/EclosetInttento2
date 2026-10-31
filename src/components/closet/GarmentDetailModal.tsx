"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { Prenda } from "@/types/prenda";
import styles from "@/app/fashion-sections.module.css";

interface GarmentDetailModalProps {
  prenda: Prenda;
  onClose: () => void;
  onDeleted: (prendaId: string) => void;
}

function parseTags(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function GarmentDetailModal({ prenda, onClose, onDeleted }: GarmentDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      restoreFocus?.focus();
    };
  }, [onClose]);

  const tags = parseTags(prenda.etiquetas);
  const title = prenda.nombre || prenda.categoria;

  async function deleteGarment() {
    setDeleting(true);
    setDeleteError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/prendas/${encodeURIComponent(prenda.id)}`, {
        method: "DELETE",
        headers: token ? { Authorization: "Bearer " + token } : undefined,
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar la prenda.");
      onDeleted(prenda.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "No se pudo eliminar la prenda.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={styles.garmentDetailOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="garment-detail-title"
        tabIndex={-1}
        className={styles.garmentDetailDialog}
      >
        <button
          type="button"
          className={styles.garmentDetailClose}
          aria-label="Cerrar detalle de prenda"
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
        <div className={styles.garmentDetailLayout}>
          <div className={styles.garmentDetailImage}>
            {prenda.urlImagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prenda.urlImagen} alt={title} />
            ) : (
              <span>Sin imagen disponible</span>
            )}
          </div>
          <div className={styles.garmentDetailContent}>
            <p className={styles.garmentDetailEyebrow}>Detalle de tu closet</p>
            <h2 id="garment-detail-title" className={styles.garmentDetailTitle}>{title}</h2>
            <div className={styles.garmentDetailTags}>
              <span className={styles.tag}>{prenda.categoria}</span>
              {prenda.talle && <span className={styles.tag}>Talle {prenda.talle}</span>}
              {prenda.color && <span className={styles.tag}>{prenda.color}</span>}
            </div>

            {prenda.descripcion && (
              <div className={styles.garmentDetailField}>
                <h3>Descripción</h3>
                <p>{prenda.descripcion}</p>
              </div>
            )}

            {tags.length > 0 && (
              <div className={styles.garmentDetailField}>
                <h3>Etiquetas</h3>
                <div className={styles.garmentDetailTags}>
                  {tags.map((tag) => <span className={styles.tag} key={tag}>#{tag}</span>)}
                </div>
              </div>
            )}
            {deleteError && (
              <p role="alert" className={`${styles.error} mt-4`}>{deleteError}</p>
            )}
            {confirmDelete ? (
              <div className="mt-5 rounded-xl border border-[#E5E1D9] bg-white p-4">
                <p className="text-sm font-semibold text-[#333333]">¿Eliminar esta prenda de tu closet?</p>
                <p className="mt-1 text-xs text-[#55524C]">Esta acción no se puede deshacer.</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setConfirmDelete(false)}
                    className={`${styles.secondaryButton} flex-1`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void deleteGarment()}
                    className={`${styles.primaryButton} flex-1`}
                    style={{ borderColor: "#B85555", background: "#B85555", color: "#fff" }}
                  >
                    {deleting ? "Eliminando..." : "Sí, eliminar"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={`${styles.secondaryButton} mt-5 w-full`}
              >
                <Trash2 size={16} aria-hidden="true" />
                Eliminar prenda
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
