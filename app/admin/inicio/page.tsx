"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  fetchPayments,
  fetchPayment,
  fetchApartments,
  fetchRecibos,
  aceptarPago,
  rechazarPago,
  getComprobanteUrl,
  fetchTasaBcv,
  fetchMiSuscripcion,
  type Payment,
  type Recibo,
  type BuildingSuscripcion,
} from "@/lib/api";
import { diasHasta } from "@/app/components/super/suscripcion-badge";

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

type Metricas = {
  pagosRegistrados: number;
  apartamentosConDeudas: number;
  apartamentosSinDeudasActivas: number;
  apartamentosSoloDeudaCuotasEspeciales: number;
};

function esDeudaCondominio(tipoDeuda: string): boolean {
  const t = tipoDeuda.toLowerCase();
  return t.includes("condominio") || t === "pendiente" || t === "factura";
}

function mensajeSuscripcion(
  estado: string,
  dias: number,
): string {
  if (estado === "vencido" || estado === "suspendido") {
    return "Tu suscripción está vencida o suspendida. Renueva para seguir gestionando el edificio.";
  }
  if (dias <= 0) {
    return "Tu suscripción vence hoy.";
  }
  return `Tu suscripción vence en ${dias} día${dias === 1 ? "" : "s"}.`;
}

function formatearMeses(meses: number[]): string {
  return meses.map((m) => MESES[m - 1]).join(", ");
}

function esDeudaCuotasEspeciales(tipoDeuda: string): boolean {
  const t = tipoDeuda.toLowerCase();
  return t.includes("cuota") || t.includes("especial") || t.includes("acumulada") || t.includes("reparacion");
}

function calcularMetricas(
  todosPagos: Payment[],
  recibos: Recibo[],
  totalApartamentos: number,
): Metricas {
  const pagosRegistrados = todosPagos.length;
  const recibosPendientesCondominioOCuotas = recibos.filter(
    (r) =>
      (esDeudaCondominio(r.tipoDeuda) || esDeudaCuotasEspeciales(r.tipoDeuda)) &&
      (r.estado ?? "pendiente") === "pendiente" &&
      (r.montoPagado ?? 0) < r.montoUsd,
  );
  const keysAptMorosos = new Set<string>();
  for (const r of recibosPendientesCondominioOCuotas) {
    const p = Number(r.piso);
    const a = Number(r.apartamento);
    if (Number.isFinite(p) && Number.isFinite(a)) {
      keysAptMorosos.add(`${p}-${a}`);
    }
  }
  const apartamentosConDeudas = keysAptMorosos.size;
  const recibosConSaldo = recibos.filter((r) => (r.montoPagado ?? 0) < r.montoUsd);
  const apartamentosConDeuda = new Set(
    recibosConSaldo.map((r) => `${r.piso}-${r.apartamento}`),
  );
  const apartamentosSinDeudasActivas = totalApartamentos - apartamentosConDeuda.size;
  const aptsConDeudaCondominio = new Set<string>();
  const aptsConDeudaCuotasEspeciales = new Set<string>();
  for (const r of recibosConSaldo) {
    const key = `${r.piso}-${r.apartamento}`;
    if (esDeudaCondominio(r.tipoDeuda)) aptsConDeudaCondominio.add(key);
    if (esDeudaCuotasEspeciales(r.tipoDeuda)) aptsConDeudaCuotasEspeciales.add(key);
  }
  const apartamentosSoloDeudaCuotasEspeciales = [...aptsConDeudaCuotasEspeciales].filter(
    (key) => !aptsConDeudaCondominio.has(key),
  ).length;
  return {
    pagosRegistrados,
    apartamentosConDeudas,
    apartamentosSinDeudasActivas: Math.max(0, apartamentosSinDeudasActivas),
    apartamentosSoloDeudaCuotasEspeciales,
  };
}

