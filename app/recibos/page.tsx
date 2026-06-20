"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PisosGrid } from "../components/recibos/pisos-grid";
import { ApartamentosGrid } from "../components/recibos/apartamentos-grid";
import {
  fetchPaymentsByApartamento,
  fetchRecibos,
  fetchAbono,
  getComprobanteUrl,
  type Payment,
  type Recibo,
} from "@/lib/api";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type Vista = "pisos" | "apartamentos" | "recibos";

function clasesBadgeEstadoPago(estado?: string): string {
  switch (estado) {
    case "aceptado":
      return "bg-secondary";
    case "rechazado":
      return "bg-destructive";
    default:
      return "bg-muted-foreground";
  }
}

function obtenerTextoEstado(estado?: string): string {
  switch (estado) {
    case "aceptado":
      return "Pagada";
    case "rechazado":
      return "Rechazada";
    default:
      return "Pendiente";
  }
}

function clasesBadgeEstadoRecibo(estado: string): string {
  switch (estado) {
    case "aceptado":
      return "bg-primary/20 text-foreground";
    case "rechazado":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function obtenerTextoEstadoRecibo(estado: string): string {
  switch (estado) {
    case "aceptado":
      return "Pagado";
    case "rechazado":
      return "Rechazado";
    default:
      return "En revisión";
  }
}

function obtenerDetalleEstadoPago(
  estado: string | undefined,
  fechaFormateada: string,
): string {
  if (estado === "aceptado") {
    return `Aprobada el ${fechaFormateada}`;
  }
  if (estado === "rechazado") {
    return "Rechazada";
  }
  return "Pendiente";
}

export default function RecibosPage() {
  const [vista, setVista] = useState<Vista>("pisos");
  const [pisoSeleccionado, setPisoSeleccionado] = useState<number | null>(null);
  const [apartamentoSeleccionado, setApartamentoSeleccionado] = useState<
    number | null
  >(null);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [recibosPendientes, setRecibosPendientes] = useState<Recibo[]>([]);
  const [abono, setAbono] = useState<number>(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPiso = (piso: number) => {
    setPisoSeleccionado(piso);
    setApartamentoSeleccionado(null);
    setVista("apartamentos");
  };

  const handleSelectApartamento = (apartamento: number) => {
    setApartamentoSeleccionado(apartamento);
    setVista("recibos");
  };

  const volverAPisos = () => {
    setVista("pisos");
    setPisoSeleccionado(null);
    setApartamentoSeleccionado(null);
  };

  const volverAApartamentos = () => {
    setVista("apartamentos");
    setApartamentoSeleccionado(null);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadData(silent: boolean) {
      await Promise.resolve();
      if (cancelled) return;

      if (
        vista !== "recibos" ||
        pisoSeleccionado == null ||
        apartamentoSeleccionado == null
      ) {
        setPagos([]);
        setRecibosPendientes([]);
        setAbono(0);
        return;
      }

      if (!silent) {
        setCargando(true);
        setError(null);
      }

      try {
        const [pagosData, recibosData, abonoData] = await Promise.all([
          fetchPaymentsByApartamento(pisoSeleccionado, apartamentoSeleccionado),
          fetchRecibos(pisoSeleccionado, apartamentoSeleccionado, "pendiente"),
          fetchAbono(pisoSeleccionado, apartamentoSeleccionado),
        ]);
        if (cancelled) return;
        setPagos(pagosData);
        setRecibosPendientes(recibosData);
        setAbono(abonoData);
      } catch {
        if (!cancelled && !silent) setError("No se pudieron cargar los datos");
      } finally {
        if (!cancelled && !silent) setCargando(false);
      }
    }

    void loadData(false);
    // Recargar datos cada 10 segundos en segundo plano (sin mostrar "Cargando" para no resetear scroll)
    const intervalId = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        vista === "recibos" &&
        pisoSeleccionado != null &&
        apartamentoSeleccionado != null
      ) {
        void loadData(true);
      }
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [vista, pisoSeleccionado, apartamentoSeleccionado]);

  const formatearMeses = (meses: number[]) =>
    meses.map((m) => MESES[m - 1]).join(", ");

  // Mes(es) con año para la card (ej. "Enero 2025" o "Enero, Febrero 2025")
  const formatearMesesConAño = (meses: number[], fechaReportada: string): string => {
    if (!meses.length) return "—";
    const date = new Date(fechaReportada);
    const año = date.getUTCFullYear();
    const nombres = meses.map((m) => MESES[m - 1]).join(", ");
    return `${nombres} ${año}`;
  };

  // Formatear fecha correctamente evitando problemas de zona horaria
  // Las fechas vienen en UTC a mediodía desde el backend
  const formatearFecha = (fecha: string | Date): string => {
    if (!fecha) return "N/A";
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    // Extraer componentes UTC y formatear directamente
    const año = date.getUTCFullYear();
    const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
    const día = String(date.getUTCDate()).padStart(2, '0');
    return `${día}/${mes}/${año}`;
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl bg-background px-4 py-8">
      {vista === "pisos" && (
        <>
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm font-medium text-secondary hover:text-secondary/80"
            >
              ← Inicio
            </Link>
          </div>
          <h1 className="mb-8 text-center text-2xl font-semibold text-foreground">
            Pisos
          </h1>
          <PisosGrid onSelectPiso={handleSelectPiso} />
        </>
      )}

      {vista === "apartamentos" && (
        <>
          <div className="mb-6">
            <button
              type="button"
              onClick={volverAPisos}
              className="text-sm font-medium text-secondary hover:text-secondary/80"
            >
              ← Volver a pisos
            </button>
          </div>
          <h1 className="mb-8 text-center text-2xl font-semibold text-foreground">
            Apartamentos
          </h1>
          <p className="mb-6 text-center text-secondary">
            Piso {pisoSeleccionado ?? ""}
          </p>
          <ApartamentosGrid onSelectApartamento={handleSelectApartamento} />
        </>
      )}

      {vista === "recibos" && (
        <>
          <div className="mb-6">
            <button
              type="button"
              onClick={volverAApartamentos}
              className="text-sm font-medium text-secondary hover:text-secondary/80"
            >
              ← Volver a apartamentos
            </button>
          </div>
          <h1 className="mb-2 text-center text-2xl font-semibold text-foreground">
            Recibos por mes
          </h1>
          <p className="mb-8 text-center text-secondary">
            Piso {pisoSeleccionado ?? ""} · Apartamento{" "}
            {apartamentoSeleccionado ?? ""}
          </p>

          {cargando && (
            <p className="py-8 text-center text-muted-foreground">
              Cargando datos…
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {!cargando && !error && recibosPendientes.length === 0 && pagos.length === 0 && (
            <div className="mb-8 rounded-2xl border-2 border-primary/30 bg-primary/10 p-6 text-center">
              <p className="text-lg font-semibold text-foreground">Estás al día</p>
              <p className="mt-1 text-sm text-muted-foreground">No tienes recibos pendientes ni historial de pagos en este apartamento.</p>
            </div>
          )}
          {!cargando && !error && recibosPendientes.length === 0 && pagos.length > 0 && (
            <div className="mb-8 rounded-2xl border-2 border-primary/30 bg-primary/10 p-6 text-center">
              <p className="text-lg font-semibold text-foreground">Estás al día</p>
              <p className="mt-1 text-sm text-muted-foreground">No tienes recibos pendientes. Tus pagos anteriores aparecen abajo.</p>
            </div>
          )}
          {!cargando && !error && abono > 0 && (
            <article className="mb-6 overflow-hidden rounded-2xl border-2 border-secondary/30 bg-secondary/10 shadow-sm">
              <div className="flex items-center gap-4 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Abono a tu favor</h3>
                  <p className="text-2xl font-bold text-secondary">${abono.toFixed(2)} USD</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Se aplicará automáticamente a tus deudas cuando realices un pago.
                  </p>
                </div>
              </div>
            </article>
          )}
          {!cargando && !error && recibosPendientes.length > 0 && (
            <div className="mb-8 space-y-5">
              {abono > 0 && (
                <div className="rounded-lg border border-border bg-secondary/10 px-4 py-3 text-sm text-foreground">
                  <p>
                    <span className="font-medium">Total deuda:</span> $
                    {recibosPendientes
                      .reduce((s, r) => s + (r.montoUsd - (r.montoPagado ?? 0)), 0)
                      .toFixed(2)}{" "}
                    · <span className="font-medium">Abono aplicable:</span> ${abono.toFixed(2)} ·{" "}
                    <span className="font-semibold">Total a pagar:</span> $
                    {Math.max(
                      0,
                      recibosPendientes.reduce((s, r) => s + (r.montoUsd - (r.montoPagado ?? 0)), 0) - abono
                    ).toFixed(2)}
                  </p>
                </div>
              )}
              {recibosPendientes.map((recibo) => {
                const estadoRecibo = recibo.estado ?? "pendiente";
                const montoPagado = recibo.montoPagado ?? 0;
                const mostrarMontoPagado = montoPagado > 0;
                return (
                  <article
                    key={recibo._id}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                  >
                    <div className="flex items-start justify-between p-4 pb-0">
                      <h3 className="text-base font-semibold text-foreground">
                        Recibo de condominio
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${clasesBadgeEstadoRecibo(estadoRecibo)}`}
                      >
                        {obtenerTextoEstadoRecibo(estadoRecibo)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">Piso</p>
                          <p className="font-semibold text-foreground">{recibo.piso}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">Apartamento</p>
                          <p className="font-semibold text-foreground">{recibo.apartamento}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">Mes</p>
                          <p className="font-semibold text-foreground">
                            {formatearMesesConAño(recibo.meses, recibo.fechaReportada)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {mostrarMontoPagado ? "Monto pagado" : "Monto"}
                          </p>
                          <p className="font-semibold text-foreground">
                            {mostrarMontoPagado
                              ? `${montoPagado.toFixed(2)} USD`
                              : `${recibo.montoUsd.toFixed(2)} USD`}
                            {mostrarMontoPagado && recibo.montoUsd > montoPagado && (
                              <span className="ml-1 text-sm font-normal text-muted-foreground">
                                (pend. {(recibo.montoUsd - montoPagado).toFixed(2)})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">Fecha reportada</p>
                          <p className="font-semibold text-foreground">
                            {formatearFecha(recibo.fechaReportada)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {recibo.facturaFileId ? (
                      <a
                        href={getComprobanteUrl(recibo.facturaFileId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-b-2xl bg-foreground px-4 py-3 font-medium text-background transition-colors hover:opacity-90"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Ver factura
                      </a>
                    ) : (
                      <div className="mt-4 rounded-b-2xl border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
                        Sin factura adjunta
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {!cargando && !error && pagos.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground">
                Pagos realizados
              </h2>
              {pagos.map((p) => (
                <article
                  key={p._id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white ${clasesBadgeEstadoPago(p.estado)}`}
                    >
                      {p.estado === "aceptado" && (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {obtenerTextoEstado(p.estado)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {obtenerDetalleEstadoPago(p.estado, formatearFecha(p.fechaPago))}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">Mes</p>
                        <p className="font-semibold text-foreground leading-tight">
                          {formatearMeses(p.meses)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha Pago</p>
                        <p className="font-semibold text-foreground">
                          {formatearFecha(p.fechaPago)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!cargando &&
            !error &&
            recibosPendientes.length === 0 &&
            pagos.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-border bg-muted/50 px-6 py-12 text-center">
                <p className="text-muted-foreground">
                  No hay recibos pendientes ni pagos registrados para este
                  apartamento.
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}