"use client";

import { Search } from "lucide-react";
import styles from "../../app/fashion-sections.module.css";

export default function ClosetSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#C7C2B8] bg-white px-4">
      <Search size={18} color="#0B493D" aria-hidden="true" />
      <input
        type="search"
        aria-label="Buscar prendas en el closet"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar en tu closet..."
        className={`${styles.input} border-0 bg-transparent px-0 outline-none focus-visible:outline-none focus-visible:ring-0`}
      />
    </label>
  );
}
