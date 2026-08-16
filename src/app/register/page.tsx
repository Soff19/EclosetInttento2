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

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#6b6b60" }}>
        {label}
      </label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-4 py-3.5 text-sm outline-none"
        style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: "12px" }}
      />
    </div>
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: "#F9F5F0" }}>
      <div className="w-full max-w-md">
        <BackLink href="/" label="Volver al inicio" />
        <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "#C9A96E" }}>
          Join ECloset
        </p>
        <h1 className="text-[2rem] font-light mb-8" style={{ letterSpacing: "-0.02em" }}>
          Create account
        </h1>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#fff0f0", color: "#cc4444" }}>
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          {field("nombre", "Nombre")}
          {field("email", "Email", "email")}
          {field("password", "Password", "password")}
          {field("confirmPassword", "Confirmar password", "password")}
          <button
            disabled={loading}
            className="w-full py-4 text-sm uppercase tracking-[0.15em]"
            style={{ background: "#2C3E2D", color: "#F9F5F0", borderRadius: "12px" }}
          >
            {loading ? "Creando..." : "Create account"}
          </button>
        </form>
        <p className="text-center text-xs mt-6" style={{ color: "#b0b0a5" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/" style={{ color: "#2C3E2D" }}>
            Iniciá sesión →
          </Link>
        </p>
      </div>
    </main>
  );
}
