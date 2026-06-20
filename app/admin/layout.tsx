"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminSidebar } from "./components/admin-sidebar";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
      <div className="relative flex min-h-[calc(100vh-4rem)] bg-muted">
      <AdminSidebar
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
      />
      <main className="ml-0 flex-1 transition-all duration-300 md:ml-64">
        {children}
      </main>
      {/* FAB solo en mobile */}
      <button
        type="button"
        onClick={() => setSidebarAbierto(true)}
        className="fixed bottom-6 left-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-colors hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hidden"
        aria-label="Abrir menú"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}