"use client";

import { useState, useEffect } from "react";
import { fetchTasaBcv } from "@/lib/api";

export function TasaBcvDelDia() {
  const [tasa, setTasa] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchTasaBcv()
      .then((d) => {
        setTasa(d.promedio);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-green-200 bg-green-50/50 px-6 py-4">
      <span className="text-center text-sm font-medium text-slate-600">
        Tasa BCV del día
      </span>
      <span className="text-center text-lg font-semibold text-green-700">
        {error ? "—" : tasa == null ? "…" : `${tasa.toLocaleString("es-VE")} Bs/USD`}
      </span>
    </div>
  );
}
