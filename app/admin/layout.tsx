"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./components/admin-sidebar";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <AdminSidebar />
      <main className="ml-64 flex-1 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}