"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import {
  fetchPayments,
  fetchRecibos,
  postRecibo,
  aceptarPago,
  rechazarPago,
  type Payment,
  type Recibo,
} from "@/lib/api";
import { CargarReciboModal } from "./components/cargar-recibo-modal";
import { PagosReportadosList } from "./components/pagos-reportados-list";
import { PagoConfirmacionModal } from "./components/pago-confirmacion-modal";
import { RecibosCondominioList } from "./components/recibos-condominio-list";
import { MESES, compararPorCreatedAtDesc } from "./utils/display";

function AdminRecibosContent() {
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

  const cargarPagos = useCallback(async () => {
    if (!piso || !apartamento) return;
    try {
      setCargando(true);
      const [todosPagos, todosRecibos] = await Promise.all([
        fetchPayments(Number.parseInt(piso), Number.parseInt(apartamento)),
        fetchRecibos(Number.parseInt(piso), Number.parseInt(apartamento)),
      ]);
      const ordenadosPagos = todosPagos.toSorted(compararPorCreatedAtDesc);
      const ordenadosRecibos = todosRecibos.toSorted(compararPorCreatedAtDesc);
      setPagos(ordenadosPagos);
      setRecibos(ordenadosRecibos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, [piso, apartamento]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    if (piso && apartamento) {
      void cargarPagos();
    }
  }, [piso, apartamento, router, cargarPagos]);

  async function handleSubmitFormulario(e: React.SubmitEvent<HTMLFormElement>) {
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

    const pisoNum = Number.parseInt(piso);
    const apartamentoNum = Number.parseInt(apartamento);

    if (Number.isNaN(pisoNum) || Number.isNaN(apartamentoNum)) {
      setErrorFormulario("Apartamento inválido");
      return;
    }

    const mesNum = MESES.indexOf(mesDeuda) + 1;
    if (mesNum === 0) {
      setErrorFormulario("Mes inválido");
      return;
    }

    const montoNum = Number.parseFloat(montoUsd);
    if (Number.isNaN(montoNum) || montoNum <= 0) {
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

        <RecibosCondominioList recibos={recibos} pagos={pagos} />

        {pagos.length === 0 && recibos.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-slate-500">
            No hay reportes de pago ni recibos para este apartamento
          </div>
        ) : (
          <PagosReportadosList
            pagos={pagos}
            recibos={recibos}
            onAceptar={handleAceptarPago}
            onRechazar={handleRechazarPago}
          />
        )}
      </div>

      {modalAbierto && piso && apartamento && (
        <CargarReciboModal
          piso={piso}
          apartamento={apartamento}
          tipoDeuda={tipoDeuda}
          mesDeuda={mesDeuda}
          montoUsd={montoUsd}
          fechaReportada={fechaReportada}
          archivoFactura={archivoFactura}
          enviando={enviando}
          comprimiendo={comprimiendo}
          errorFormulario={errorFormulario}
          onClose={() => {
            setModalAbierto(false);
            resetearFormulario();
          }}
          onSubmit={handleSubmitFormulario}
          onTipoDeudaChange={setTipoDeuda}
          onMesDeudaChange={setMesDeuda}
          onMontoUsdChange={setMontoUsd}
          onFechaReportadaChange={setFechaReportada}
          onFileChange={handleFileChange}
        />
      )}

      {modalConfirmacion && pagoSeleccionado && accionConfirmacion && (
        <PagoConfirmacionModal
          pago={pagoSeleccionado}
          accion={accionConfirmacion}
          procesando={procesando}
          onCancel={() => {
            setModalConfirmacion(false);
            setPagoSeleccionado(null);
            setAccionConfirmacion(null);
          }}
          onConfirm={() => void confirmarAccion()}
        />
      )}
    </div>
  );
}

export default function AdminRecibosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-600">Cargando…</p>
        </div>
      }
    >
      <AdminRecibosContent />
    </Suspense>
  );
}