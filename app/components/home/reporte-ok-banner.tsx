"use client";

import { useSearchParams } from "next/navigation";

export function ReporteOkBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("reporte") !== "ok") return null;
  return (
    <div className="mb-6 rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3 text-center text-green-800">
      Pago reportado correctamente.
    </div>
  );
}
