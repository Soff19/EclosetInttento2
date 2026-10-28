"use client";

import styles from "../../app/fashion-sections.module.css";

export default function ClosetFilters({
  categorias,
  activa,
  onChange,
}: {
  categorias: string[];
  activa: string;
  onChange: (v: string) => void;
}) {
  const chips = ["Todos", ...categorias];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por categoría">
      {chips.map((cat) => {
        const active = activa === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            type="button"
            aria-pressed={active}
            className={styles.filterChip}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
