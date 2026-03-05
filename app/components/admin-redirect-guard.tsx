"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ADMIN_INICIO = "/admin/inicio";

/**
 * Si el usuario tiene sesión de admin y visita una ruta de propietario,
 * redirige a /admin/inicio para cargar directamente el panel admin.
 */
export function AdminRedirectGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    const esRutaAdmin = pathname?.startsWith("/admin");
    const esLogin = pathname === "/admin/login";
    if (!esRutaAdmin || esLogin) {
      router.replace(ADMIN_INICIO);
    }
  }, [pathname, router]);

  return <>{children}</>;
}
