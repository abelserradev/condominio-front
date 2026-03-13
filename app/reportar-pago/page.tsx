"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  fetchBanks,
  postPayment,
  fetchRecibos,
  fetchTasaBcv,
  fetchTasaBcvPorFecha,
  extractComprobante,
  type Bank,
  type Recibo,
} from "@/lib/api";

function normalizarFechaAISO(fechaRaw: string): string | null {
  const s = String(fechaRaw).trim();
  if (!s) return null;
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
    if (!Number.isNaN(date.getTime())) return isoMatch[0];
    return null;
  }
  const ddmmyyyy = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const iso = `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
    const date = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
    if (!Number.isNaN(date.getTime())) return iso;
    return null;
  }
  return null;
}

function esFechaRazonable(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  const haceUnAnio = new Date();
  haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1);
  return date <= hoy && date >= haceUnAnio;
}

function formatFechaParaUsuario(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const INPUT_NUMBER_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

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
  const [montoBs, setMontoBs] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [bancos, setBancos] = useState<Bank[]>([]);
  const [cargandoBancos, setCargandoBancos] = useState(true);
  const [errorBancos, setErrorBancos] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [recibosPendientes, setRecibosPendientes] = useState<Recibo[]>([]);
  const [recibosSeleccionados, setRecibosSeleccionados] = useState<string[]>([]);
  const [cargandoRecibos, setCargandoRecibos] = useState(false);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [extrayendoOcr, setExtrayendoOcr] = useState(false);
  const [errorOcr, setErrorOcr] = useState<string | null>(null);
  const [tasaBcv, setTasaBcv] = useState<number | null>(null);
  const [tasaBcvFecha, setTasaBcvFecha] = useState<string | null>(null);
  const [errorTasaHistorica, setErrorTasaHistorica] = useState<string | null>(null);
  const ocrMontosAplicadosRef = useRef(false);

  useEffect(() => {
    fetchBanks()
      .then(setBancos)
      .catch(() => setErrorBancos("No se pudieron cargar los bancos"))
      .finally(() => setCargandoBancos(false));
  }, []);

  useEffect(() => {
    ocrMontosAplicadosRef.current = false;
  }, [piso, apartamento, mesesSeleccionados]);

  useEffect(() => {
    fetchTasaBcv()
    .then((data) => setTasaBcv(data.promedio))
    .catch(() => setTasaBcv(null))
  }, [])

  useEffect(() => {
    async function cargarRecibos() {
      if (!piso || !apartamento || mesesSeleccionados.length === 0) {
        setRecibosPendientes([]);
        if (!ocrMontosAplicadosRef.current) setMontoUsd("");
        return;
      }
      try {
        setCargandoRecibos(true);
        const todosRecibos = await fetchRecibos(
          parseInt(piso),
          parseInt(apartamento),
          "pendiente"
        );
        const mesesNumeros = mesesSeleccionados.map((i) => i + 1);
        const recibosFiltrados = todosRecibos.filter((recibo) =>
          recibo.meses.some((mes) => mesesNumeros.includes(mes))
        );
        setRecibosPendientes(recibosFiltrados);
        // Si hay múltiples recibos, permitir selección. Si solo hay uno, seleccionarlo automáticamente
        if (recibosFiltrados.length === 1) {
          setRecibosSeleccionados([recibosFiltrados[0]._id]);
        } else if (recibosFiltrados.length > 1) {
          // Si hay múltiples, no seleccionar ninguno por defecto para que el usuario elija
          setRecibosSeleccionados([]);
        } else {
          setRecibosSeleccionados([]);
        }
        const idsSeleccionados = recibosFiltrados.length === 1
          ? [recibosFiltrados[0]._id]
          : [];
        const total = recibosFiltrados
          .filter((r) => idsSeleccionados.includes(r._id))
          .reduce((sum, recibo) => {
            const montoPagado = recibo.montoPagado ?? 0;
            return sum + (recibo.montoUsd - montoPagado);
          }, 0);
        if (!ocrMontosAplicadosRef.current) {
          if (total > 0) {
            setMontoUsd(total.toFixed(2));
            if (tasaBcv != null && tasaBcv > 0) {
              setMontoBs((total * tasaBcv).toFixed(2));
            } else {
              setMontoBs("");
            }
          } else {
            setMontoUsd("");
            setMontoBs("");
          }
        }
      } catch (err) {
        console.error("Error al cargar recibos:", err);
        setRecibosPendientes([]);
      } finally {
        setCargandoRecibos(false);
      }
    }
    cargarRecibos();
  }, [piso, apartamento, mesesSeleccionados, tasaBcv]);

  const calcularTotal = useCallback(() => {
    if (ocrMontosAplicadosRef.current) return;
    const recibosSeleccionadosData = recibosPendientes.filter((r) =>
      recibosSeleccionados.includes(r._id)
    );
    const total = recibosSeleccionadosData.reduce(
      (sum, recibo) => {
        const montoPagado = recibo.montoPagado ?? 0;
        const montoPendiente = recibo.montoUsd - montoPagado;
        return sum + montoPendiente;
      },
      0
    );
    if (total > 0) {
      const totalFijo = total.toFixed(2);
      setMontoUsd(totalFijo);
      if (tasaBcv != null && tasaBcv > 0) {
        setMontoBs((total * tasaBcv).toFixed(2));
      } else {
        setMontoBs("");
      }
    } else if (recibosPendientes.length > 0) {
      setMontoUsd("");
      setMontoBs("");
    }
  }, [recibosSeleccionados, recibosPendientes, tasaBcv]);

  useEffect(() => {
    calcularTotal();
  }, [calcularTotal]);

  const handleMontoUsdChange = (value: string) => {
    setMontoUsd(value);
    if (tasaBcv != null && tasaBcv > 0) {
      const num = parseFloat(value.replace(",", "."));
      if (!Number.isNaN(num) && num >= 0) {
        setMontoBs((num * tasaBcv).toFixed(2));
      } else {
        setMontoBs("");
      }
    }
  };
  
  const handleMontoBsChange = (value: string) => {
    setMontoBs(value);
    if (tasaBcv != null && tasaBcv > 0) {
      const num = parseFloat(value.replace(",", "."));
      if (!Number.isNaN(num) && num >= 0) {
        setMontoUsd((num / tasaBcv).toFixed(2));
      } else {
        setMontoUsd("");
      }
    }
  };
  const toggleMes = (mesIndex: number) => {
    setMesesSeleccionados((prev) =>
      prev.includes(mesIndex)
        ? prev.filter((m) => m !== mesIndex)
        : [...prev, mesIndex].sort((a, b) => a - b)
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setArchivo(null);
      setErrorOcr(null);
      return;
    }

    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_SIZE_BYTES) {
      setErrorEnvio(`El archivo es demasiado grande. Tamaño máximo: ${MAX_SIZE_MB}MB`);
      setArchivo(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorEnvio("Solo se permiten archivos de imagen");
      setArchivo(null);
      return;
    }

    try {
      setComprimiendo(true);
      setErrorEnvio(null);
      setErrorOcr(null);
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };
      const compressedFile = await imageCompression(file, options);
      setArchivo(compressedFile);
      setComprimiendo(false);

      setExtrayendoOcr(true);
      setErrorTasaHistorica(null);
      try {
        const extract = await extractComprobante(compressedFile);
        if (extract.banco) {
          const bancoLower = extract.banco.toLowerCase();
          const bancoMatch = bancos.find(
            (b) =>
              bancoLower.includes(b.nombre.toLowerCase()) ||
              b.nombre.toLowerCase().includes(bancoLower)
          );
          if (bancoMatch) {
            setBanco(bancoMatch.nombre);
          } else if (bancoLower.includes("pagomóvil") || bancoLower.includes("bdv")) {
            const bdv = bancos.find((b) =>
              b.nombre.toLowerCase().includes("banco de venezuela")
            );
            if (bdv) setBanco(bdv.nombre);
          }
        }
        const fechaNormalizada = extract.fechaPago
          ? normalizarFechaAISO(extract.fechaPago)
          : null;
        if (fechaNormalizada) {
          setFechaPago(fechaNormalizada);
        } else if (extract.fechaPago) {
          const d = extract.fechaPago.match(/^(\d{4})-(\d{2})-(\d{2})/);
          setFechaPago(d ? d[0] : extract.fechaPago);
        }
        if (extract.numeroComprobante) setNumeroComprobante(extract.numeroComprobante);

        let tasaParaCalculo: number | null = tasaBcv;
        if (fechaNormalizada && esFechaRazonable(fechaNormalizada)) {
          try {
            const data = await fetchTasaBcvPorFecha(fechaNormalizada);
            setTasaBcv(data.promedio);
            setTasaBcvFecha(fechaNormalizada);
            setErrorTasaHistorica(null);
            tasaParaCalculo = data.promedio;
          } catch {
            setErrorTasaHistorica(
              "No hay tasa histórica para esa fecha. Usando tasa del día actual."
            );
            try {
              const data = await fetchTasaBcv();
              setTasaBcv(data.promedio);
              setTasaBcvFecha(null);
              tasaParaCalculo = data.promedio;
            } catch {
              tasaParaCalculo = tasaBcv;
            }
          }
        } else {
          setTasaBcvFecha(null);
        }

        if (extract.montoBs != null && extract.montoBs > 0) {
          setMontoBs(extract.montoBs.toFixed(2));
        }
        if (extract.montoUsd != null && extract.montoUsd > 0) {
          setMontoUsd(extract.montoUsd.toFixed(2));
        } else if (
          extract.montoBs != null &&
          extract.montoBs > 0 &&
          tasaParaCalculo != null &&
          tasaParaCalculo > 0
        ) {
          setMontoUsd((extract.montoBs / tasaParaCalculo).toFixed(2));
        }
        if ((extract.montoBs != null && extract.montoBs > 0) || (extract.montoUsd != null && extract.montoUsd > 0)) {
          ocrMontosAplicadosRef.current = true;
        }
      } catch {
        setErrorOcr(
          "No pudimos leer el comprobante automáticamente. Por favor complete los datos manualmente."
        );
      } finally {
        setExtrayendoOcr(false);
      }
    } catch (err) {
      console.error("Error al comprimir imagen:", err);
      setErrorEnvio("Error al procesar la imagen. Intente con otra.");
      setArchivo(null);
    } finally {
      setComprimiendo(false);
    }
  };

  const toggleRecibo = (reciboId: string) => {
    setRecibosSeleccionados((prev) =>
      prev.includes(reciboId)
        ? prev.filter((id) => id !== reciboId)
        : [...prev, reciboId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEnvio(null);
    if (mesesSeleccionados.length === 0) {
      setErrorEnvio("Seleccione al menos un mes a pagar.");
      return;
    }
    if (recibosPendientes.length > 1 && recibosSeleccionados.length === 0) {
      setErrorEnvio("Debe seleccionar al menos un recibo a pagar.");
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
    // Si hay múltiples recibos, enviar los IDs seleccionados
    if (recibosPendientes.length > 1 && recibosSeleccionados.length > 0) {
      formData.append("recibosIds", JSON.stringify(recibosSeleccionados));
    }
    formData.append("banco", banco);
    formData.append("fechaPago", fechaPago);
    formData.append("numeroComprobante", numeroComprobante);
    formData.append("montoUsd", montoUsd);
    const montoBsNum = montoBs.trim() !== "" ? parseFloat(montoBs) : undefined;
    if (tasaBcv != null && tasaBcv > 0) {
      formData.append("tasaBcv", String(tasaBcv));
    }
    if (montoBsNum != null && !Number.isNaN(montoBsNum) && montoBsNum >= 0) {
      formData.append("montoBs", String(montoBsNum));
    }
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
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Cargue su comprobante aquí (máximo 5MB)
          </span>
          <label className="inline-block cursor-pointer rounded-lg border-2 border-dashed border-green-200 bg-green-50/50 px-4 py-3 text-sm font-medium text-green-800 transition-colors hover:border-green-400 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              disabled={comprimiendo || extrayendoOcr}
              className="sr-only"
            />
            {comprimiendo
              ? "Comprimiendo imagen..."
              : extrayendoOcr
              ? "Extrayendo datos del comprobante..."
              : archivo
              ? `Archivo: ${archivo.name} (${(archivo.size / 1024 / 1024).toFixed(2)} MB)`
              : "Seleccionar imagen desde dispositivo"}
          </label>
          {comprimiendo && (
            <p className="mt-1 text-xs text-amber-600">
              Optimizando imagen para reducir tamaño...
            </p>
          )}
          {extrayendoOcr && (
            <p className="mt-1 text-xs text-amber-600">
              Extrayendo datos del comprobante...
            </p>
          )}
          {errorOcr && (
            <p className="mt-1 text-xs text-amber-600">{errorOcr}</p>
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
            onChange={(e) => handleMontoUsdChange(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className={INPUT_NUMBER_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="montoBs"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Monto cancelado en Bs
          </label>
          <input
            type="number"
            id="montoBs"
            value={montoBs}
            onChange={(e) => handleMontoBsChange(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className={INPUT_NUMBER_CLASS}
          />
          {tasaBcv != null && tasaBcv > 0 && (
            <p className="mt-1 text-xs text-slate-600">
              {tasaBcvFecha
                ? `Tasa BCV del ${formatFechaParaUsuario(tasaBcvFecha)}: ${tasaBcv.toLocaleString("es-VE")} Bs/USD`
                : `Tasa BCV del día: ${tasaBcv.toLocaleString("es-VE")} Bs/USD`}
            </p>
          )}
          {errorTasaHistorica && (
            <p className="mt-1 text-xs text-amber-600">{errorTasaHistorica}</p>
          )}
        </div>

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
          {cargandoRecibos && piso && apartamento && mesesSeleccionados.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Buscando recibos pendientes...
            </p>
          )}
          {!cargandoRecibos && recibosPendientes.length > 0 && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-green-800">
                {recibosPendientes.length > 1
                  ? "Seleccione los recibos a pagar:"
                  : "Recibo pendiente a pagar:"}
              </h3>
              <div className="space-y-2">
                {recibosPendientes.map((recibo) => {
                  const montoPagado = recibo.montoPagado ?? 0;
                  const montoPendiente = recibo.montoUsd - montoPagado;
                  const estaSeleccionado = recibosSeleccionados.includes(recibo._id);
                  const mostrarCheckbox = recibosPendientes.length > 1;
                  
                  return (
                    <label
                      key={recibo._id}
                      className={`flex cursor-pointer items-center justify-between rounded border ${
                        estaSeleccionado
                          ? "border-green-400 bg-green-100"
                          : "border-green-200 bg-white"
                      } px-3 py-2 transition-colors hover:bg-green-50`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {mostrarCheckbox && (
                          <input
                            type="checkbox"
                            checked={estaSeleccionado}
                            onChange={() => toggleRecibo(recibo._id)}
                            className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {recibo.tipoDeuda}
                          </p>
                          <p className="text-xs text-slate-600">
                            {recibo.meses
                              .map((m) => MESES[m - 1])
                              .join(", ")}
                          </p>
                          {montoPagado > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              Total: ${recibo.montoUsd.toFixed(2)} · Pagado: ${montoPagado.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-700">
                          ${montoPendiente.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">Pendiente</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {recibosSeleccionados.length > 0 && (
                <div className="mt-3 flex items-center justify-between border-t border-green-200 pt-3">
                  <p className="text-sm font-semibold text-green-800">
                    Total a pagar:
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    $
                    {recibosPendientes
                      .filter((r) => recibosSeleccionados.includes(r._id))
                      .reduce((sum, r) => {
                        const montoPagado = r.montoPagado ?? 0;
                        return sum + (r.montoUsd - montoPagado);
                      }, 0)
                      .toFixed(2)}
                  </p>
                </div>
              )}
              {recibosPendientes.length > 1 && recibosSeleccionados.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  Seleccione al menos un recibo para continuar.
                </p>
              )}
            </div>
          )}
          {!cargandoRecibos &&
            recibosPendientes.length === 0 &&
            piso &&
            apartamento &&
            mesesSeleccionados.length > 0 && (
              <p className="mt-2 text-xs text-amber-600">
                No hay recibos pendientes para los meses seleccionados.
              </p>
            )}
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
