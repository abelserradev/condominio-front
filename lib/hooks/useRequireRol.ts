"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRequireRol(rolesPermitidos: string[]): string | null {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const userRol = localStorage.getItem("user_rol");

    if (!token || !userRol || !rolesPermitidos.includes(userRol)) {
      router.replace("/admin/login");
    }
  }, [rolesPermitidos, router]);

  if (typeof window === "undefined") return null;
  const userRol = localStorage.getItem("user_rol");
  if (!userRol || !rolesPermitidos.includes(userRol)) return null;
  return userRol;
}

export function getDatosPropietario(): {
  piso: number;
  apartamento: number;
  idUnico: string;
  edificio: string;
} | null {
  if (typeof window === "undefined") return null;
  const piso = localStorage.getItem("user_piso");
  const apartamento = localStorage.getItem("user_apartamento");
  if (!piso || !apartamento) return null;
  return {
    piso: parseInt(piso, 10),
    apartamento: parseInt(apartamento, 10),
    idUnico: localStorage.getItem("user_id_unico") ?? `P${piso}-A${apartamento}`,
    edificio: localStorage.getItem("user_edificio") ?? "",
  };
}

export function esPropietarioLogueado(): boolean {
  if (typeof window === "undefined") return false;
  const rol = localStorage.getItem("user_rol");
  return rol === "propietario" || rol === "inquilino";
}
