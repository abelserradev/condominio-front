"use client";

import { useState, useEffect, useCallback, useRef, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  fetchBanks,
  postPayment,
  fetchRecibos,
  fetchAbono,
  fetchTasaBcv,
  fetchTasaBcvPorFecha,
  extractComprobante,
  type Bank,
  type Recibo,
} from "@/lib/api";
import { getDatosPropietario, esPropietarioLogueado } from "@/lib/hooks/useRequireRol";

function normalizarFechaAISO(fechaRaw: string): string | null {
  const s = String(fechaRaw).trim();
  if (!s) return null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(Number.parseInt(y, 10), Number.parseInt(m, 10) - 1, Number.parseInt(d, 10));
    if (!Number.isNaN(date.getTime())) return isoMatch[0];
    return null;
  }
  const ddmmyyyy = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(s);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const date = new Date(Number.parseInt(y, 10), Number.parseInt(m, 10) - 1, Number.parseInt(d, 10));
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

function filterRecibosByMeses(recibos: Recibo[], mesesSet: Set<number>): Recibo[] {
  return recibos.filter((recibo) =>
    recibo.meses.some((mes) => mesesSet.has(mes))
  );
}

function getLabelTextoArchivo(
  comprimiendo: boolean,
  extrayendoOcr: boolean,
  archivo: File | null,
): string {
  if (comprimiendo) {
    return "Comprimiendo imagen...";
  }
  if (extrayendoOcr) {
    return "Extrayendo datos del comprobante...";
  }
  if (archivo) {
    return `Archivo: ${archivo.name} (${(archivo.size / 1024 / 1024).toFixed(2)} MB)`;
  }
  return "Seleccionar imagen desde dispositivo";
}

type ValidacionArchivoResult =
  | { valido: true }
  | { valido: false; error: string };

