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
    const handleStorageChange = () => verificarSesion();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("adminLogin", handleStorageChange);
    window.addEventListener("adminLogout", handleStorageChange);
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

  const logoIcon = (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white">
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </span>
  );

  const bellIcon = (
    <Link
      href="/avisos"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
      aria-label="Avisos de la administración"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </Link>
  );
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6">
      {/* Izquierda: marca / título (solo un bloque) */}
      {esAdmin ? (
        <div className="flex items-center gap-3">
          {logoIcon}
          <span className="text-lg font-semibold tracking-tight text-slate-800">
            Condominio Residencia Sofia
          </span>
        </div>
      ) : (
        <Link href="/" className="flex items-center gap-3">
          {logoIcon}
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-slate-800">
              Residencia Sofia
            </span>
            <span className="text-xs text-slate-500">Portal de residentes</span>
          </div>
        </Link>
      )}
  
      {/* Derecha: notificaciones + sesión (solo un bloque) */}
      <div className="flex items-center gap-3">
        {!esAdmin && bellIcon}
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
      </div>
    </header>
  );
}