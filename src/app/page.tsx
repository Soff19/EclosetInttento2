"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  //const handleSubmit = async (e) => {
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

  return (
    <div className="min-h-screen flex font-sans" style={{ background: "#F9F5F0" }}>

      {/* LEFT — editorial fashion panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-12"
        style={{ background: "#2C3E2D" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #A8C5A0 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #C9A96E 0%, transparent 50%)`
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full border border-[#A8C5A0] flex items-center justify-center">
              <span className="text-[#A8C5A0] text-lg leading-none">+</span>
            </div>
            <span className="text-[#A8C5A0] text-xs tracking-[0.4em] uppercase font-medium">ECloset</span>
          </div>
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <p className="text-[#C9A96E] text-xs tracking-[0.35em] uppercase mb-6">Your sustainable wardrobe</p>
          <h1 className="text-white leading-tight mb-8" style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.02em" }}>
            Dress with<br />
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "#A8C5A0" }}>intention.</em>
          </h1>
          <p className="text-[#8FAF87] text-sm leading-relaxed max-w-xs" style={{ fontWeight: 300 }}>
            Fashion that honors the planet — and your personal style. Every choice you make matters.
          </p>
          <div className="flex gap-4 mt-10">
            <div className="px-4 py-2 rounded-full border border-[#3d5c3e]" style={{ background: "rgba(168,197,160,0.08)" }}>
              <p className="text-[#A8C5A0] text-xs tracking-wider">🌿 Carbon neutral</p>
            </div>
            <div className="px-4 py-2 rounded-full border border-[#3d5c3e]" style={{ background: "rgba(201,169,110,0.08)" }}>
              <p className="text-[#C9A96E] text-xs tracking-wider">✦ Curated brands</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 border-t border-[#3d5c3e] pt-6">
          <p className="text-[#8FAF87] text-xs leading-relaxed italic" style={{ fontWeight: 300 }}>
            {'"Style is a way to say who you are without having to speak."'}
          </p>
          <p className="text-[#4a6e4b] text-xs mt-1 tracking-wider">— Rachel Zoe</p>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative">
        <div className="absolute top-8 right-8 text-[#C9A96E] opacity-20 select-none" style={{ fontSize: "120px", fontWeight: 200, lineHeight: 1 }}>✦</div>
        <div className="absolute bottom-12 left-6 text-[#A8C5A0] opacity-15 select-none" style={{ fontSize: "80px" }}>◎</div>

        <div className="w-full max-w-sm relative z-10">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-full border border-[#2C3E2D] flex items-center justify-center">
              <span className="text-[#2C3E2D] text-base leading-none">+</span>
            </div>
            <span className="text-[#2C3E2D] text-xs tracking-[0.4em] uppercase font-medium">ECloset</span>
          </div>

          <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "#C9A96E" }}>Welcome back</p>
          <h2 className="mb-1" style={{ fontSize: "2.25rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#1a1a1a" }}>
            Sign in
          </h2>
          <p className="text-sm mb-10" style={{ color: "#9a9a8e", fontWeight: 300 }}>
            Your closet awaits — let&apos;s make it sustainable.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: "#fff0f0", border: "1px solid #ffcccc", color: "#cc4444" }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#6b6b60" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3.5 text-sm transition-all outline-none"
                style={{
                  background: "#fff",
                  border: "1px solid #e8e4de",
                  borderRadius: "12px",
                  color: "#1a1a1a",
                }}
                onFocus={e => (e.target.style.borderColor = "#A8C5A0")}
                onBlur={e => (e.target.style.borderColor = "#e8e4de")}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium tracking-wider uppercase" style={{ color: "#6b6b60" }}>
                  Password
                </label>
                <a href="#" className="text-xs transition-colors" style={{ color: "#C9A96E" }}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full px-4 py-3.5 pr-11 text-sm transition-all outline-none"
                  style={{
                    background: "#fff",
                    border: "1px solid #e8e4de",
                    borderRadius: "12px",
                    color: "#1a1a1a"
                  }}
                  onFocus={e => (e.target.style.borderColor = "#A8C5A0")}
                  onBlur={e => (e.target.style.borderColor = "#e8e4de")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#b0b0a5" }}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.166-3.668M6.343 6.343A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-1.356 2.618M6.343 6.343L3 3m3.343 3.343l11.314 11.314M10 10a3 3 0 004 4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-sm font-medium tracking-widest uppercase transition-all mt-2"
              style={{
                background: loading ? "#5a7a5b" : "#2C3E2D",
                color: "#F9F5F0",
                borderRadius: "12px",
                letterSpacing: "0.15em"
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#3d5c3e" }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#2C3E2D" }}
            >
              {loading ? "Iniciando sesión..." : "Enter my closet"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="flex-1 h-px" style={{ background: "#e8e4de" }} />
              <span className="text-xs" style={{ color: "#c0bdb7" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "#e8e4de" }} />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => window.location.href = '/api/auth/google'}
              className="w-full py-3.5 text-sm flex items-center justify-center gap-3 transition-all"
              style={{
                background: "#fff",
                border: "1px solid #e8e4de",
                borderRadius: "12px",
                color: "#4a4a42"
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#C9A96E")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#e8e4de")}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs mt-8" style={{ color: "#b0b0a5" }}>
            New to ECloset?{" "}
            <Link href="/register" className="font-medium transition-colors" style={{ color: "#2C3E2D" }}>
              Create your account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}