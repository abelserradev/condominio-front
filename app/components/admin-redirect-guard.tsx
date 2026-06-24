"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ADMIN_INICIO = "/admin/inicio";

/**
 * Solo el admin del edificio (rol "admin") se redirige al panel si visita rutas públicas.
 * SuperAdmin usa /super/* y propietarios /mi-apartamento — no deben ser interceptados.
 */
export function AdminRedirectGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("admin_token");
    const rol = localStorage.getItem("user_rol");

    // Propietarios, inquilinos y superadmin gestionan sus propias rutas
    if (!token || rol !== "admin") return;

    const esRutaAdmin = pathname?.startsWith("/admin");
    const esLogin = pathname === "/admin/login";
    const esSuperLogin = pathname === "/super/login";
    const esRegistro = pathname === "/registro";
    const esSuper = pathname?.startsWith("/super");

    if ((!esRutaAdmin || esLogin) && !esRegistro && !esSuper && !esSuperLogin) {
      router.replace(ADMIN_INICIO);
    }
  }, [pathname, router]);

  return <>{children}</>;
}
