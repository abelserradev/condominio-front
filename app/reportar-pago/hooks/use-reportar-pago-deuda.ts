"use client";

import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import { fetchAbono, fetchRecibos, type Recibo } from "@/lib/api";
import { filterRecibosByMeses } from "../utils/recibos";

type UseReportarPagoDeudaParams = Readonly<{
  piso: string;
  apartamento: string;
  mesesSeleccionados: number[];
  tasaBcv: number | null;
  montoUsd: string;
  ocrMontosAplicadosRef: MutableRefObject<boolean>;
  setMontoUsd: (value: string) => void;
  setMontoBs: (value: string) => void;
}>;

/** Sincroniza recibos pendientes, abono y montos sugeridos sin pisar valores del OCR */
export function useReportarPagoDeuda({
  piso,
  apartamento,
  mesesSeleccionados,
  tasaBcv,
  montoUsd,
  ocrMontosAplicadosRef,
  setMontoUsd,
  setMontoBs,
}: UseReportarPagoDeudaParams) {
  const [recibosPendientes, setRecibosPendientes] = useState<Recibo[]>([]);
  const [recibosSeleccionados, setRecibosSeleccionados] = useState<string[]>([]);
  const [cargandoRecibos, setCargandoRecibos] = useState(false);
  const [abono, setAbono] = useState(0);
  const [advertenciaSobrePago, setAdvertenciaSobrePago] = useState<string | null>(null);

  const actualizarMontosDesdeRecibos = useCallback(
    (recibos: Recibo[], abonoData: number, tasa: number | null): void => {
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
    },
    [ocrMontosAplicadosRef, setMontoBs, setMontoUsd],
  );

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
          fetchRecibos(Number.parseInt(piso, 10), Number.parseInt(apartamento, 10), "pendiente"),
          fetchAbono(Number.parseInt(piso, 10), Number.parseInt(apartamento, 10)),
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
    void cargarRecibos();
  }, [
    piso,
    apartamento,
    mesesSeleccionados,
    tasaBcv,
    actualizarMontosDesdeRecibos,
    ocrMontosAplicadosRef,
    setMontoUsd,
  ]);

  const calcularTotal = useCallback(() => {
    if (ocrMontosAplicadosRef.current) return;
    const recibosSeleccionadosData = recibosPendientes.filter((r) =>
      recibosSeleccionados.includes(r._id),
    );
    const totalDeuda = recibosSeleccionadosData.reduce((sum, recibo) => {
      const montoPagado = recibo.montoPagado ?? 0;
      return sum + (recibo.montoUsd - montoPagado);
    }, 0);
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
  }, [
    abono,
    ocrMontosAplicadosRef,
    recibosPendientes,
    recibosSeleccionados,
    setMontoBs,
    setMontoUsd,
    tasaBcv,
  ]);

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
        `Precaución: el pago que realizaste ($${montoNum.toFixed(2)}) es mayor al de la deuda ($${totalDeuda.toFixed(2)}). Los $${exceso.toFixed(2)} restantes quedarán como abono a tu favor para futuras deudas. Puedes continuar si quieres realizar este abono.`,
      );
    } else {
      setAdvertenciaSobrePago(null);
    }
  }, [montoUsd, recibosPendientes, recibosSeleccionados]);

  const toggleRecibo = (reciboId: string) => {
    setRecibosSeleccionados((prev) =>
      prev.includes(reciboId) ? prev.filter((id) => id !== reciboId) : [...prev, reciboId],
    );
  };

  return {
    recibosPendientes,
    recibosSeleccionados,
    cargandoRecibos,
    abono,
    advertenciaSobrePago,
    toggleRecibo,
  };
}
