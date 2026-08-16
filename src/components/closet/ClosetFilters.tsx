"use client";

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
    <div className="flex gap-2 overflow-x-auto pb-1">
      {chips.map((cat) => {
        const active = activa === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.12em] whitespace-nowrap"
            style={{
              background: active ? "#2C3E2D" : "#fff",
              color: active ? "#F9F5F0" : "#6b6b60",
              border: "1px solid #e8e4de",
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
