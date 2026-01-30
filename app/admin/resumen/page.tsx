"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminResumenPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="flex max-w-md flex-col items-center text-center">
        <Image
          src="/404-error-img.jpg"
          alt="Página en construcción"
          width={400}
          height={300}
          className="rounded-lg object-contain shadow-md"
          priority
        />
        <h1 className="mt-6 text-2xl font-bold text-slate-800">
          Resumen en construcción
        </h1>
        <p className="mt-2 text-slate-600">
          Esta sección estará disponible próximamente. Aquí podrás consultar el
          resumen del condominio.
        </p>
      </div>
    </div>
  );
}
