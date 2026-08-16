import type { Prenda } from "@/types/prenda";

interface Props {
  prenda: Prenda;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
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

export default function GarmentCard({ prenda, selectable, selected, onToggle }: Props) {
  const title = prenda.nombre || prenda.categoria;
  const tags = parseTags(prenda.etiquetas);

  return (
    <button
      type="button"
      onClick={selectable ? onToggle : undefined}
      className="text-left overflow-hidden rounded-[24px] w-full relative"
      style={{
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        outline: selected ? "2px solid #2C3E2D" : "none",
      }}
    >
      {selected && (
        <span
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs"
          style={{ background: "#2C3E2D", color: "#F9F5F0" }}
        >
          ✓
        </span>
      )}
      {prenda.urlImagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={prenda.urlImagen} alt={title} className="w-full h-52 object-cover" />
      ) : (
        <div
          className="h-52 flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(135deg,#eaf4eb,#f4ede2)" }}
        >
          <span className="text-5xl">👗</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-light text-base" style={{ color: "#1a1a1a" }}>
          {title}
        </h3>
        <p className="text-[11px] uppercase tracking-[0.15em] mt-2" style={{ color: "#9a9a8e" }}>
          {prenda.categoria}
          {prenda.talle ? ` · Talle ${prenda.talle}` : ""}
        </p>
        {prenda.color && (
          <p className="text-sm font-light mt-1">Color: {prenda.color}</p>
        )}
        {prenda.descripcion && (
          <p className="text-xs mt-2 line-clamp-2" style={{ color: "#6b6b60" }}>
            {prenda.descripcion}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px]"
                style={{ background: "rgba(168,197,160,0.2)", color: "#3d5c3e" }}
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
