"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Prenda } from "@/types/prenda";
import styles from "@/app/fashion-sections.module.css";

interface GarmentDetailModalProps {
  prenda: Prenda;
  onClose: () => void;
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

export default function GarmentDetailModal({ prenda, onClose }: GarmentDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

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
          </div>
        </div>
      </section>
    </div>
  );
}
