"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { getOrCreateDeviceId, fetchUnreadAvisosCount } from "@/lib/api";
import { usePortalBranding } from "../platform/portal-branding-provider";

const logoUrbix = (
  <Image
    src="/logo_condominio.webp"
    alt="URBIX"
    width={160}
    height={40}
    className="h-8 w-auto shrink-0 object-contain md:h-[40px]"
    priority
  />
);

function tieneModoPlataforma(): boolean {
  return typeof document !== "undefined" && document.cookie.includes("platform_mode=1");
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const portalBranding = usePortalBranding();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // Siempre false hasta que el effect confirme en cliente — evita hydration mismatch
  // porque document.cookie no existe durante SSR
  const [esPlataformaClient, setEsPlataformaClient] = useState(false);

  useEffect(() => {
    // Ahora sí estamos en el cliente: leer cookie es seguro
    // Wrapped en función para evitar setState directo en effect body
    function actualizarModo() {
      setEsPlataformaClient(tieneModoPlataforma());
    }
    actualizarModo();
  }, [pathname]);

  useEffect(() => {
    function verificarSesion() {
      const token = localStorage.getItem("admin_token");
      setIsAdmin(!!token);
    }

    verificarSesion();
    const handleStorageChange = () => verificarSesion();
    globalThis.addEventListener("storage", handleStorageChange);
    globalThis.addEventListener("adminLogin", handleStorageChange);
    globalThis.addEventListener("adminLogout", handleStorageChange);
    const interval = setInterval(verificarSesion, 500);
    return () => {
      globalThis.removeEventListener("storage", handleStorageChange);
      globalThis.removeEventListener("adminLogin", handleStorageChange);
      globalThis.removeEventListener("adminLogout", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (pathname === "/registro") return;
    if (tieneModoPlataforma()) return;

    function cargarUnread() {
      const deviceId = getOrCreateDeviceId();
      if (!deviceId) return;
      fetchUnreadAvisosCount(deviceId).then(setUnreadCount);
    }

    cargarUnread();
    const interval = setInterval(cargarUnread, 60_000);

    const handleAvisosVisitados = () => {
      setUnreadCount(0);
      cargarUnread();
    };

    globalThis.addEventListener("avisosVisitados", handleAvisosVisitados);

    return () => {
      clearInterval(interval);
      globalThis.removeEventListener("avisosVisitados", handleAvisosVisitados);
    };
  }, [pathname]);

  function handleCerrarSesion() {
    localStorage.removeItem("admin_token");
    setIsAdmin(false);
    globalThis.dispatchEvent(new Event("adminLogout"));
    router.push("/");
  }

  const esAdminRoute = pathname?.startsWith("/admin");
  const esPlataforma = esPlataformaClient;
  const esPlataformaUi = esPlataforma || pathname === "/registro";

  const logoIconEdificio = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground sm:h-10 sm:w-10">
      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </span>
  );

  let marcaIzquierda: ReactNode;
  if (esAdminRoute) {
    marcaIzquierda = (
      <div className="flex items-center gap-3">
        {logoUrbix}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </span>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          URBIX Admin
        </span>
      </div>
    );
  } else if (esPlataformaUi) {
    marcaIzquierda = (
      <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
        {logoUrbix}
        <div className="min-w-0 flex flex-col justify-center leading-tight">
          <span className="text-sm font-semibold tracking-tight text-foreground sm:text-base md:text-lg">
            URBIX
          </span>
          <span className="text-[10px] text-muted-foreground sm:text-xs">Gestión multi-edificio</span>
        </div>
      </Link>
    );
  } else {
    const nombreEdificio = portalBranding?.nombre;
    marcaIzquierda = (
      <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
        {logoUrbix}
        {logoIconEdificio}
        <div className="min-w-0 flex flex-col justify-center leading-tight">
          <span className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base md:text-lg">
            {nombreEdificio ?? "URBIX"}
          </span>
          <span className="text-[10px] text-muted-foreground sm:text-xs">Portal de residentes</span>
        </div>
      </Link>
    );
  }

  let accionSesion: ReactNode;
  if (isAdmin) {
    accionSesion = (
      <button
        onClick={handleCerrarSesion}
        className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Cerrar sesión
      </button>
    );
  } else if (esPlataformaUi) {
    accionSesion = (
      <div className="flex items-center gap-2">
        <Link
          href="/super/login"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
        >
          Registrar edificio
        </Link>
      </div>
    );
  } else {
    accionSesion = (
      <Link
        href="/admin/login"
        className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Iniciar sesión
      </Link>
    );
  }

  const bellIcon = (
    <Link
      href="/avisos"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
      aria-label={unreadCount > 0 ? `Avisos de la administración (${unreadCount} sin leer)` : "Avisos de la administración"}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground"
          aria-hidden
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-card/80 sm:px-6">
      {marcaIzquierda}
      <div className="flex items-center gap-3">
        {!esAdminRoute && !esPlataformaUi && bellIcon}
        {accionSesion}
      </div>
    </header>
  );
}
