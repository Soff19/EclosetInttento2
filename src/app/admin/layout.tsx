"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [verificado, setVerificado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let activo = true;

    async function verificarAdmin() {
      try {
        const respuesta = await fetch("/api/auth/me");
        if (!respuesta.ok) {
          router.push("/");
          return;
        }

        const data = (await respuesta.json()) as {
          user?: { rol?: string | null } | null;
        };
        if (data.user?.rol === "ADMIN") {
          if (activo) setVerificado(true);
        } else {
          router.push("/home");
        }
      } catch {
        router.push("/");
      }
    }

    void verificarAdmin();
    return () => {
      activo = false;
    };
  }, [router]);

  if (!verificado) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5" style={{ background: "#F9F5F0", color: "#2C3E2D" }}>
        <p className="text-sm" role="status">Verificando credenciales de seguridad...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#F9F5F0" }}>
      <AdminNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
