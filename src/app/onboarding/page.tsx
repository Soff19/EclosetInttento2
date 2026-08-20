"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    genero: "",
    tallaSistema: "AR",
    tallesArriba: [] as string[],
    tallesAbajo: [] as string[],
    tallesCalzado: [] as string[],
    estilos: [] as string[],
    colores: "",
  });

  function toggleArray(key: "tallesArriba" | "tallesAbajo" | "tallesCalzado" | "estilos", value: string) {
    setForm((f) => ({
      ...f,
      [key]: (f as any)[key].includes(value) ? (f as any)[key].filter((v: string) => v !== value) : [...(f as any)[key], value],
    }));
  }

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    if (!form.genero || (form.tallesArriba.length === 0 && form.tallesAbajo.length === 0)) {
      setError("Por favor completá los campos obligatorios (género y al menos un talle)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar preferencias");
      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function skip() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al omitir");
      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const tallaArribaOptions = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const tallaAbajoOptions = [
    "30",
    "32",
    "34",
    "36",
    "38",
    "40",
    "42",
    "44",
    "46",
  ];
  const tallaCalzadoOptions = [
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
  ];
  const estiloOptions = ["Casual", "Formal", "Deportivo", "Boho", "Minimalista"];

  const equivalencias: Record<string, { arriba: string; abajo: string; calzado: string }> = {
    AR: {
      arriba: "XS=32-34 · S=36 · M=38 · L=40 · XL=42",
      abajo: "34=S · 36=M · 38=L · 40=XL",
      calzado: "EU: 35=US5 · 36=US6 · 37=US6.5-7 · 38=US7.5 · 39=US8 · 40=US9",
    },
    EU: {
      arriba: "XS=32-34 · S=36 · M=38 · L=40 · XL=42",
      abajo: "34=S · 36=M · 38=L · 40=XL",
      calzado: "EU numbers = EU sizes (35-44). Para US aproximado: 35=US5, 40=US7.5",
    },
    US: {
      arriba: "XS=0-2 · S=4-6 · M=8-10 · L=12-14 · XL=16",
      abajo: "US 2-4 = XS/S · 6-8 = M · 10-12 = L",
      calzado: "US numbers shown; ejemplo: US6 = EU36, US9 = EU40",
    },
  };

  return (
    <main className="min-h-screen px-5 pt-6 pb-16 relative overflow-hidden" style={{ background: "#F6F9F4" }}>
      <div className="absolute top-[-80px] left-[-60px] w-80 h-80 rounded-full blur-3xl opacity-30" style={{ background: "#BEE3C7" }} />
      <div className="relative z-10 max-w-2xl mx-auto">
        <BackLink href="/" label="Volver" />
        <div className="bg-gradient-to-r from-[#E6F4EA] to-[#F9F9F7] rounded-xl p-6 shadow-md mb-6">
          <p className="uppercase text-[10px] tracking-[0.18em]" style={{ color: "#C9A96E" }}>
            Bienvenida
          </p>
          <h1 className="text-[2rem] font-light mt-2 mb-2 text-[#1f3b2f]">Contanos un poco sobre vos ✦</h1>
          <p className="text-sm mb-2" style={{ color: "#6f6f63" }}>
            Completá este formulario para recibir recomendaciones personalizadas. Podés omitirlo si querés.
          </p>
          <div className="mt-3 text-sm">El formulario es rápido — seleccioná lo que mejor te represente.</div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#fff0f0", color: "#cc4444" }}>
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <form onSubmit={submit} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#6b6b60" }}>
              Género *
            </label>
            <select
              required
              value={form.genero}
              onChange={(e) => setForm({ ...form, genero: e.target.value })}
              className="w-full px-4 py-3.5 text-sm outline-none"
              style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: "12px" }}
            >
              <option value="">Seleccionar</option>
              <option value="Mujer">Mujer</option>
              <option value="Hombre">Hombre</option>
              <option value="No binario">No binario</option>
              <option value="Prefiero no decir">Prefiero no decir</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wider uppercase mb-2 mt-4" style={{ color: "#6b6b60" }}>
              Sistema de talles
            </label>
            <div className="flex gap-2">
              {(["AR", "EU", "US"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, tallaSistema: s })}
                  aria-pressed={form.tallaSistema === s}
                  className={`px-3 py-2 text-sm rounded-md border transition-transform duration-150 transform hover:-translate-y-0.5 ${form.tallaSistema === s ? "bg-gradient-to-r from-[#7FBF8F] to-[#2C3E2D] text-white shadow-md" : "bg-white text-[#2C3E2D] hover:bg-[#f0f7ef]"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="text-xs text-[#6b6b60] mt-2">Sistema seleccionado: {form.tallaSistema}</div>
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#6b6b60" }}>
              Talles - Parte de arriba *
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-2">
              {tallaArribaOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArray("tallesArriba", t)}
                  aria-pressed={form.tallesArriba.includes(t)}
                  className={`px-3 py-2 text-sm rounded-md border transition-transform duration-150 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#A8C5A0] active:scale-95 ${form.tallesArriba.includes(t) ? "bg-gradient-to-br from-[#7FBF8F] to-[#2C3E2D] text-white shadow-lg" : "bg-white text-[#2C3E2D] hover:bg-[#f4fbf5]"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="text-xs text-[#6b6b60]">{equivalencias[form.tallaSistema].arriba}</div>
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wider uppercase mb-2 mt-4" style={{ color: "#6b6b60" }}>
              Talles - Parte de abajo *
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 mb-2">
              {tallaAbajoOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArray("tallesAbajo", t)}
                  aria-pressed={form.tallesAbajo.includes(t)}
                  className={`px-3 py-2 text-sm rounded-md border transition-transform duration-150 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#A8C5A0] active:scale-95 ${form.tallesAbajo.includes(t) ? "bg-gradient-to-br from-[#7FBF8F] to-[#2C3E2D] text-white shadow-lg" : "bg-white text-[#2C3E2D] hover:bg-[#f4fbf5]"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="text-xs text-[#6b6b60]">{equivalencias[form.tallaSistema].abajo}</div>
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wider uppercase mb-2 mt-4" style={{ color: "#6b6b60" }}>
              Talles - Calzado
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 mb-2">
              {tallaCalzadoOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArray("tallesCalzado", t)}
                  aria-pressed={form.tallesCalzado.includes(t)}
                  className={`px-3 py-2 text-sm rounded-md border transition-transform duration-150 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#A8C5A0] active:scale-95 ${form.tallesCalzado.includes(t) ? "bg-gradient-to-br from-[#7FBF8F] to-[#2C3E2D] text-white shadow-lg" : "bg-white text-[#2C3E2D] hover:bg-[#f4fbf5]"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="text-xs text-[#6b6b60]">{equivalencias[form.tallaSistema].calzado}</div>
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#6b6b60" }}>
              Estilos favoritos
            </label>
            <div className="grid grid-cols-2 gap-2">
              {estiloOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArray("estilos", s)}
                  aria-pressed={form.estilos.includes(s)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#A8C5A0] active:scale-95 ${form.estilos.includes(s) ? "bg-[#2C3E2D] text-white" : "bg-white text-[#2C3E2D]"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#6b6b60" }}>
              Colores favoritos (separados por comas)
            </label>
            <input
              value={form.colores}
              onChange={(e) => setForm({ ...form, colores: e.target.value })}
              className="w-full px-4 py-3.5 text-sm outline-none"
              style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: "12px" }}
            />
          </div>

          <div className="flex gap-3">
            <button
              disabled={loading}
              type="submit"
              className="flex-1 py-4 text-sm uppercase tracking-[0.15em] rounded-[12px] transform transition-all duration-150 hover:shadow-xl"
              style={{ background: "linear-gradient(90deg,#7FBF8F,#2C3E2D)", color: "#F9F5F0" }}
            >
              {loading ? "Guardando..." : "Guardar y continuar"}
            </button>
            <button
              type="button"
              onClick={skip}
              disabled={loading}
              className="flex-1 py-4 text-sm uppercase tracking-[0.15em] rounded-[12px] border transform transition-colors duration-150 hover:bg-[#f4fbf5]"
              style={{ background: "#fff", color: "#2C3E2D", borderColor: "#e8e4de" }}
            >
              Omitir
            </button>
          </div>
          </form>
        </div>
      </div>
    </main>
  );
}
