"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

type Metricas = {
  pagosRegistrados: number;
  apartamentosConDeudas: number;
  apartamentosSinDeudasActivas: number;
  apartamentosSoloDeudaCuotasEspeciales: number;
};

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
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    cargarDatos();
  }, [router]);

  function esDeudaCondominio(tipoDeuda: string): boolean {
    const t = tipoDeuda.toLowerCase();
    return t.includes("condominio") || t === "pendiente" || t === "factura";
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
    // Apartamentos únicos con al menos una deuda pendiente (condominio o cuotas especiales)
    const recibosPendientesCondominioOCuotas = recibos.filter(
      (r) =>
        (esDeudaCondominio(r.tipoDeuda) || esDeudaCuotasEspeciales(r.tipoDeuda)) &&
        (r.estado ?? "pendiente") === "pendiente" &&
        (r.montoPagado ?? 0) < r.montoUsd,
    );
    // Un apartamento cuenta una sola vez aunque tenga varias facturas pendientes
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

  async function cargarDatos() {
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
  }

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

  function formatearMeses(meses: number[]): string {
    return meses.map((m) => MESES[m - 1]).join(", ");
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
        <p className="text-lg text-slate-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Header púrpura con título y botón */}
      <header className="flex items-center justify-between bg-[#5b21b6] px-6 py-5">
        <h1 className="text-2xl font-bold text-white">
          Reportes de Pagos Pendientes
        </h1>
        <button
          type="button"
          className="rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-medium text-white shadow transition-colors hover:bg-[#6d28d9]"
        >
          Factura condominio
        </button>
      </header>

      <div className="p-6">
        {/* Tarjetas de métricas */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-sm font-medium text-slate-600">
                Pagos registrados por los propietarios
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ede9fe]">
                <svg className="h-5 w-5 text-[#5b21b6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{metricas.pagosRegistrados}</p>
            <p className="mt-1 text-xs text-slate-500">Total reportados</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-sm font-medium text-slate-600">
                Apartamentos con deudas
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dbeafe]">
                <svg className="h-5 w-5 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{metricas.apartamentosConDeudas}</p>
            <p className="mt-1 text-xs text-slate-500">Morosos (condominio o cuotas especiales)</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-sm font-medium text-slate-600">
                Apartamentos sin deudas activas
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fce7f3]">
                <svg className="h-5 w-5 text-[#be185d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{metricas.apartamentosSinDeudasActivas}</p>
            <p className="mt-1 text-xs text-slate-500">Al día</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-sm font-medium text-slate-600">
                Deudas cuotas especiales
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d1fae5]">
                <svg className="h-5 w-5 text-[#047857]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{metricas.apartamentosSoloDeudaCuotasEspeciales}</p>
            <p className="mt-1 text-xs text-slate-500">Solo cuotas especiales</p>
          </div>
        </div>
      </div>

      {/* Contenido principal - se desplaza cuando el menú está abierto */}
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          menuAbierto ? "ml-64" : "ml-20"
        }`}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-800">
            Reportes de Pagos Pendientes
          </h1>
          <div className="text-right">
            <span className="text-sm font-medium text-slate-600">Tasa BCV del día </span>
            <span className="ml-2 text-lg font-semibold text-green-700">
              {tasaBcv == null ? "…" : `${tasaBcv.toLocaleString("es-VE")} Bs/USD`}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <h2 className="mb-4 text-lg font-semibold text-slate-800">Pagos pendientes de verificar</h2>
        {pagosPendientes.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No hay pagos pendientes de verificar
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pagosPendientes.map((pago) => (
              <div
                key={pago._id}
                onClick={() => handleClickPago(pago)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow transition-shadow hover:shadow-lg"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Piso {pago.piso} - Apt {pago.apartamento}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {formatearMeses(pago.meses)}
                    </p>
                  </div>
                  <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                    Pendiente
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-lg font-bold text-slate-800">
                    {formatearMonto(pago.montoUsd)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(pago.fechaPago).toLocaleDateString("es-VE")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sección Pagos aceptados */}
        <div className="mt-10 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800">
            Pagos aceptados
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-medium text-slate-600">
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
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No hay pagos aceptados
                    </td>
                  </tr>
                ) : (
                  pagosAceptados.slice(0, 5).map((pago) => (
                    <tr
                      key={pago._id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <span className="text-slate-800">Condominio</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{pago.piso}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                          {pago.apartamento}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {formatearMonto(pago.montoUsd)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(pago.fechaPago).toLocaleDateString("es-VE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 px-6 py-4 text-center">
            <Link
              href="/admin/pagos-aceptados"
              className="text-sm font-medium text-[#5b21b6] transition-colors hover:text-[#7c3aed] hover:underline"
            >
              Ver más pagos aceptados
            </Link>
          </div>
        </div>
      </main>

      {/* Modal mejorado */}
      {pagoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-slate-800">
                Detalle del Pago
              </h2>
              <button
                onClick={() => setPagoSeleccionado(null)}
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
                <div className="rounded-lg bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-600">
                    Piso
                  </label>
                  <p className="mt-1 text-lg font-semibold text-slate-800">
                    {pagoSeleccionado.piso}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-600">
                    Apartamento
                  </label>
                  <p className="mt-1 text-lg font-semibold text-slate-800">
                    {pagoSeleccionado.apartamento}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">
                    Meses a cancelar
                  </label>
                  <p className="mt-1 text-lg text-slate-800">
                    {formatearMeses(pagoSeleccionado.meses)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-600">
                    Banco
                  </label>
                  <p className="mt-1 text-lg text-slate-800">
                    {pagoSeleccionado.banco}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-600">
                    Fecha de pago
                  </label>
                  <p className="mt-1 text-lg text-slate-800">
                    {formatearFecha(pagoSeleccionado.fechaPago)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-600">
                    Número de comprobante
                  </label>
                  <p className="mt-1 text-lg text-slate-800">
                    {pagoSeleccionado.numeroComprobante}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-600">
                    Monto (USD)
                  </label>
                  <p className="mt-1 text-xl font-bold text-green-600">
                    {formatearMonto(pagoSeleccionado.montoUsd)}
                  </p>
                </div>
                {pagoSeleccionado.montoBs && (
                  <div className="rounded-lg bg-slate-50 p-4">
                    <label className="text-sm font-medium text-slate-600">
                      Monto (BS)
                    </label>
                    <p className="mt-1 text-lg text-slate-800">
                      {new Intl.NumberFormat("es-VE", {
                        style: "currency",
                        currency: "VES",
                      }).format(pagoSeleccionado.montoBs)}
                    </p>
                  </div>
                )}
                {pagoSeleccionado.tasaBcv && (
                  <div className="rounded-lg bg-slate-50 p-4">
                    <label className="text-sm font-medium text-slate-600">
                      Tasa BCV
                    </label>
                    <p className="mt-1 text-lg text-slate-800">
                      {pagoSeleccionado.tasaBcv}
                    </p>
                  </div>
                )}
                {pagoSeleccionado.comprobanteFileId && (
                  <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Comprobante
                    </label>
                    <div className="mt-2 rounded-lg border border-slate-200 p-2">
                      <img
                        src={getComprobanteUrl(
                          pagoSeleccionado.comprobanteFileId
                        )}
                        alt="Comprobante"
                        className="max-w-full rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del modal con botones */}
            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={handleAceptar}
                  disabled={procesando}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesando ? "Procesando..." : "✓ Aceptar"}
                </button>
                <button
                  onClick={handleRechazar}
                  disabled={procesando}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesando ? "Procesando..." : "✗ Rechazar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}