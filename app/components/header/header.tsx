"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    function verificarSesion() {
      const token = localStorage.getItem("admin_token");
      setIsAdmin(!!token);
    }

    verificarSesion();

    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      verificarSesion();
    };

    // Escuchar evento personalizado cuando se inicia sesión
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("adminLogin", handleStorageChange);
    window.addEventListener("adminLogout", handleStorageChange);

    // Verificar periódicamente (por si el evento no se dispara)
    const interval = setInterval(verificarSesion, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("adminLogin", handleStorageChange);
      window.removeEventListener("adminLogout", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  function handleCerrarSesion() {
    localStorage.removeItem("admin_token");
    setIsAdmin(false);
    window.dispatchEvent(new Event("adminLogout"));
    router.push("/");
  }

  const esAdmin = pathname?.startsWith("/admin");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {esAdmin ? (
        <span className="text-sm font-semibold tracking-tight text-slate-800 md:text-lg">
          Condominio Residencia Sofia
        </span>
      ) : (
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-slate-800 md:text-lg"
        >
          Condominio Residencia Sofia
        </Link>
      )}
      {isAdmin ? (
        <button
          onClick={handleCerrarSesion}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Cerrar sesión
        </button>
      ) : (
        <Link
          href="/admin/login"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Iniciar sesión
        </Link>
      )}
    </header>
  );
}