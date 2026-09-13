"use client";

import { useState, useEffect, useRef, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postPayment } from "@/lib/api";
import { useComprobanteUpload } from "./hooks/use-comprobante-upload";
import { useReportarPagoBootstrap } from "./hooks/use-reportar-pago-bootstrap";
import { useReportarPagoDeuda } from "./hooks/use-reportar-pago-deuda";
import { ComprobanteUploadField } from "./components/comprobante-upload-field";
import { MesesRecibosSection } from "./components/meses-recibos-section";
import { ReportarPagoCamposPrincipales } from "./components/reportar-pago-campos-principales";
import { ReportarPagoUbicacionFields } from "./components/reportar-pago-ubicacion-fields";

export default function ReportarPagoPage() {
  const router = useRouter();
  const {
    bancos,
    cargandoBancos,
    errorBancos,
    layoutApartamentos,
    cargandoLayout,
    tasaBcv: tasaBcvBootstrap,
    propietarioLogueado,
    pisoInicial,
    apartamentoInicial,
  } = useReportarPagoBootstrap();
  const [piso, setPiso] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [mesesSeleccionados, setMesesSeleccionados] = useState<number[]>([]);
  const [banco, setBanco] = useState("");
  const [fechaPago, setFechaPago] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [montoUsd, setMontoUsd] = useState("");
  const [montoBs, setMontoBs] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [tasaBcv, setTasaBcv] = useState<number | null>(tasaBcvBootstrap);
  const [tasaBcvFecha, setTasaBcvFecha] = useState<string | null>(null);
  const ocrMontosAplicadosRef = useRef(false);

  const {
    archivo,
    comprimiendo,
    extrayendoOcr,
    errorOcr,
    errorTasaHistorica,
    handleFileChange,
  } = useComprobanteUpload({
    bancos,
    tasaBcv,
    ocrMontosAplicadosRef,
    setBanco,
    setFechaPago,
    setNumeroComprobante,
    setMontoUsd,
    setMontoBs,
    setTasaBcv,
    setTasaBcvFecha,
    setErrorEnvio,
  });

  const {
    recibosPendientes,
    recibosSeleccionados,
    cargandoRecibos,
    abono,
    advertenciaSobrePago,
    toggleRecibo,
  } = useReportarPagoDeuda({
    piso,
    apartamento,
    mesesSeleccionados,
    tasaBcv,
    montoUsd,
    ocrMontosAplicadosRef,
    setMontoUsd,
    setMontoBs,
  });
  useEffect(() => {
    setTasaBcv(tasaBcvBootstrap);
  }, [tasaBcvBootstrap]);

  useEffect(() => {
    if (!pisoInicial) return;
    setPiso(pisoInicial);
    setApartamento(apartamentoInicial);
  }, [pisoInicial, apartamentoInicial]);

  const pisosDisponibles = [...new Set(layoutApartamentos.map((a) => a.piso))].sort(
    (a, b) => a - b,
  );
  const apartamentosDelPiso = piso
    ? layoutApartamentos
        .filter((a) => a.piso === Number.parseInt(piso, 10))
        .map((a) => a.numero)
        .sort((a, b) => a - b)
    : [];

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
        <ComprobanteUploadField
          comprimiendo={comprimiendo}
          extrayendoOcr={extrayendoOcr}
          errorOcr={errorOcr}
          archivo={archivo}
          onFileChange={handleFileChange}
        />

        <ReportarPagoCamposPrincipales
          bancos={bancos}
          banco={banco}
          cargandoBancos={cargandoBancos}
          errorBancos={errorBancos}
          fechaPago={fechaPago}
          numeroComprobante={numeroComprobante}
          montoUsd={montoUsd}
          montoBs={montoBs}
          tasaBcv={tasaBcv}
          tasaBcvFecha={tasaBcvFecha}
          errorTasaHistorica={errorTasaHistorica}
          onBancoChange={setBanco}
          onFechaPagoChange={setFechaPago}
          onNumeroComprobanteChange={setNumeroComprobante}
          onMontoUsdChange={handleMontoUsdChange}
          onMontoBsChange={handleMontoBsChange}
        />

        {propietarioLogueado ? (
          <div className="rounded-lg border border-border bg-primary/10 px-4 py-3 text-sm text-foreground">
            Reportando pago para tu apartamento:{" "}
            <strong>Piso {piso} · Apt {apartamento}</strong>
          </div>
        ) : (
          <ReportarPagoUbicacionFields
            piso={piso}
            apartamento={apartamento}
            pisosDisponibles={pisosDisponibles}
            apartamentosDelPiso={apartamentosDelPiso}
            cargandoLayout={cargandoLayout}
            onPisoChange={(value) => {
              setPiso(value);
              setApartamento("");
            }}
            onApartamentoChange={setApartamento}
          />
        )}

        <MesesRecibosSection
          mesesSeleccionados={mesesSeleccionados}
          onToggleMes={toggleMes}
          piso={piso}
          apartamento={apartamento}
          cargandoRecibos={cargandoRecibos}
          recibosPendientes={recibosPendientes}
          recibosSeleccionados={recibosSeleccionados}
          onToggleRecibo={toggleRecibo}
          abono={abono}
        />

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
