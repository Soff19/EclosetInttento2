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
    setForm((current) => {
      const selected = current[key];
      return {
        ...current,
        [key]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
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
    <main className="auth-page min-h-screen px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0B493D] font-semibold text-[#0B493D]" aria-hidden="true">E</span>
          <span className="text-sm font-bold uppercase tracking-[0.24em] text-[#0B493D]">ECloset</span>
        </div>
        <BackLink href="/" label="Volver" className="!text-[#0B493D] font-semibold" />
        <header className="mb-7 border-b border-[#C7C2B8] pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B493D]">
            Bienvenida
          </p>
          <h1 className="auth-editorial mt-2 text-[2.75rem] leading-none sm:text-5xl">Contanos un poco sobre vos</h1>
          <p className="mt-3 text-base leading-6 text-[#55524C]">
            Completá este formulario para recibir recomendaciones personalizadas. Podés omitirlo si querés.
          </p>
          <p className="mt-3 text-sm text-[#55524C]">El formulario es rápido: seleccioná lo que mejor te represente.</p>
        </header>

        {error && (
          <div role="alert" className="auth-alert mb-5 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label htmlFor="onboarding-gender" className="auth-label">
              Género *
            </label>
            <select
              id="onboarding-gender"
              required
              value={form.genero}
              onChange={(e) => setForm({ ...form, genero: e.target.value })}
              className="auth-input"
            >
              <option value="">Seleccionar</option>
              <option value="Mujer">Mujer</option>
              <option value="Hombre">Hombre</option>
              <option value="No binario">No binario</option>
              <option value="Prefiero no decir">Prefiero no decir</option>
            </select>
          </div>

          <div>
            <p className="auth-label">
              Sistema de talles
            </p>
            <div role="group" aria-label="Sistema de talles" className="flex flex-wrap gap-2">
              {(["AR", "EU", "US"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, tallaSistema: s })}
                  aria-pressed={form.tallaSistema === s}
                  className="auth-choice min-w-16"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-2 text-sm text-[#55524C]">Sistema seleccionado: {form.tallaSistema}</div>
          </div>

          <div>
            <p className="auth-label">
              Talles - Parte de arriba *
            </p>
            <div role="group" aria-label="Talles para parte de arriba" className="mb-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {tallaArribaOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArray("tallesArriba", t)}
                  aria-pressed={form.tallesArriba.includes(t)}
                  className="auth-choice w-full"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="text-sm leading-5 text-[#55524C]">{equivalencias[form.tallaSistema].arriba}</div>
          </div>

          <div>
            <p className="auth-label">
              Talles - Parte de abajo *
            </p>
            <div role="group" aria-label="Talles para parte de abajo" className="mb-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {tallaAbajoOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArray("tallesAbajo", t)}
                  aria-pressed={form.tallesAbajo.includes(t)}
                  className="auth-choice w-full"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="text-sm leading-5 text-[#55524C]">{equivalencias[form.tallaSistema].abajo}</div>
          </div>

          <div>
            <p className="auth-label">
              Talles - Calzado
            </p>
            <div role="group" aria-label="Talles de calzado" className="mb-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {tallaCalzadoOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArray("tallesCalzado", t)}
                  aria-pressed={form.tallesCalzado.includes(t)}
                  className="auth-choice w-full"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="text-sm leading-5 text-[#55524C]">{equivalencias[form.tallaSistema].calzado}</div>
          </div>

          <div>
            <p className="auth-label">
              Estilos favoritos
            </p>
            <div role="group" aria-label="Estilos favoritos" className="grid grid-cols-2 gap-2">
              {estiloOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArray("estilos", s)}
                  aria-pressed={form.estilos.includes(s)}
                  className="auth-choice w-full"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="onboarding-colors" className="auth-label">
              Colores favoritos (separados por comas)
            </label>
            <input
              id="onboarding-colors"
              name="colores"
              placeholder="Ej.: verde, crema, azul"
              value={form.colores}
              onChange={(e) => setForm({ ...form, colores: e.target.value })}
              className="auth-input"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              disabled={loading}
              type="submit"
              className="auth-button-primary flex-1"
            >
              {loading ? "Guardando..." : "Guardar y continuar"}
            </button>
            <button
              type="button"
              onClick={skip}
              disabled={loading}
              className="auth-button-secondary flex-1"
            >
              Omitir
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
