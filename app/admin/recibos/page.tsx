"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import {
  fetchPayments,
  fetchRecibos,
  getComprobanteUrl,
  postRecibo,
  aceptarPago,
  rechazarPago,
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

export default function AdminRecibosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const piso = searchParams.get("piso");
  const apartamento = searchParams.get("apartamento");
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoDeuda, setTipoDeuda] = useState("");
  const [mesDeuda, setMesDeuda] = useState("");
  const [montoUsd, setMontoUsd] = useState("");
  const [fechaReportada, setFechaReportada] = useState("");
  const [archivoFactura, setArchivoFactura] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Payment | null>(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [accionConfirmacion, setAccionConfirmacion] = useState<'aceptar' | 'rechazar' | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    // Verificar que el usuario esté autenticado para acceder a la página de admin
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    if (piso && apartamento) {
      cargarPagos();
    }
  }, [piso, apartamento, router]);

  async function cargarPagos() {
    if (!piso || !apartamento) return;
    try {
      setCargando(true);
      // Las peticiones ahora son públicas, no requieren token
      const [todosPagos, todosRecibos] = await Promise.all([
        fetchPayments(parseInt(piso), parseInt(apartamento)),
        fetchRecibos(parseInt(piso), parseInt(apartamento)),
      ]);
      const ordenadosPagos = todosPagos.sort((a, b) => {
        const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return fechaB - fechaA;
      });
      const ordenadosRecibos = todosRecibos.sort((a, b) => {
        const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return fechaB - fechaA;
      });
      setPagos(ordenadosPagos);
      setRecibos(ordenadosRecibos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmitFormulario(e: React.FormEvent) {
    e.preventDefault();
    setErrorFormulario(null);

    if (!piso || !apartamento) {
      setErrorFormulario("No se ha seleccionado un apartamento");
      return;
    }

    if (!tipoDeuda || !mesDeuda || !montoUsd || !fechaReportada || !archivoFactura) {
      setErrorFormulario("Todos los campos son obligatorios");
      return;
    }

    const pisoNum = parseInt(piso);
    const apartamentoNum = parseInt(apartamento);

    if (isNaN(pisoNum) || isNaN(apartamentoNum)) {
      setErrorFormulario("Apartamento inválido");
      return;
    }

    const mesNum = MESES.indexOf(mesDeuda) + 1;
    if (mesNum === 0) {
      setErrorFormulario("Mes inválido");
      return;
    }

    const montoNum = parseFloat(montoUsd);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorFormulario("Monto inválido");
      return;
    }

    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("piso", pisoNum.toString());
      formData.append("apartamento", apartamentoNum.toString());
      formData.append("meses", JSON.stringify([mesNum]));
      formData.append("montoUsd", montoNum.toString());
      formData.append("tipoDeuda", tipoDeuda);
      formData.append("fechaReportada", fechaReportada);
      formData.append("comprobante", archivoFactura);

      await postRecibo(formData);
      setModalAbierto(false);
      resetearFormulario();
      // Esperar un poco más para asegurar que la caché se limpie en el backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      await cargarPagos();
    } catch (err) {
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al cargar el recibo"
      );
    } finally {
      setEnviando(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setArchivoFactura(null);
      return;
    }

    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_SIZE_BYTES) {
      setErrorFormulario(`El archivo es demasiado grande. Tamaño máximo: ${MAX_SIZE_MB}MB`);
      setArchivoFactura(null);
      return;
    }

    if (file.type.startsWith("image/")) {
      try {
        setComprimiendo(true);
        setErrorFormulario(null);
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: file.type,
        };
        const compressedFile = await imageCompression(file, options);
        setArchivoFactura(compressedFile);
      } catch (err) {
        console.error("Error al comprimir imagen:", err);
        setErrorFormulario("Error al procesar la imagen. Intente con otra.");
        setArchivoFactura(null);
      } finally {
        setComprimiendo(false);
      }
    } else if (file.type === "application/pdf") {
      setArchivoFactura(file);
    } else {
      setErrorFormulario("Solo se permiten archivos de imagen o PDF");
      setArchivoFactura(null);
    }
  }

  function resetearFormulario() {
    setTipoDeuda("");
    setMesDeuda("");
    setMontoUsd("");
    setFechaReportada("");
    setArchivoFactura(null);
    setErrorFormulario(null);
  }

  async function handleAceptarPago(pago: Payment) {
    setPagoSeleccionado(pago);
    setAccionConfirmacion('aceptar');
    setModalConfirmacion(true);
  }

  async function handleRechazarPago(pago: Payment) {
    setPagoSeleccionado(pago);
    setAccionConfirmacion('rechazar');
    setModalConfirmacion(true);
  }

  async function confirmarAccion() {
    if (!pagoSeleccionado || !accionConfirmacion) return;
    
    try {
      setProcesando(true);
      if (accionConfirmacion === 'aceptar') {
        await aceptarPago(pagoSeleccionado._id);
      } else {
        await rechazarPago(pagoSeleccionado._id);
      }
      setModalConfirmacion(false);
      setPagoSeleccionado(null);
      setAccionConfirmacion(null);
      // Esperar un poco para asegurar que la caché se limpie en el backend
      await new Promise(resolve => setTimeout(resolve, 500));
      await cargarPagos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la acción");
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

  function obtenerColorEstado(estado?: string): string {
    switch (estado) {
      case "aceptado":
        return "bg-green-100 text-green-800";
      case "rechazado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  }

  function obtenerTextoEstado(estado?: string): string {
    switch (estado) {
      case "aceptado":
        return "Aceptado";
      case "rechazado":
        return "Rechazado";
      default:
        return "Pendiente";
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/admin/inicio"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            ← Volver a inicio
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">
            Reportes de Pago
          </h1>
          <button
            onClick={() => setModalAbierto(true)}
            className="rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white transition-colors hover:bg-yellow-600"
          >
            Cargar recibo
          </button>
        </div>
        <p className="mb-6 text-slate-600">
          Piso {piso} - Apartamento {apartamento}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {recibos.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">
              Recibos del Condominio
            </h2>
            <div className="space-y-4">
              {recibos.map((recibo) => (
                <div
                  key={recibo._id}
                  className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        Mes(es): {formatearMeses(recibo.meses)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Tipo: {recibo.tipoDeuda}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Fecha reportada:{" "}
                        {formatearFecha(recibo.fechaReportada)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        recibo.estado === "pagado"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {recibo.estado === "pagado" ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-800">
                        Total: {formatearMonto(recibo.montoUsd)}
                      </p>
                      {(() => {
                        const montoPagado = recibo.montoPagado ?? 0;
                        return montoPagado > 0 ? (
                          <div className="mt-1">
                            <p className="text-sm text-green-700">
                              Pagado: {formatearMonto(montoPagado)}
                            </p>
                            <p className="text-sm text-amber-700">
                              Pendiente: {formatearMonto(recibo.montoUsd - montoPagado)}
                            </p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    {recibo.facturaFileId && (
                      <a
                        href={getComprobanteUrl(recibo.facturaFileId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Ver factura
                      </a>
                    )}
                  </div>
                  {(() => {
                    const pagosRelacionados = pagos.filter((p) => 
                      p.recibosPagados?.includes(recibo._id) && p.estado === 'aceptado'
                    );
                    if (pagosRelacionados.length > 0) {
                      return (
                        <div className="mt-3 rounded-lg bg-green-50 p-3">
                          <p className="text-xs font-medium text-green-800">
                            Pagado por:
                          </p>
                          {pagosRelacionados.map((pagoRelacionado) => {
                            const abono = recibo.abonos?.find(
                              (a) => a.paymentId === pagoRelacionado._id
                            );
                            const montoAbono = abono?.monto ?? pagoRelacionado.montoUsd;
                            return (
                              <p key={pagoRelacionado._id} className="mt-1 text-sm text-green-700">
                                • Pago #{pagoRelacionado.numeroComprobante} - {formatearMonto(montoAbono)} ({formatearFecha(pagoRelacionado.fechaPago)})
                              </p>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {pagos.length === 0 && recibos.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-slate-500">
            No hay reportes de pago ni recibos para este apartamento
          </div>
        ) : (
          pagos.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">
                Pagos Reportados por Propietarios
              </h2>
              <div className="space-y-4">
                {pagos.map((pago) => (
                  <div
                    key={pago._id}
                    className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          Mes(es): {formatearMeses(pago.meses)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Fecha de pago:{" "}
                          {formatearFecha(pago.fechaPago)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${obtenerColorEstado(
                          pago.estado
                        )}`}
                      >
                        {obtenerTextoEstado(pago.estado)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Monto</p>
                        <p className="text-lg font-bold text-slate-800">
                          {formatearMonto(pago.montoUsd)}
                        </p>
                        {pago.montoBs && (
                          <p className="text-sm text-slate-600">
                            {new Intl.NumberFormat("es-VE", {
                              style: "currency",
                              currency: "VES",
                            }).format(pago.montoBs)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Comprobante
                        </p>
                        <p className="text-slate-800">{pago.numeroComprobante}</p>
                        <p className="text-sm text-slate-600">{pago.banco}</p>
                      </div>
                    </div>

                    {pago.comprobanteFileId && (
                      <div className="mt-4">
                        <a
                          href={getComprobanteUrl(pago.comprobanteFileId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-green-600 hover:text-green-700"
                        >
                          Ver comprobante →
                        </a>
                      </div>
                    )}

                    {pago.createdAt && (
                      <p className="mt-4 text-xs text-slate-500">
                        Reportado el:{" "}
                        {new Date(pago.createdAt).toLocaleDateString("es-VE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {pago.recibosPagados && pago.recibosPagados.length > 0 && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-800">
                          Recibos pagados con este pago:
                        </p>
                        {recibos
                          .filter((r) => pago.recibosPagados?.includes(r._id))
                          .map((reciboRelacionado) => (
                            <p key={reciboRelacionado._id} className="mt-1 text-sm text-blue-700">
                              • {reciboRelacionado.tipoDeuda} - {formatearMeses(reciboRelacionado.meses)} - {formatearMonto(reciboRelacionado.montoUsd)}
                            </p>
                          ))}
                      </div>
                    )}

                    {pago.estado === 'pendiente' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleAceptarPago(pago)}
                          className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleRechazarPago(pago)}
                          className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Modal para cargar recibo */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="flex h-full max-h-[95vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl sm:h-auto">
            {/* Header fijo */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="text-lg font-bold text-slate-800 sm:text-2xl">
                Cargar Recibo
              </h2>
              <button
                onClick={() => {
                  setModalAbierto(false);
                  resetearFormulario();
                }}
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
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

            {/* Contenido scrollable */}
            <form 
              onSubmit={handleSubmitFormulario} 
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                {errorFormulario && (
                  <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                    {errorFormulario}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Apartamento
                    </label>
                    <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:px-4 sm:text-base">
                      P{piso}-A{apartamento}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Tipo de deuda
                    </label>
                    <select
                      value={tipoDeuda}
                      onChange={(e) => setTipoDeuda(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-base"
                      required
                    >
                      <option value="">Seleccione el tipo de deuda</option>
                      <option value="Pendiente">Pendiente - Recibo del condominio</option>
                      <option value="Deuda acumulada">Pago especial (reparaciones, ascensor, etc.)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Mes de la deuda
                    </label>
                    <select
                      value={mesDeuda}
                      onChange={(e) => setMesDeuda(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-base"
                      required
                    >
                      <option value="">Seleccione un mes</option>
                      {MESES.map((mes, index) => (
                        <option key={index} value={mes}>
                          {mes}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Monto en dólares
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={montoUsd}
                      onChange={(e) => setMontoUsd(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-base"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Fecha reportada de la deuda
                    </label>
                    <input
                      type="date"
                      value={fechaReportada}
                      onChange={(e) => setFechaReportada(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Factura
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:px-4 sm:text-sm">
                        <svg
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Cargar factura
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                          disabled={comprimiendo}
                        />
                      </label>
                      {comprimiendo && (
                        <span className="text-xs text-amber-600 sm:text-sm">
                          Comprimiendo imagen...
                        </span>
                      )}
                      {archivoFactura && !comprimiendo && (
                        <span className="break-words text-xs text-slate-600 sm:text-sm">
                          {archivoFactura.name} ({(archivoFactura.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones fijos en la parte inferior */}
              <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalAbierto(false);
                      resetearFormulario();
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:px-4 sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed sm:px-4 sm:text-base"
                  >
                    {enviando ? "Cargando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {modalConfirmacion && pagoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {accionConfirmacion === 'aceptar' ? 'Confirmar Aceptación' : 'Confirmar Rechazo'}
              </h2>
              <button
                onClick={() => {
                  setModalConfirmacion(false);
                  setPagoSeleccionado(null);
                  setAccionConfirmacion(null);
                }}
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                disabled={procesando}
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

            <div className="px-6 py-6">
              <p className="mb-4 text-slate-700">
                ¿Está seguro que desea {accionConfirmacion === 'aceptar' ? 'aceptar' : 'rechazar'} este pago?
              </p>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">Detalles del pago:</p>
                <p className="mt-1 text-slate-800">
                  Monto: {formatearMonto(pagoSeleccionado.montoUsd)}
                </p>
                <p className="mt-1 text-slate-800">
                  Mes(es): {formatearMeses(pagoSeleccionado.meses)}
                </p>
                <p className="mt-1 text-slate-800">
                  Comprobante: {pagoSeleccionado.numeroComprobante}
                </p>
              </div>
              {accionConfirmacion === 'aceptar' && (
                <div className="mt-4 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800">
                    ⚠️ Al aceptar, el monto se aplicará a los recibos correspondientes. 
                    Si el pago es parcial, se actualizará el monto pendiente de los recibos.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => {
                  setModalConfirmacion(false);
                  setPagoSeleccionado(null);
                  setAccionConfirmacion(null);
                }}
                disabled={procesando}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAccion}
                disabled={procesando}
                className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors disabled:opacity-50 ${
                  accionConfirmacion === 'aceptar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {procesando ? 'Procesando...' : accionConfirmacion === 'aceptar' ? 'Aceptar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}