export default function AdminInicioPage() {
  const router = useRouter();
  const [pagosPendientes, setPagosPendientes] = useState<Payment[]>([]);
  const [pagosAceptados, setPagosAceptados] = useState<Payment[]>([]);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Payment | null>(null);
  const [metricas, setMetricas] = useState<Metricas>({
    pagosRegistrados: 0,
    apartamentosConDeudas: 0,
    apartamentosSinDeudasActivas: 0,
    apartamentosSoloDeudaCuotasEspeciales: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasaBcv, setTasaBcv] = useState<number | null>(null);
  const [suscripcion, setSuscripcion] = useState<BuildingSuscripcion | null>(null);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const [pagosPend, pagosAcept, apts, recibos, tasaRes] = await Promise.all([
        fetchPayments(undefined, undefined, "pendiente"),
        fetchPayments(undefined, undefined, "aceptado"),
        fetchApartments(),
        fetchRecibos(),
        fetchTasaBcv().catch(() => null),
      ]);
      setPagosPendientes(pagosPend);
      const aceptadosOrdenados = [...pagosAcept].sort((a, b) => {
        const fa = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const fb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return fb - fa;
      });
      setPagosAceptados(aceptadosOrdenados);
      const todosPagos = [...pagosPend, ...pagosAcept];
      const metricasCalculadas = calcularMetricas(todosPagos, recibos, apts.length);
      setMetricas(metricasCalculadas);
      setTasaBcv(tasaRes ? tasaRes.promedio : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    void cargarDatos();
    fetchMiSuscripcion().then(setSuscripcion).catch(() => {});
  }, [router, cargarDatos]);

  async function handleClickPago(pago: Payment) {
    try {
      const completo = await fetchPayment(pago._id);
      setPagoSeleccionado(completo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pago");
    }
  }

  async function handleAceptar() {
    if (!pagoSeleccionado) return;
    try {
      setProcesando(true);
      await aceptarPago(pagoSeleccionado._id);
      setPagoSeleccionado(null);
      // Esperar un poco para asegurar que la caché se limpie en el backend
      await new Promise(resolve => setTimeout(resolve, 500));
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al aceptar pago");
    } finally {
      setProcesando(false);
    }
  }

  async function handleRechazar() {
    if (!pagoSeleccionado) return;
    try {
      setProcesando(true);
      await rechazarPago(pagoSeleccionado._id);
      setPagoSeleccionado(null);
      // Esperar un poco para asegurar que la caché se limpie en el backend
      await new Promise(resolve => setTimeout(resolve, 500));
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al rechazar pago");
    } finally {
      setProcesando(false);
    }
  }

  // Formatear fecha correctamente evitando problemas de zona horaria
  const formatearFecha = (fecha: string | Date): string => {
    if (!fecha) return "N/A";
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const año = date.getUTCFullYear();
    const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
    const día = String(date.getUTCDate()).padStart(2, '0');
    return `${día}/${mes}/${año}`;
  };

  function formatearMonto(monto: number): string {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(monto);
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20 md:pb-0">
      {/* Header púrpura con título y botón */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-secondary px-4 py-4 md:px-6 md:py-5">
        <h1 className="text-lg font-bold leading-tight text-secondary-foreground md:text-2xl">
          Reportes de Pagos Pendientes
        </h1>
        <button
          type="button"
          className="rounded-xl bg-secondary/80 px-4 py-2.5 text-sm font-medium text-secondary-foreground shadow transition-colors hover:bg-secondary/70"
        >
          Factura condominio
        </button>
      </header>

      <div className="p-4 md:p-6">
        {suscripcion?.suscripcionHasta && (() => {
          const dias = diasHasta(suscripcion.suscripcionHasta);
          if (dias > 7 && suscripcion.estadoSuscripcion === "activo") return null;
          return (
            <div className="mb-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3">
              <p className="text-sm text-accent-foreground">
                {mensajeSuscripcion(suscripcion.estadoSuscripcion, dias)}
              </p>
              {suscripcion.datosContactoPago && (
                <button
                  type="button"
                  onClick={() => setModalPagoAbierto(true)}
                  className="mt-1 text-sm font-medium text-accent-foreground underline"
                >
                  Ver instrucciones de pago
                </button>
              )}
            </div>
          );
        })()}
        {/* Tarjetas de métricas */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mb-8">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Pagos registrados por los propietarios
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metricas.pagosRegistrados}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total reportados</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Apartamentos con deudas
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metricas.apartamentosConDeudas}</p>
            <p className="mt-1 text-xs text-muted-foreground">Morosos (condominio o cuotas especiales)</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Apartamentos sin deudas activas
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <svg className="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metricas.apartamentosSinDeudasActivas}</p>
            <p className="mt-1 text-xs text-muted-foreground">Al día</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Deudas cuotas especiales
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metricas.apartamentosSoloDeudaCuotasEspeciales}</p>
            <p className="mt-1 text-xs text-muted-foreground">Solo cuotas especiales</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            Reportes de Pagos Pendientes
          </h2>
          <div className="text-left md:text-right">
            <span className="text-sm font-medium text-muted-foreground">Tasa BCV del día </span>
            <span className="ml-2 text-base font-semibold text-secondary md:text-lg">
              {tasaBcv == null ? "…" : `${tasaBcv.toLocaleString("es-VE")} Bs/USD`}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-destructive">
            {error}
          </div>
        )}

        <h2 className="mb-4 text-lg font-semibold text-foreground">Pagos pendientes de verificar</h2>
        {pagosPendientes.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted py-12 text-center text-muted-foreground">
            No hay pagos pendientes de verificar
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pagosPendientes.map((pago) => (
              <button
                key={pago._id}
                type="button"
                onClick={() => handleClickPago(pago)}
                className="cursor-pointer rounded-lg border border-border bg-card p-4 text-left shadow transition-shadow hover:shadow-lg"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Piso {pago.piso} - Apt {pago.apartamento}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatearMeses(pago.meses)}
                    </p>
                  </div>
                  <span className="rounded bg-primary/20 px-2 py-1 text-xs text-foreground">
                    Pendiente
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-lg font-bold text-foreground">
                    {formatearMonto(pago.montoUsd)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(pago.fechaPago).toLocaleDateString("es-VE")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Sección Pagos aceptados */}
        <div className="mt-10 rounded-xl border border-border bg-card shadow-sm">
          <h2 className="border-b border-border px-4 py-4 text-lg font-semibold text-foreground md:px-6">
            Pagos aceptados
          </h2>
          <div className="space-y-3 p-4 md:hidden">
            {pagosAceptados.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No hay pagos aceptados</p>
            ) : (
              pagosAceptados.slice(0, 5).map((pago) => (
                <div
                  key={pago._id}
                  className="rounded-xl border border-border bg-muted/50 p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Condominio
                    </span>
                    <span className="font-bold text-foreground">{formatearMonto(pago.montoUsd)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Piso: </span>
                      <span className="font-medium text-foreground">{pago.piso}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Apartamento: </span>
                      <span className="rounded bg-primary/20 px-2 py-0.5 font-medium text-foreground">
                        {pago.apartamento}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Fecha de pago: </span>
                      <span className="font-medium text-foreground">
                        {formatearFecha(pago.fechaPago)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-muted text-left text-sm font-medium text-muted-foreground">
                  <th className="px-6 py-3">Tipo de deuda</th>
                  <th className="px-6 py-3">Piso</th>
                  <th className="px-6 py-3">Apartamento</th>
                  <th className="px-6 py-3">Monto</th>
                  <th className="px-6 py-3">Fecha de pago</th>
                </tr>
              </thead>
              <tbody>
                {pagosAceptados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No hay pagos aceptados
                    </td>
                  </tr>
                ) : (
                  pagosAceptados.slice(0, 5).map((pago) => (
                    <tr
                      key={pago._id}
                      className="border-b border-border transition-colors hover:bg-muted/50"
                    >
                      <td className="px-6 py-4">
                        <span className="text-foreground">Condominio</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{pago.piso}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-foreground">
                          {pago.apartamento}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {formatearMonto(pago.montoUsd)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatearFecha(pago.fechaPago)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-4 text-center md:px-6">
            <Link
              href="/admin/pagos-aceptados"
              className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80 hover:underline"
            >
              Ver más pagos aceptados
            </Link>
          </div>
        </div>
      </main>

      {/* Modal mejorado */}
      {pagoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold text-foreground">
                Detalle del Pago
              </h2>
              <button
                onClick={() => setPagoSeleccionado(null)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Cerrar"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Piso
                  </span>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {pagoSeleccionado.piso}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Apartamento
                  </span>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {pagoSeleccionado.apartamento}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4 md:col-span-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Meses a cancelar
                  </span>
                  <p className="mt-1 text-lg text-foreground">
                    {formatearMeses(pagoSeleccionado.meses)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Banco
                  </span>
                  <p className="mt-1 text-lg text-foreground">
                    {pagoSeleccionado.banco}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Fecha de pago
                  </span>
                  <p className="mt-1 text-lg text-foreground">
                    {formatearFecha(pagoSeleccionado.fechaPago)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Número de comprobante
                  </span>
                  <p className="mt-1 text-lg text-foreground">
                    {pagoSeleccionado.numeroComprobante}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Monto (USD)
                  </span>
                  <p className="mt-1 text-xl font-bold text-secondary">
                    {formatearMonto(pagoSeleccionado.montoUsd)}
                  </p>
                </div>
                {pagoSeleccionado.montoBs && (
                  <div className="rounded-lg bg-muted p-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Monto (BS)
                    </span>
                    <p className="mt-1 text-lg text-foreground">
                      {new Intl.NumberFormat("es-VE", {
                        style: "currency",
                        currency: "VES",
                      }).format(pagoSeleccionado.montoBs)}
                    </p>
                  </div>
                )}
                {pagoSeleccionado.tasaBcv && (
                  <div className="rounded-lg bg-muted p-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Tasa BCV
                    </span>
                    <p className="mt-1 text-lg text-foreground">
                      {pagoSeleccionado.tasaBcv}
                    </p>
                  </div>
                )}
                {pagoSeleccionado.comprobanteFileId && (
                  <div className="rounded-lg bg-muted p-4 md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-muted-foreground">
                      Comprobante
                    </span>
                    <div className="mt-2 rounded-lg border border-border p-2">
                      <Image
                        src={getComprobanteUrl(
                          pagoSeleccionado.comprobanteFileId
                        )}
                        alt="Comprobante"
                        width={800}
                        height={600}
                        unoptimized
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={handleAceptar}
                  disabled={procesando}
                  className="flex-1 rounded-lg bg-secondary px-4 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesando ? "Procesando..." : "✓ Aceptar"}
                </button>
                <button
                  onClick={handleRechazar}
                  disabled={procesando}
                  className="flex-1 rounded-lg bg-destructive px-4 py-3 font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesando ? "Procesando..." : "✗ Rechazar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalPagoAbierto && suscripcion?.datosContactoPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-foreground">Instrucciones de pago</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{suscripcion.datosContactoPago}</p>
            <button
              type="button"
              onClick={() => setModalPagoAbierto(false)}
              className="mt-4 w-full rounded-lg bg-secondary py-2 text-sm text-secondary-foreground"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}