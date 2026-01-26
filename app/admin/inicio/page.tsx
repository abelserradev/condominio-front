"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  fetchPayments,
  fetchPayment,
  aceptarPago,
  rechazarPago,
  getComprobanteUrl,
  fetchApartments,
  type Payment,
  type Apartment,
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

export default function AdminInicioPage() {
  const router = useRouter();
  const [pagosPendientes, setPagosPendientes] = useState<Payment[]>([]);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Payment | null>(null);
  const [apartamentos, setApartamentos] = useState<Apartment[]>([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    cargarDatos();
  }, [router]);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [pagos, apts] = await Promise.all([
        fetchPayments(undefined, undefined, "pendiente"),
        fetchApartments(),
      ]);
      setPagosPendientes(pagos);
      const ordenados = apts.sort((a, b) => {
        if (a.piso !== b.piso) return a.piso - b.piso;
        return a.numero - b.numero;
      });
      setApartamentos(ordenados);
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Burger Menu Button - Solo visible cuando el menú está cerrado */}
      {!menuAbierto && (
        <button
          onClick={() => setMenuAbierto(true)}
          className="fixed left-4 top-20 z-50 rounded-lg bg-green-600 p-2 text-white shadow-lg transition-all hover:bg-green-700"
          aria-label="Abrir menú"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 transform bg-green-700 text-white transition-transform duration-300 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        } shadow-xl flex flex-col`}
      >
        {/* Botón de cerrar sticky en la parte superior */}
        <div className="sticky top-0 z-10 bg-green-700 border-b border-green-600 p-2 flex justify-end">
          <button
            onClick={() => setMenuAbierto(false)}
            className="rounded-lg p-1 text-white transition-colors hover:bg-green-600"
            aria-label="Cerrar menú"
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

        {/* Lista de apartamentos con scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="mt-12 ml-2 mb-4 text-xl font-bold">Listados de Pisos</h2>
          <div className="space-y-1">
            {apartamentos.map((apt) => (
              <button
                key={apt._id}
                onClick={() => {
                  router.push(`/admin/recibos?piso=${apt.piso}&apartamento=${apt.numero}`);
                  setMenuAbierto(false);
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-green-600"
              >
                P{apt.piso}-A{apt.numero}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Contenido principal - se desplaza cuando el menú está abierto */}
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          menuAbierto ? "ml-64" : "ml-20"
        }`}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Reportes de Pagos Pendientes
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

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
                    {new Date(
                      pagoSeleccionado.fechaPago
                    ).toLocaleDateString("es-VE")}
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