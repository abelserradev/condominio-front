"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchPayments,
  fetchReporteCobranza,
  descargarReporteCobranzaExcel,
  type Payment,
  type EstadoJobExcel,
} from "@/lib/api";

// La clasificación al_dia/moroso la calcula el backend (CobranzaReportService);
// aquí solo se renderiza el resumen. No reintroducir reglas de tipoDeuda.
type SegmentoCircular = {
  alDia: number;
  morosos: number;
  enRevision: number;
  total: number;
};

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
  const { alDia, morosos, enRevision, total } = seg;
  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Sin datos
      </div>
    );
  }
  const pAlDia = total > 0 ? Math.round((alDia / total) * 100) : 0;
  const pMorosos = total > 0 ? Math.round((morosos / total) * 100) : 0;
  const pEnRevision = total > 0 ? Math.round((enRevision / total) * 100) : 0;

  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-64 w-64" aria-hidden>
      {arcoAnillo(CX, CY, RADIO_ANILLO_EXTERNO, pAlDia, "#22c55e")}
      {arcoAnillo(CX, CY, RADIO_ANILLO_MEDIO, pEnRevision, "#f97316")}
      {arcoAnillo(CX, CY, RADIO_ANILLO_INTERNO, pMorosos, "#ef4444")}
    </svg>
  );
}

export default function AdminResumenPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [estadoJob, setEstadoJob] = useState<EstadoJobExcel | null>(null);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const [segmentos, setSegmentos] = useState<SegmentoCircular>({
    alDia: 0,
    morosos: 0,
    enRevision: 0,
    total: 0,
  });
  const [filtroExcel, setFiltroExcel] = useState<
    "todos" | "al_dia" | "moroso"
  >("todos");
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
        const [reporte, pagosAcept] = await Promise.all([
          fetchReporteCobranza(),
          fetchPayments(undefined, undefined, "aceptado"),
        ]);
        setSegmentos({
          alDia: reporte.resumen.alDia,
          morosos: reporte.resumen.morosos,
          enRevision: reporte.resumen.enRevision,
          total: reporte.resumen.totalApartamentos,
        });
        setListaRapidos(apartamentosQueMasRapidoPagan(pagosAcept));
      } catch {
        setSegmentos({ alDia: 0, morosos: 0, enRevision: 0, total: 0 });
        setListaRapidos([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [router]);

  async function handleDescargarExcel() {
    try {
      setDescargando(true);
      setEstadoJob("pending");
      setErrorDescarga(null);
      await descargarReporteCobranzaExcel(filtroExcel, setEstadoJob);
    } catch (err) {
      setEstadoJob("failed");
      setErrorDescarga(
        err instanceof Error ? err.message : "Error al descargar el reporte",
      );
    } finally {
      setDescargando(false);
    }
  }

  const textoBotonExcel =
    estadoJob === "pending"
      ? "Generando Excel…"
      : estadoJob === "ready"
        ? "Descargando…"
        : "Descargar Excel";

  if (cargando) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <p className="text-slate-600">Cargando resumen…</p>
      </div>
    );
  }

  const { alDia, morosos, enRevision, total } = segmentos;
  const pAlDia = total > 0 ? Math.round((alDia / total) * 100) : 0;
  const pMorosos = total > 0 ? Math.round((morosos / total) * 100) : 0;
  const pEnRevision = total > 0 ? Math.round((enRevision / total) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Resumen del condominio</h1>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="sr-only">Filtro del Excel</span>
              <select
                value={filtroExcel}
                onChange={(e) =>
                  setFiltroExcel(
                    e.target.value as "todos" | "al_dia" | "moroso",
                  )
                }
                disabled={descargando}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-60"
              >
                <option value="todos">Excel: todos</option>
                <option value="al_dia">Excel: al día</option>
                <option value="moroso">Excel: morosos</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleDescargarExcel}
              disabled={descargando}
              className="rounded-lg border border-violet-600 px-4 py-2 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 disabled:opacity-60"
            >
              {textoBotonExcel}
            </button>
            <Link
              href="/admin/inicio"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
        {errorDescarga && (
          <p className="mx-auto mt-2 max-w-4xl text-sm text-red-600">{errorDescarga}</p>
        )}
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-10 grid gap-8 lg:grid-cols-2">
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
                <span className="text-xl font-bold text-slate-800">{pAlDia}%</span>
                <span className="text-xs text-slate-500">Al día ({alDia})</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-xl font-bold text-slate-800">{pEnRevision}%</span>
                <span className="text-xs text-slate-500">Pago en revisión ({enRevision})</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </span>
                <span className="text-xl font-bold text-slate-800">{pMorosos}%</span>
                <span className="text-xs text-slate-500">Morosos ({morosos})</span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
              Los pagos en revisión pueden solaparse con morosos.
            </p>
          </div>

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
