"use client";

import { useState, useEffect } from "react";
import { fetchTasaBcv } from "@/lib/api";

function formatearTasaBcv(error: boolean, tasa: number | null): string {
  if (error) {
    return "—";
  }
  if (tasa == null) {
    return "…";
  }
  return `${tasa.toLocaleString("es-VE")} Bs`;
}

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
    <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-primary/10 px-5 py-4 sm:px-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </span>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-sm font-medium text-muted-foreground">Tasa BCV del día</p>
        <p className="text-xl font-bold text-secondary sm:text-2xl">
          {formatearTasaBcv(error, tasa)}
        </p>
      </div>
      <span className="shrink-0 text-right text-sm text-muted-foreground">Actualizado hoy</span>
    </div>
  );
}