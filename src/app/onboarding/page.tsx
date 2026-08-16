"use client";

import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";

export default function OnboardingPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen px-5 pt-6 pb-16 relative overflow-hidden" style={{ background: "#F9F5F0" }}>
      <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "#A8C5A0" }} />
      <div className="relative z-10 max-w-lg mx-auto">
        <BackLink href="/" label="Volver" />
        <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#C9A96E" }}>
          Bienvenida
        </p>
        <h1 className="text-[2rem] font-light mt-2 mb-4">Tu closet empieza acá ✦</h1>
        <p className="text-sm mb-8" style={{ color: "#9a9a8e" }}>
          Cargá prendas, armá outfits y explorá el market. Todo se guarda en la nube.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="w-full py-4 rounded-[12px] uppercase tracking-[0.15em] text-sm"
          style={{ background: "#2C3E2D", color: "#F9F5F0" }}
        >
          Empezar
        </button>
      </div>
    </main>
  );
}
