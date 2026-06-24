"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireRol } from "@/lib/hooks/useRequireRol";

export default function SuperPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const rol = useRequireRol(["superadmin"], "/super/login");

  if (!rol) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Verificando acceso…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100">
      <header className="border-b border-slate-200 bg-slate-900 px-4 py-4 text-white md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Plataforma</p>
            <h1 className="text-lg font-bold">SuperAdmin</h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/super/edificios"
              className={pathname === "/super/edificios" ? "font-semibold text-white" : "text-slate-300 hover:text-white"}
            >
              Edificios
            </Link>
            <Link href="/" className="text-slate-300 hover:text-white">
              Salir al portal
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
