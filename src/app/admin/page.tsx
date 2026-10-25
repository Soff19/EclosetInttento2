"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Consultamos a tu API de sesión real del proyecto
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/");
          return;
        }
        
        const data = await res.json();
        
        // Validamos si el mail de la sesión activa pertenece a un administrador
        if (data.user && data.user.email.endsWith("@ecloset.com")) {
          setIsAdmin(true);
        } else {
          router.push("/home"); // Si es un usuario común, afuera al home
        }
      } catch (error) {
        router.push("/");
      }
    })();
  }, [router]);

  if (isAdmin === null) return <p className="p-6">Verificando credenciales de seguridad...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold text-green-800">Panel de Administración (Ecloset)</h1>
        <p className="text-gray-500">Bienvenido al centro de operaciones. Seleccioná una función para trabajar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/usuarios" className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-500 transition text-left group">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700">Gestionar Usuarios</h3>
          <p className="text-sm text-gray-500 mt-1">Ver lista de usuarios registrados, suspender cuentas o editar roles.</p>
        </Link>

        <Link href="/admin/prendas" className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-500 transition text-left group">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700"> Moderación de Prendas</h3>
          <p className="text-sm text-gray-500 mt-1">Revisar los artículos subidos al Ecloset general.</p>
        </Link>

        <Link href="/admin/reportes" className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-500 transition text-left group">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700">Reportes</h3>
          <p className="text-sm text-gray-500 mt-1">Acceder a informes y análisis de datos del sistema.</p>
        </Link>

      </div>
    </div>
  );
}
