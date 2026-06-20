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
    <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-green-200 bg-green-50/80 px-5 py-4 sm:px-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </span>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-sm font-medium text-slate-600">Tasa BCV del día</p>
        <p className="text-xl font-bold text-green-700 sm:text-2xl">
          {error ? "—" : tasa == null ? "…" : `${tasa.toLocaleString("es-VE")} Bs`}
        </p>
      </div>
      <span className="shrink-0 text-right text-sm text-slate-500">Actualizado hoy</span>
    </div>
  );
}