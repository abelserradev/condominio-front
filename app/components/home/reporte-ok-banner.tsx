"use client";

import { useSearchParams } from "next/navigation";

export function ReporteOkBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("reporte") !== "ok") return null;
  return (
    <div className="mb-6 rounded-xl border-2 border-primary/30 bg-primary/10 px-4 py-3 text-center text-foreground">
      Pago reportado correctamente.
    </div>
  );
}
