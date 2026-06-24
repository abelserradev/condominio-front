"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTasaBcv, type TasaBcv } from "@/lib/api";

function formatearTasaBcv(error: boolean, tasa: number | null): string {
  if (error) {
    return "—";
  }
  if (tasa == null) {
    return "…";
  }
  return `${tasa.toLocaleString("es-VE")} Bs`;
}

function parsearFechaBcv(fecha?: string): { iso: string; dia: string; hora: string } | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) {
    return { iso: fecha, dia: fecha, hora: "" };
  }
  return {
    iso: fecha,
    dia: d.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    hora: d.toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

type Props = {
  /** Precargada en SSR para mostrar tasa al primer paint */
  initial?: TasaBcv | null;
};

export function TasaBcvDelDia({ initial = null }: Props) {
  const [tasa, setTasa] = useState<number | null>(initial?.promedio ?? null);
  const [fechaActualizacion, setFechaActualizacion] = useState<string | undefined>(
    initial?.fechaActualizacion,
  );
  const [error, setError] = useState(false);

  const cargarTasa = useCallback(() => {
    fetchTasaBcv()
      .then((d) => {
        setTasa(d.promedio);
        setFechaActualizacion(d.fechaActualizacion);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    cargarTasa();
    const interval = setInterval(cargarTasa, 60 * 60 * 1000);
    function onVisible() {
      if (document.visibilityState === "visible") cargarTasa();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [cargarTasa]);

  const fechaBcv = parsearFechaBcv(fechaActualizacion);

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-primary/10 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-muted-foreground">Tasa BCV del día</p>
          <p className="text-xl font-bold text-secondary sm:text-2xl">
            {formatearTasaBcv(error, tasa)}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/50 pt-2 text-center text-xs text-muted-foreground sm:border-0 sm:pt-0 sm:text-right sm:text-sm">
        <p className="font-medium text-muted-foreground/90">Actualizado</p>
        {fechaBcv ? (
          <time
            dateTime={fechaBcv.iso}
            className="mt-0.5 flex flex-col items-center gap-0.5 tabular-nums sm:items-end"
          >
            <span className="whitespace-nowrap">{fechaBcv.dia}</span>
            {fechaBcv.hora ? (
              <span className="whitespace-nowrap">{fechaBcv.hora}</span>
            ) : null}
          </time>
        ) : (
          <p className="mt-0.5">Sin fecha</p>
        )}
      </div>
    </div>
  );
}
