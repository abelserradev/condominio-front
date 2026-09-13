"use client";

import { useEffect, useState } from "react";
import {
  fetchBanks,
  fetchBuildingLayout,
  fetchTasaBcv,
  type Apartment,
  type Bank,
} from "@/lib/api";
import { getDatosPropietario, esPropietarioLogueado } from "@/lib/hooks/useRequireRol";

/** Carga inicial compartida: layout, bancos, tasa y prefill de propietario logueado. */
export function useReportarPagoBootstrap(): {
  bancos: Bank[];
  cargandoBancos: boolean;
  errorBancos: string | null;
  layoutApartamentos: Apartment[];
  cargandoLayout: boolean;
  tasaBcv: number | null;
  propietarioLogueado: boolean;
  pisoInicial: string;
  apartamentoInicial: string;
} {
  const [bancos, setBancos] = useState<Bank[]>([]);
  const [cargandoBancos, setCargandoBancos] = useState(true);
  const [errorBancos, setErrorBancos] = useState<string | null>(null);
  const [layoutApartamentos, setLayoutApartamentos] = useState<Apartment[]>([]);
  const [cargandoLayout, setCargandoLayout] = useState(true);
  const [tasaBcv, setTasaBcv] = useState<number | null>(null);
  const [propietarioLogueado] = useState(() => esPropietarioLogueado());
  const [pisoInicial] = useState(() => {
    const datos = getDatosPropietario();
    return datos ? String(datos.piso) : "";
  });
  const [apartamentoInicial] = useState(() => {
    const datos = getDatosPropietario();
    return datos ? String(datos.apartamento) : "";
  });

  useEffect(() => {
    fetchBuildingLayout()
      .then(setLayoutApartamentos)
      .catch(() => setLayoutApartamentos([]))
      .finally(() => setCargandoLayout(false));
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
      .catch(() => setTasaBcv(null));
  }, []);

  return {
    bancos,
    cargandoBancos,
    errorBancos,
    layoutApartamentos,
    cargandoLayout,
    tasaBcv,
    propietarioLogueado,
    pisoInicial,
    apartamentoInicial,
  };
}
