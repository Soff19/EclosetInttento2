"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoginIllustration from "@/components/auth/LoginIllustration";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryForm, setRecoveryForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const recoveryTriggerRef = useRef<HTMLButtonElement>(null);
  const recoveryDialogRef = useRef<HTMLElement>(null);
  const recoveryWasOpen = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      if (data.token) localStorage.setItem("token", data.token);
      router.push(data.redirectTo || "/home");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoveryMessage("");
    setRecoveryLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recoveryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la contraseña");

      setRecoveryMessage(data.message);
      setForm({ email: recoveryForm.email, password: "" });
      setRecoveryForm({ email: recoveryForm.email, password: "", confirmPassword: "" });
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setRecoveryLoading(false);
    }
  };

  useEffect(() => {
    if (!recoveryOpen) {
      if (recoveryWasOpen.current) {
        recoveryWasOpen.current = false;
        recoveryTriggerRef.current?.focus();
      }
      return;
    }

    recoveryWasOpen.current = true;
    const dialog = recoveryDialogRef.current;
    const focusableSelector = 'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const focusable = dialog?.querySelectorAll<HTMLElement>(focusableSelector);
    focusable?.[0]?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRecoveryOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog || !focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => document.removeEventListener("keydown", handleDialogKeyDown);
  }, [recoveryOpen]);

  return (
    <main className="auth-page grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#A8BC99] px-10 py-12 text-[#0B493D] lg:flex lg:flex-col lg:justify-between xl:px-16">
        <LoginIllustration />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0B493D] font-semibold" aria-hidden="true">E</span>
          <span className="text-sm font-bold uppercase tracking-[0.24em]">ECloset</span>
        </div>

        <div className="relative z-10 max-w-md py-14">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em]">Tu espacio personal</p>
          <h1 className="auth-editorial mb-5 text-6xl leading-[0.95] xl:text-7xl">
            Vestir con
            <br />
            intención.
          </h1>
          <p className="max-w-sm text-base leading-7">
            Organizá tus prendas y creá outfits desde un solo lugar.
          </p>
        </div>

        <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.16em]">
          ECLOSET
        </p>
      </aside>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:px-8 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 top-16 h-36 w-36 rounded-full bg-[#D4C5F9]/50" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-[#A6D8F7]/35" />

        <div className="relative z-10 w-full max-w-[27rem]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0B493D] font-semibold text-[#0B493D]" aria-hidden="true">E</span>
            <span className="text-sm font-bold uppercase tracking-[0.24em] text-[#0B493D]">ECloset</span>
          </div>

          <header className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0B493D]">Bienvenida</p>
            <h2 className="auth-editorial text-[2.75rem] leading-none sm:text-5xl">Iniciar sesión</h2>
            <p className="mt-3 text-base leading-6 text-[#55524C]">
              Ingresá a tu cuenta para continuar.
            </p>
          </header>

          {error && (
            <div role="alert" className="auth-alert mb-5 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="auth-label">Correo electrónico</label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="auth-input"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="login-password" className="auth-label mb-0">Contraseña</label>
                <button
                  type="button"
                  ref={recoveryTriggerRef}
                  onClick={() => {
                    setRecoveryOpen(true);
                    setRecoveryError("");
                    setRecoveryMessage("");
                    setRecoveryForm((current) => ({ ...current, email: form.email }));
                  }}
                  className="rounded-sm text-sm font-semibold text-[#0B493D] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B493D]"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Ingresá tu contraseña"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="auth-input pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  aria-controls="login-password"
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-[0.875rem] text-[#0B493D] focus-visible:outline-2 focus-visible:outline-[#0B493D]"
                >
                  {showPassword ? (
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.7 10.7 0 0112 5c4.5 0 8.3 2.9 9.5 7a10.7 10.7 0 01-3 4.4M6.2 6.2A10.6 10.6 0 002.5 12c1.3 4.1 5.1 7 9.5 7 1.1 0 2.2-.2 3.2-.5" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.5 12s3.3-7 9.5-7 9.5 7 9.5 7-3.3 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="3" strokeWidth={1.7} />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-button-primary w-full">
              {loading ? "Iniciando sesión..." : "Ingresar a mi clóset"}
            </button>

            <div className="flex items-center gap-4 py-1" aria-hidden="true">
              <div className="h-px flex-1 bg-[#C7C2B8]" />
              <span className="text-xs text-[#55524C]">o</span>
              <div className="h-px flex-1 bg-[#C7C2B8]" />
            </div>

            <button
              type="button"
              onClick={() => window.location.href = "/api/auth/google"}
              className="auth-button-secondary w-full gap-3"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#55524C]">
            ¿Todavía no tenés cuenta?{" "}
            <Link href="/register" className="font-bold text-[#0B493D] underline-offset-4 hover:underline">
              Crear una cuenta
            </Link>
          </p>
        </div>
      </section>

      {recoveryOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#0B493D]/45 px-4 py-6 sm:px-6">
          <section
            ref={recoveryDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-title"
            className="my-auto max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-[#C7C2B8] bg-[#F7F1E7] p-5 shadow-xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B493D]">Acceso a la cuenta</p>
                <h2 id="recovery-title" className="auth-editorial mt-2 text-3xl leading-tight">Restablecer contraseña</h2>
                <p className="mt-2 text-sm leading-5 text-[#55524C]">
                  Ingresá el correo de tu cuenta y elegí una contraseña nueva.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryOpen(false)}
                aria-label="Cerrar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-[#333333] hover:bg-[#E5E1D9] focus-visible:outline-2 focus-visible:outline-[#0B493D]"
              >
                ×
              </button>
            </div>

            {(recoveryError || recoveryMessage) && (
              <div
                role={recoveryError ? "alert" : "status"}
                className={`mt-5 rounded-xl border px-4 py-3 text-sm ${recoveryError ? "auth-alert" : "border-[#6CAF7B] bg-[#C6EFD6] text-[#0B493D]"}`}
              >
                {recoveryError || recoveryMessage}
              </div>
            )}

            <form onSubmit={handlePasswordRecovery} className="mt-6 space-y-4">
              <div>
                <label htmlFor="recovery-email" className="auth-label">Correo electrónico</label>
                <input
                  id="recovery-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={recoveryForm.email}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, email: e.target.value })}
                  required
                  className="auth-input"
                />
              </div>
              <div>
                <label htmlFor="recovery-password" className="auth-label">Nueva contraseña</label>
                <input
                  id="recovery-password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={recoveryForm.password}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, password: e.target.value })}
                  minLength={6}
                  required
                  className="auth-input"
                />
              </div>
              <div>
                <label htmlFor="recovery-confirm-password" className="auth-label">Confirmar contraseña</label>
                <input
                  id="recovery-confirm-password"
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Repetí la nueva contraseña"
                  value={recoveryForm.confirmPassword}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, confirmPassword: e.target.value })}
                  minLength={6}
                  required
                  className="auth-input"
                />
              </div>
              <button type="submit" disabled={recoveryLoading} className="auth-button-primary w-full">
                {recoveryLoading ? "Actualizando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
