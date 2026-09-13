"use client";

import { useState, type ChangeEvent, type MutableRefObject } from "react";
import { extractComprobante, type Bank } from "@/lib/api";
import {
  calcularMontosDesdeOcr,
  comprimirImagen,
  encontrarBancoPorNombre,
  obtenerTasaParaCalculo,
  procesarFechaExtraida,
  validarArchivo,
} from "../utils/comprobante";

type UseComprobanteUploadParams = Readonly<{
  bancos: Bank[];
  tasaBcv: number | null;
  ocrMontosAplicadosRef: MutableRefObject<boolean>;
  setBanco: (value: string) => void;
  setFechaPago: (value: string) => void;
  setNumeroComprobante: (value: string) => void;
  setMontoUsd: (value: string) => void;
  setMontoBs: (value: string) => void;
  setTasaBcv: (value: number | null) => void;
  setTasaBcvFecha: (value: string | null) => void;
  setErrorEnvio: (value: string | null) => void;
}>;

export function useComprobanteUpload({
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
}: UseComprobanteUploadParams) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [extrayendoOcr, setExtrayendoOcr] = useState(false);
  const [errorOcr, setErrorOcr] = useState<string | null>(null);
  const [errorTasaHistorica, setErrorTasaHistorica] = useState<string | null>(null);

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
        tasa,
      );

      if (montoBsCalculado) setMontoBs(montoBsCalculado);
      if (montoUsdCalculado) setMontoUsd(montoUsdCalculado);

      if (montoBsCalculado || montoUsdCalculado) {
        ocrMontosAplicadosRef.current = true;
      }
    } catch {
      setErrorOcr(
        "No pudimos leer el comprobante automáticamente. Por favor complete los datos manualmente.",
      );
    } finally {
      setExtrayendoOcr(false);
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

  return {
    archivo,
    comprimiendo,
    extrayendoOcr,
    errorOcr,
    errorTasaHistorica,
    handleFileChange,
  };
}
