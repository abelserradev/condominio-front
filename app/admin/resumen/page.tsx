"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchApartments,
  fetchRecibos,
  fetchPayments,
  type Payment,
  type Recibo,
} from "@/lib/api";

function esDeudaCondominio(tipoDeuda: string): boolean {
  const t = tipoDeuda.toLowerCase();
  return t.includes("condominio") || t === "pendiente" || t === "factura";
}

function esDeudaCuotasEspeciales(tipoDeuda: string): boolean {
  const t = tipoDeuda.toLowerCase();
  return (
    t.includes("cuota") ||
    t.includes("especial") ||
    t.includes("acumulada") ||
    t.includes("reparacion")
  );
}

type SegmentoCircular = {
  libres: number;
  morosos: number;
  enProgreso: number;
  total: number;
};

function calcularSegmentos(
  recibos: Recibo[],
  pagosPendientes: Payment[],
  totalApartamentos: number,
): SegmentoCircular {
  const recibosPendientesCondominioOCuotas = recibos.filter(
    (r) =>
      (esDeudaCondominio(r.tipoDeuda) || esDeudaCuotasEspeciales(r.tipoDeuda)) &&
      (r.estado ?? "pendiente") === "pendiente" &&
      (r.montoPagado ?? 0) < r.montoUsd,
  );
  const keysMorosos = new Set<string>();
  for (const r of recibosPendientesCondominioOCuotas) {
    const p = Number(r.piso);
    const a = Number(r.apartamento);
    if (Number.isFinite(p) && Number.isFinite(a)) keysMorosos.add(`${p}-${a}`);
  }
  const morosos = keysMorosos.size;
  const recibosConSaldo = recibos.filter((r) => (r.montoPagado ?? 0) < r.montoUsd);
  const keysConDeuda = new Set(
    recibosConSaldo.map((r) => `${Number(r.piso)}-${Number(r.apartamento)}`),
  );
  const libres = Math.max(0, totalApartamentos - keysConDeuda.size);
  const total = totalApartamentos;
  const enProgreso = Math.max(0, total - libres - morosos);
  return {
    libres,
    morosos,
    enProgreso,
    total,
  };
}

type AptPago = {
  piso: number;
  apartamento: number;
  primerPago: string;
  totalPagado: number;
  cantidadPagos: number;
};

function apartamentosQueMasRapidoPagan(pagosAceptados: Payment[]): AptPago[] {
  const porApt = new Map<string, { fechas: number[]; total: number }>();
  for (const p of pagosAceptados) {
    const key = `${Number(p.piso)}-${Number(p.apartamento)}`;
    const fecha = p.fechaPago ? new Date(p.fechaPago).getTime() : 0;
    const prev = porApt.get(key);
    if (!prev) {
      porApt.set(key, { fechas: [fecha], total: p.montoUsd ?? 0 });
    } else {
      prev.fechas.push(fecha);
      prev.total += p.montoUsd ?? 0;
    }
  }
  const lista: AptPago[] = [];
  porApt.forEach((v, key) => {
    const [piso, apartamento] = key.split("-").map(Number);
    const primerPagoTs = Math.min(...v.fechas);
    lista.push({
      piso,
      apartamento,
      primerPago: new Date(primerPagoTs).toISOString(),
      totalPagado: v.total,
      cantidadPagos: v.fechas.length,
    });
  });
  lista.sort((a, b) => new Date(a.primerPago).getTime() - new Date(b.primerPago).getTime());
  return lista;
}

const CX = 100;
const CY = 100;
const GROSOR_ANILLO = 5;
const SEPARACION_ANILLOS = 14;
const RADIO_ANILLO_EXTERNO = 70;
const RADIO_ANILLO_MEDIO = RADIO_ANILLO_EXTERNO - GROSOR_ANILLO - SEPARACION_ANILLOS;
const RADIO_ANILLO_INTERNO = RADIO_ANILLO_MEDIO - GROSOR_ANILLO - SEPARACION_ANILLOS;

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcoAnillo(
  cx: number,
  cy: number,
  radio: number,
  porcentaje: number,
  color: string,
) {
  if (porcentaje <= 0) return null;
  const grados = Math.min(100, porcentaje) * 3.6;
  const startDeg = -90;
  const endDeg = startDeg + grados;
  const large = grados > 180 ? 1 : 0;
  const p1 = polarToXY(cx, cy, radio, startDeg);
  const p2 = polarToXY(cx, cy, radio, endDeg);
  const d = `M ${p1.x} ${p1.y} A ${radio} ${radio} 0 ${large} 1 ${p2.x} ${p2.y}`;
  return (
    <path
      key={color}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={GROSOR_ANILLO}
      strokeLinecap="butt"
    />
  );
}