function validarArchivo(file: File): ValidacionArchivoResult {
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (file.size > MAX_SIZE_BYTES) {
    return { valido: false, error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_SIZE_MB}MB` };
  }

  if (!file.type.startsWith("image/")) {
    return { valido: false, error: "Solo se permiten archivos de imagen" };
  }

  return { valido: true };
}

async function comprimirImagen(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  };
  return imageCompression(file, options);
}

function encontrarBancoPorNombre(bancos: Bank[], nombreExtraido: string): Bank | undefined {
  const bancoLower = nombreExtraido.toLowerCase();
  const bancoMatch = bancos.find(
    (b) =>
      bancoLower.includes(b.nombre.toLowerCase()) ||
      b.nombre.toLowerCase().includes(bancoLower)
  );
  if (bancoMatch) return bancoMatch;

  if (bancoLower.includes("pagomóvil") || bancoLower.includes("bdv")) {
    return bancos.find((b) => b.nombre.toLowerCase().includes("banco de venezuela"));
  }
  return undefined;
}

function procesarFechaExtraida(fechaRaw: string | undefined): string | null {
  if (!fechaRaw) return null;
  const normalizada = normalizarFechaAISO(fechaRaw);
  if (normalizada) return normalizada;

  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaRaw);
  return d ? d[0] : fechaRaw;
}

async function obtenerTasaParaCalculo(
  fecha: string | null,
  tasaActual: number | null,
): Promise<{ tasa: number | null; error: string | null }> {
  if (!fecha || !esFechaRazonable(fecha)) {
    return { tasa: tasaActual, error: null };
  }

  try {
    const data = await fetchTasaBcvPorFecha(fecha);
    return { tasa: data.promedio, error: null };
  } catch {
    try {
      const data = await fetchTasaBcv();
      return { tasa: data.promedio, error: "No hay tasa histórica para esa fecha. Usando tasa del día actual." };
    } catch {
      return { tasa: tasaActual, error: "No hay tasa histórica para esa fecha. Usando tasa del día actual." };
    }
  }
}

function calcularMontosDesdeOcr(
  extract: { montoBs?: number | null; montoUsd?: number | null },
  tasa: number | null,
): { montoBs: string | null; montoUsd: string | null } {
  let montoBs: string | null = null;
  let montoUsd: string | null = null;

  if (extract.montoBs != null && extract.montoBs > 0) {
    montoBs = extract.montoBs.toFixed(2);
  }
  if (extract.montoUsd != null && extract.montoUsd > 0) {
    montoUsd = extract.montoUsd.toFixed(2);
  } else if (extract.montoBs != null && extract.montoBs > 0 && tasa != null && tasa > 0) {
    montoUsd = (extract.montoBs / tasa).toFixed(2);
  }

  return { montoBs, montoUsd };
}

const INPUT_NUMBER_CLASS =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

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
  const [advertenciaSobrePago, setAdvertenciaSobrePago] = useState<string | null>(null);
  const [abono, setAbono] = useState<number>(0);
  const ocrMontosAplicadosRef = useRef(false);
  const [propietarioLogueado, setPropietarioLogueado] = useState(false);

  useEffect(() => {
    if (!esPropietarioLogueado()) return;
    const datos = getDatosPropietario();
    if (!datos) return;
    setPropietarioLogueado(true);
    setPiso(String(datos.piso));
    setApartamento(String(datos.apartamento));
  }, []);

  useEffect(() => {
    fetchBanks()
      .then(setBancos)
      .catch(() => setErrorBancos("No se pudieron cargar los bancos"))
      .finally(() => setCargandoBancos(false));
  }, []);

  useEffect(() => {
    fetchTasaBcv()
    .then((data) => setTasaBcv(data.promedio))
    .catch(() => setTasaBcv(null))
  }, [])

  const actualizarMontosDesdeRecibos = useCallback((
    recibos: Recibo[],
    abonoData: number,
    tasa: number | null,
  ): void => {
    if (ocrMontosAplicadosRef.current) return;

    const idsSeleccionados = recibos.length === 1 ? [recibos[0]._id] : [];
    const totalDeuda = recibos
      .filter((r) => idsSeleccionados.includes(r._id))
      .reduce((sum, recibo) => sum + (recibo.montoUsd - (recibo.montoPagado ?? 0)), 0);
    const totalAPagar = Math.max(0, totalDeuda - abonoData);

    if (totalAPagar > 0) {
      setMontoUsd(totalAPagar.toFixed(2));
      if (tasa != null && tasa > 0) {
        setMontoBs((totalAPagar * tasa).toFixed(2));
      } else {
        setMontoBs("");
      }
    } else {
      setMontoUsd("");
      setMontoBs("");
    }
  }, []);

  useEffect(() => {
    async function cargarRecibos() {
      if (!piso || !apartamento || mesesSeleccionados.length === 0) {
        setRecibosPendientes([]);
        setAbono(0);
        if (!ocrMontosAplicadosRef.current) setMontoUsd("");
        return;
      }

      try {
        setCargandoRecibos(true);
        const [todosRecibos, abonoData] = await Promise.all([
          fetchRecibos(Number.parseInt(piso), Number.parseInt(apartamento), "pendiente"),
          fetchAbono(Number.parseInt(piso), Number.parseInt(apartamento)),
        ]);

        setAbono(abonoData);
        const mesesNumeros = new Set(mesesSeleccionados.map((i) => i + 1));
        const recibosFiltrados = filterRecibosByMeses(todosRecibos, mesesNumeros);

        setRecibosPendientes(recibosFiltrados);
        setRecibosSeleccionados(recibosFiltrados.length === 1 ? [recibosFiltrados[0]._id] : []);
        actualizarMontosDesdeRecibos(recibosFiltrados, abonoData, tasaBcv);
      } catch (err) {
        console.error("Error al cargar recibos:", err);
        setRecibosPendientes([]);
      } finally {
        setCargandoRecibos(false);
      }
    }
    cargarRecibos();
  }, [piso, apartamento, mesesSeleccionados, tasaBcv, actualizarMontosDesdeRecibos]);

  const calcularTotal = useCallback(() => {
    if (ocrMontosAplicadosRef.current) return;
    const recibosSeleccionadosData = recibosPendientes.filter((r) =>
      recibosSeleccionados.includes(r._id)
    );
    const totalDeuda = recibosSeleccionadosData.reduce(
      (sum, recibo) => {
        const montoPagado = recibo.montoPagado ?? 0;
        return sum + (recibo.montoUsd - montoPagado);
      },
      0
    );
    const totalAPagar = Math.max(0, totalDeuda - abono);
    if (totalAPagar > 0) {
      setMontoUsd(totalAPagar.toFixed(2));
      if (tasaBcv != null && tasaBcv > 0) {
        setMontoBs((totalAPagar * tasaBcv).toFixed(2));
      } else {
        setMontoBs("");
      }
    } else if (recibosPendientes.length > 0) {
      setMontoUsd("");
      setMontoBs("");
    }
  }, [recibosSeleccionados, recibosPendientes, tasaBcv, abono]);

  useEffect(() => {
    calcularTotal();
  }, [calcularTotal]);

  useEffect(() => {
    if (!recibosPendientes.length || recibosSeleccionados.length === 0) {
      setAdvertenciaSobrePago(null);
      return;
    }
    const totalDeuda = recibosPendientes
      .filter((r) => recibosSeleccionados.includes(r._id))
      .reduce((sum, r) => {
        const montoPagado = r.montoPagado ?? 0;
        return sum + (r.montoUsd - montoPagado);
      }, 0);
    const montoNum = Number.parseFloat(montoUsd);
    if (!Number.isNaN(montoNum) && montoNum > totalDeuda) {
      const exceso = montoNum - totalDeuda;
      setAdvertenciaSobrePago(
        `Precaución: el pago que realizaste ($${montoNum.toFixed(2)}) es mayor al de la deuda ($${totalDeuda.toFixed(2)}). Los $${exceso.toFixed(2)} restantes quedarán como abono a tu favor para futuras deudas. Puedes continuar si quieres realizar este abono.`
      );
    } else {
      setAdvertenciaSobrePago(null);
    }
  }, [montoUsd, recibosSeleccionados, recibosPendientes]);

  const handleMontoUsdChange = (value: string) => {
    setMontoUsd(value);
    if (tasaBcv != null && tasaBcv > 0) {
      const num = Number.parseFloat(value.replace(",", "."));
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
      const num = Number.parseFloat(value.replace(",", "."));
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

    const validacion = validarArchivo(file);
    if (!validacion.valido) {
      setErrorEnvio(validacion.error);
      setArchivo(null);
      return;
    }

    try {
      setComprimiendo(true);
      setErrorEnvio(null);
      setErrorOcr(null);

      const compressedFile = await comprimirImagen(file);
      setArchivo(compressedFile);
      setComprimiendo(false);

      await procesarOcr(compressedFile);
    } catch (err) {
      console.error("Error al comprimir imagen:", err);
      setErrorEnvio("Error al procesar la imagen. Intente con otra.");
      setArchivo(null);
    } finally {
      setComprimiendo(false);
    }
  };

  async function procesarOcr(compressedFile: File): Promise<void> {
    setExtrayendoOcr(true);
    setErrorTasaHistorica(null);

    try {
      const extract = await extractComprobante(compressedFile);

      if (extract.banco) {
        const bancoEncontrado = encontrarBancoPorNombre(bancos, extract.banco);
        if (bancoEncontrado) setBanco(bancoEncontrado.nombre);
      }

      const fechaNormalizada = procesarFechaExtraida(extract.fechaPago);
      if (fechaNormalizada) {
        setFechaPago(fechaNormalizada);
      }

      if (extract.numeroComprobante) setNumeroComprobante(extract.numeroComprobante);

      const { tasa, error } = await obtenerTasaParaCalculo(fechaNormalizada, tasaBcv);
      if (tasa != null) {
        setTasaBcv(tasa);
        setTasaBcvFecha(fechaNormalizada);
      }
      setErrorTasaHistorica(error);

      const { montoBs: montoBsCalculado, montoUsd: montoUsdCalculado } = calcularMontosDesdeOcr(
        { montoBs: extract.montoBs ?? undefined, montoUsd: extract.montoUsd ?? undefined },
        tasa
      );

      if (montoBsCalculado) setMontoBs(montoBsCalculado);
      if (montoUsdCalculado) setMontoUsd(montoUsdCalculado);

      if (montoBsCalculado || montoUsdCalculado) {
        ocrMontosAplicadosRef.current = true;
      }
    } catch {
      setErrorOcr(
        "No pudimos leer el comprobante automáticamente. Por favor complete los datos manualmente."
      );
    } finally {
      setExtrayendoOcr(false);
    }
  }

  const toggleRecibo = (reciboId: string) => {
    setRecibosSeleccionados((prev) =>
      prev.includes(reciboId)
        ? prev.filter((id) => id !== reciboId)
        : [...prev, reciboId]
    );
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
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
    const montoBsNum = montoBs.trim() === "" ? undefined : Number.parseFloat(montoBs);
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
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl bg-background px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-secondary hover:text-secondary/80"
        >
          ← Inicio
        </Link>
      </div>
      <h1 className="mb-8 text-center text-2xl font-semibold text-foreground">
        Reportar pago de condominio
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <span className="mb-1 block text-sm font-medium text-foreground">
            Cargue su comprobante aquí (máximo 5MB)
          </span>
          <label className="inline-block cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              disabled={comprimiendo || extrayendoOcr}
              className="sr-only"
            />
            {getLabelTextoArchivo(comprimiendo, extrayendoOcr, archivo)}
          </label>
          {comprimiendo && (
            <p className="mt-1 text-xs text-accent-foreground">
              Optimizando imagen para reducir tamaño...
            </p>
          )}
          {extrayendoOcr && (
            <p className="mt-1 text-xs text-accent-foreground">
              Extrayendo datos del comprobante...
            </p>
          )}
          {errorOcr && (
            <p className="mt-1 text-xs text-accent-foreground">{errorOcr}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="banco"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Banco de envío
          </label>
          <select
            id="banco"
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            required
            disabled={cargandoBancos}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
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
            <p className="mt-1 text-xs text-destructive">{errorBancos}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="fechaPago"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Fecha de pago
          </label>
          <input
            type="date"
            id="fechaPago"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="numeroComprobante"
            className="mb-1 block text-sm font-medium text-foreground"
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
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="montoUsd"
            className="mb-1 block text-sm font-medium text-foreground"
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
            className="mb-1 block text-sm font-medium text-foreground"
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
            <p className="mt-1 text-xs text-muted-foreground">
              {tasaBcvFecha
                ? `Tasa BCV del ${formatFechaParaUsuario(tasaBcvFecha)}: ${tasaBcv.toLocaleString("es-VE")} Bs/USD`
                : `Tasa BCV del día: ${tasaBcv.toLocaleString("es-VE")} Bs/USD`}
            </p>
          )}
          {errorTasaHistorica && (
            <p className="mt-1 text-xs text-accent-foreground">{errorTasaHistorica}</p>
          )}
        </div>

        {propietarioLogueado ? (
          <div className="rounded-lg border border-border bg-primary/10 px-4 py-3 text-sm text-foreground">
            Reportando pago para tu apartamento:{" "}
            <strong>Piso {piso} · Apt {apartamento}</strong>
          </div>
        ) : (
          <>
        <div>
          <label
            htmlFor="piso"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Piso
          </label>
          <select
            id="piso"
            value={piso}
            onChange={(e) => setPiso(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Número de apartamento
          </label>
          <select
            id="apartamento"
            value={apartamento}
            onChange={(e) => setApartamento(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Seleccione</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
          </>
        )}

        <div>
          <span className="mb-2 block text-sm font-medium text-foreground">
            Mes o meses a pagar
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MESES.map((nombre, i) => (
              <label
                key={nombre}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={mesesSeleccionados.includes(i)}
                  onChange={() => toggleMes(i)}
                  className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                />
                <span className="text-sm text-foreground">{nombre}</span>
              </label>
            ))}
          </div>
          {mesesSeleccionados.length === 0 && (
            <p className="mt-1 text-xs text-secondary">
              Seleccione al menos un mes.
            </p>
          )}
          {cargandoRecibos && piso && apartamento && mesesSeleccionados.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Buscando recibos pendientes...
            </p>
          )}
          {!cargandoRecibos && recibosPendientes.length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-primary/10 p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
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
                          ? "border-primary bg-primary/20"
                          : "border-border bg-card"
                      } px-3 py-2 transition-colors hover:bg-muted`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {mostrarCheckbox && (
                          <input
                            type="checkbox"
                            checked={estaSeleccionado}
                            onChange={() => toggleRecibo(recibo._id)}
                            className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {recibo.tipoDeuda}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {recibo.meses
                              .map((m) => MESES[m - 1])
                              .join(", ")}
                          </p>
                          {montoPagado > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Total: ${recibo.montoUsd.toFixed(2)} · Pagado: ${montoPagado.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-secondary">
                          ${montoPendiente.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Pendiente</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {recibosSeleccionados.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {abono > 0 && (
                    <p className="text-xs text-secondary">
                      Tienes ${abono.toFixed(2)} de abono que se aplicará a esta deuda.
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      {abono > 0 ? "Total a pagar (con abono aplicado):" : "Total a pagar:"}
                    </p>
                    <p className="text-lg font-bold text-secondary">
                      $
                      {Math.max(
                        0,
                        recibosPendientes
                          .filter((r) => recibosSeleccionados.includes(r._id))
                          .reduce((sum, r) => {
                            const montoPagado = r.montoPagado ?? 0;
                            return sum + (r.montoUsd - montoPagado);
                          }, 0) - abono
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              {recibosPendientes.length > 1 && recibosSeleccionados.length === 0 && (
                <p className="mt-2 text-xs text-accent-foreground">
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
              <p className="mt-2 text-xs text-accent-foreground">
                No hay recibos pendientes para los meses seleccionados.
              </p>
            )}
        </div>

        {advertenciaSobrePago && (
          <div className="rounded-lg border-2 border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-foreground">
            <p className="font-medium">⚠️ {advertenciaSobrePago}</p>
          </div>
        )}

        {errorEnvio && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorEnvio}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-4 w-full rounded-xl bg-secondary py-3 text-base font-semibold text-secondary-foreground shadow-sm transition-all hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar reporte de pago"}
        </button>
      </form>
    </div>
  );
}
