"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchBanks,
  fetchTasaBcv,
  postPayment,
  type Bank,
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

export default function ReportarPagoPage() {
  const router = useRouter();
  const [piso, setPiso] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [mesesSeleccionados, setMesesSeleccionados] = useState<number[]>([]);
  const [banco, setBanco] = useState("");
  const [fechaPago, setFechaPago] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [montoUsd, setMontoUsd] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [bancos, setBancos] = useState<Bank[]>([]);
  const [tasaBcv, setTasaBcv] = useState<number | null>(null);
  const [cargandoBancos, setCargandoBancos] = useState(true);
  const [cargandoTasa, setCargandoTasa] = useState(true);
  const [errorBancos, setErrorBancos] = useState<string | null>(null);
  const [errorTasa, setErrorTasa] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    fetchBanks()
      .then(setBancos)
      .catch(() => setErrorBancos("No se pudieron cargar los bancos"))
      .finally(() => setCargandoBancos(false));
  }, []);

  useEffect(() => {
    fetchTasaBcv()
      .then((d) => setTasaBcv(d.promedio))
      .catch(() => setErrorTasa("No se pudo obtener la tasa BCV"))
      .finally(() => setCargandoTasa(false));
  }, []);

  const montoBs =
    tasaBcv != null && montoUsd !== "" && !Number.isNaN(Number(montoUsd))
      ? Number(montoUsd) * tasaBcv
      : null;

  const toggleMes = (mesIndex: number) => {
    setMesesSeleccionados((prev) =>
      prev.includes(mesIndex)
        ? prev.filter((m) => m !== mesIndex)
        : [...prev, mesIndex].sort((a, b) => a - b)
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      setArchivo(file);
    } else {
      setArchivo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEnvio(null);
    if (mesesSeleccionados.length === 0) {
      setErrorEnvio("Seleccione al menos un mes a pagar.");
      return;
    }
    if (!archivo) {
      setErrorEnvio("Debe cargar el comprobante.");
      return;
    }
    setEnviando(true);
    const formData = new FormData();
    formData.append("piso", piso);
    formData.append("apartamento", apartamento);
    formData.append(
      "meses",
      JSON.stringify(mesesSeleccionados.map((i) => i + 1))
    );
    formData.append("banco", banco);
    formData.append("fechaPago", fechaPago);
    formData.append("numeroComprobante", numeroComprobante);
    formData.append("montoUsd", montoUsd);
    if (montoBs != null) formData.append("montoBs", String(montoBs));
    if (tasaBcv != null) formData.append("tasaBcv", String(tasaBcv));
    formData.append("comprobante", archivo);
    try {
      await postPayment(formData);
      router.push("/?reporte=ok");
    } catch (err) {
      setErrorEnvio(
        err instanceof Error ? err.message : "Error al enviar"
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl bg-white px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          ← Inicio
        </Link>
      </div>
      <h1 className="mb-8 text-center text-2xl font-semibold text-green-600">
        Reportar pago de condominio
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label
            htmlFor="piso"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Piso
          </label>
          <select
            id="piso"
            value={piso}
            onChange={(e) => setPiso(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Seleccione</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="apartamento"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Número de apartamento
          </label>
          <select
            id="apartamento"
            value={apartamento}
            onChange={(e) => setApartamento(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Seleccione</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Mes o meses a pagar
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MESES.map((nombre, i) => (
              <label
                key={nombre}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={mesesSeleccionados.includes(i)}
                  onChange={() => toggleMes(i)}
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-slate-700">{nombre}</span>
              </label>
            ))}
          </div>
          {mesesSeleccionados.length === 0 && (
            <p className="mt-1 text-xs text-green-600">
              Seleccione al menos un mes.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="banco"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Banco de envío
          </label>
          <select
            id="banco"
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            required
            disabled={cargandoBancos}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60"
          >
            <option value="">
              {cargandoBancos ? "Cargando…" : "Seleccione"}
            </option>
            {bancos.map((b) => (
              <option key={b._id} value={b.nombre}>
                {b.nombre}
              </option>
            ))}
          </select>
          {errorBancos && (
            <p className="mt-1 text-xs text-red-600">{errorBancos}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="fechaPago"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Fecha de pago
          </label>
          <input
            type="date"
            id="fechaPago"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="numeroComprobante"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Número de comprobante
          </label>
          <input
            type="text"
            id="numeroComprobante"
            value={numeroComprobante}
            onChange={(e) => setNumeroComprobante(e.target.value)}
            required
            placeholder="Ej. 123456789"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="montoUsd"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Monto cancelado en $
          </label>
          <input
            type="number"
            id="montoUsd"
            value={montoUsd}
            onChange={(e) => setMontoUsd(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          {cargandoTasa && (
            <p className="mt-1 text-xs text-slate-500">
              Obteniendo tasa BCV…
            </p>
          )}
          {errorTasa && (
            <p className="mt-1 text-xs text-red-600">{errorTasa}</p>
          )}
          {tasaBcv != null && !cargandoTasa && (
            <p className="mt-1 text-sm text-slate-600">
              Tasa BCV: {tasaBcv.toLocaleString("es-VE")} Bs/USD
              {montoBs != null && (
                <span className="ml-2 font-medium text-green-600">
                  · Equivalente: {montoBs.toLocaleString("es-VE")} Bs
                </span>
              )}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Cargue su comprobante aquí
          </span>
          <label className="inline-block cursor-pointer rounded-lg border-2 border-dashed border-green-200 bg-green-50/50 px-4 py-3 text-sm font-medium text-green-800 transition-colors hover:border-green-400 hover:bg-green-100">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="sr-only"
            />
            {archivo
              ? `Archivo: ${archivo.name}`
              : "Seleccionar imagen desde dispositivo"}
          </label>
        </div>

        {errorEnvio && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorEnvio}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-4 w-full rounded-xl border-2 border-green-300 bg-green-500 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar reporte de pago"}
        </button>
      </form>
    </div>
  );
}