function GraficoCircularResumen({ seg }: { seg: SegmentoCircular }) {
  const { libres, morosos, enProgreso, total } = seg;
  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Sin datos
      </div>
    );
  }
  const pLibres = total > 0 ? Math.round((libres / total) * 100) : 0;
  const pMorosos = total > 0 ? Math.round((morosos / total) * 100) : 0;
  const pEnProgreso = total > 0 ? Math.round((enProgreso / total) * 100) : 0;

  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-64 w-64" aria-hidden>
      {arcoAnillo(CX, CY, RADIO_ANILLO_EXTERNO, pLibres, "#22c55e")}
      {arcoAnillo(CX, CY, RADIO_ANILLO_MEDIO, pEnProgreso, "#f97316")}
      {arcoAnillo(CX, CY, RADIO_ANILLO_INTERNO, pMorosos, "#ef4444")}
    </svg>
  );
}

export default function AdminResumenPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [segmentos, setSegmentos] = useState<SegmentoCircular>({
    libres: 0,
    morosos: 0,
    enProgreso: 0,
    total: 0,
  });
  const [listaRapidos, setListaRapidos] = useState<AptPago[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const cargar = async () => {
      try {
        setCargando(true);
        const [apts, recibos, pagosPend, pagosAcept] = await Promise.all([
          fetchApartments(),
          fetchRecibos(),
          fetchPayments(undefined, undefined, "pendiente"),
          fetchPayments(undefined, undefined, "aceptado"),
        ]);
        const totalApartamentos = apts.length;
        const seg = calcularSegmentos(recibos, pagosPend, totalApartamentos);
        setSegmentos(seg);
        const ordenados = apartamentosQueMasRapidoPagan(pagosAcept);
        setListaRapidos(ordenados);
      } catch {
        setSegmentos({ libres: 0, morosos: 0, enProgreso: 0, total: 0 });
        setListaRapidos([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [router]);

  if (cargando) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <p className="text-slate-600">Cargando resumen…</p>
      </div>
    );
  }

  const { libres, morosos, enProgreso, total } = segmentos;
  const pLibres = total > 0 ? Math.round((libres / total) * 100) : 0;
  const pMorosos = total > 0 ? Math.round((morosos / total) * 100) : 0;
  const pEnProgreso = total > 0 ? Math.round((enProgreso / total) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Resumen del condominio</h1>
          <Link
            href="/admin/inicio"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-10 grid gap-8 lg:grid-cols-2">
          {/* Gráfico circular */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Estado de cobranza
            </h2>
            <GraficoCircularResumen seg={segmentos} />
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-xl font-bold text-slate-800">{pLibres}%</span>
                <span className="text-xs text-slate-500">Libres de deudas</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </span>
                <span className="text-xl font-bold text-slate-800">{pEnProgreso}%</span>
                <span className="text-xs text-slate-500">Progreso pago</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </span>
                <span className="text-xl font-bold text-slate-800">{pMorosos}%</span>
                <span className="text-xs text-slate-500">Morosos</span>
              </div>
            </div>
          </div>

          {/* Apartamentos que más rápido pagan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Apartamentos que más rápido pagan
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Ordenados por fecha del primer pago (quien paga primero).
            </p>
            {listaRapidos.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                No hay pagos aceptados aún.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[280px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="pb-2 font-medium">Apartamento</th>
                      <th className="pb-2 font-medium">Primer pago</th>
                      <th className="pb-2 font-medium">Total pagado</th>
                      <th className="pb-2 font-medium">Pagos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaRapidos.slice(0, 10).map((apt) => (
                      <tr
                        key={`${apt.piso}-${apt.apartamento}`}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-3 font-medium text-slate-800">
                          Piso {apt.piso} – Apt {apt.apartamento}
                        </td>
                        <td className="py-3 text-slate-600">
                          {new Date(apt.primerPago).toLocaleDateString("es-VE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 text-slate-800">
                          {new Intl.NumberFormat("es-VE", {
                            style: "currency",
                            currency: "USD",
                          }).format(apt.totalPagado)}
                        </td>
                        <td className="py-3 text-slate-600">{apt.cantidadPagos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
