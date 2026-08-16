"use client";

import { Search } from "lucide-react";

export default function ClosetSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-[16px]"
      style={{ background: "#fff", border: "1px solid #e8e4de" }}
    >
      <Search size={18} color="#9a9a8e" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar en tu closet..."
        className="w-full outline-none bg-transparent text-sm"
      />
    </div>
  );
}
