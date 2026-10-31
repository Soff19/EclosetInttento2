"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrarse");
      if (data.token) localStorage.setItem("token", data.token);
      router.push(data.redirectTo || "/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form, label: string, type = "text", autoComplete: string = key) => (
    <div>
      <label htmlFor={`register-${key}`} className="auth-label">
        {label}
      </label>
      <input
        id={`register-${key}`}
        type={type}
        name={key}
        autoComplete={autoComplete}
        required
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="auth-input"
      />
    </div>
  );

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0B493D] font-semibold text-[#0B493D]" aria-hidden="true">E</span>
          <span className="text-sm font-bold uppercase tracking-[0.24em] text-[#0B493D]">ECloset</span>
        </div>
        <BackLink href="/" label="Volver al inicio" className="!text-[#0B493D] font-semibold" />
        <header className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0B493D]">
            Crear cuenta
          </p>
          <h1 className="auth-editorial text-[2.75rem] leading-none sm:text-5xl">
            Sumate a ECloset
          </h1>
          <p className="mt-3 text-base leading-6 text-[#55524C]">
            Completá tus datos para crear tu cuenta.
          </p>
        </header>
        {error && (
          <div role="alert" className="auth-alert mb-5 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-5">
          {field("nombre", "Nombre", "text", "name")}
          {field("email", "Correo electrónico", "email")}
          {field("password", "Contraseña", "password", "new-password")}
          {field("confirmPassword", "Confirmar contraseña", "password", "new-password")}
          <button
            disabled={loading}
            className="auth-button-primary mt-2 w-full"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-[#55524C]">
          ¿Ya tenés cuenta?{" "}
          <Link href="/" className="font-bold text-[#0B493D] underline-offset-4 hover:underline">
            Iniciá sesión →
          </Link>
        </p>
      </div>
    </main>
  );
}
