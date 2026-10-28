import type { Prenda } from "@/types/prenda";
import styles from "../../app/fashion-sections.module.css";

interface Props {
  prenda: Prenda;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
}

function parseTags(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function GarmentCard({ prenda, selectable, selected, onToggle, onOpen }: Props) {
  const title = prenda.nombre || prenda.categoria;
  const tags = parseTags(prenda.etiquetas);

  return (
    <button
      type="button"
      onClick={selectable ? onToggle : onOpen}
      className={`${styles.garmentCard} w-full`}
      data-selected={selected}
      aria-pressed={selectable ? Boolean(selected) : undefined}
      aria-haspopup={!selectable && onOpen ? "dialog" : undefined}
      aria-label={selectable ? `${title}, ${selected ? "seleccionada" : "no seleccionada"}` : title}
    >
      {selected && (
        <span
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#0B493D] text-xs text-white"
          aria-hidden="true"
        >
          ✓
        </span>
      )}
      <div className={styles.garmentImage}>
        {prenda.urlImagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prenda.urlImagen}
            alt={title}
            className="block h-full w-full object-contain"
          />
        ) : (
          <span className="text-center text-xs font-semibold text-[#55524C]">Sin imagen</span>
        )}
      </div>
      <div className={styles.garmentDetails}>
        <h3 className={styles.garmentTitle}>
          {title}
        </h3>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className={styles.tag}>{prenda.categoria}</span>
          {prenda.talle && <span className={styles.tag}>Talle {prenda.talle}</span>}
        </div>
        {prenda.color && <p className={styles.garmentMeta}>Color: {prenda.color}</p>}
        {prenda.descripcion && <p className={`${styles.garmentMeta} line-clamp-2`}>{prenda.descripcion}</p>}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={`${styles.tag} truncate`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
