"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PisosGrid } from "../components/recibos/pisos-grid";
import { ApartamentosGrid } from "../components/recibos/apartamentos-grid";
import {
  fetchPayments,
  getComprobanteUrl,
  type Payment,
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

type Vista = "pisos" | "apartamentos" | "recibos";

export default function RecibosPage() {
  const [vista, setVista] = useState<Vista>("pisos");
  const [pisoSeleccionado, setPisoSeleccionado] = useState<number | null>(null);
  const [apartamentoSeleccionado, setApartamentoSeleccionado] = useState<
    number | null
  >(null);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPiso = (piso: number) => {
    setPisoSeleccionado(piso);
    setApartamentoSeleccionado(null);
    setVista("apartamentos");
  };

  const handleSelectApartamento = (apartamento: number) => {
    setApartamentoSeleccionado(apartamento);
    setVista("recibos");
  };

  const volverAPisos = () => {
    setVista("pisos");
    setPisoSeleccionado(null);
    setApartamentoSeleccionado(null);
  };

  const volverAApartamentos = () => {
    setVista("apartamentos");
    setApartamentoSeleccionado(null);
  };

  useEffect(() => {
    if (
      vista !== "recibos" ||
      pisoSeleccionado == null ||
      apartamentoSeleccionado == null
    ) {
      setPagos([]);
      return;
    }
    setCargando(true);
    setError(null);
    fetchPayments(pisoSeleccionado, apartamentoSeleccionado)
      .then(setPagos)
      .catch(() => setError("No se pudieron cargar los pagos"))
      .finally(() => setCargando(false));
  }, [vista, pisoSeleccionado, apartamentoSeleccionado]);

  const formatearMeses = (meses: number[]) =>
    meses.map((m) => MESES[m - 1]).join(", ");

  function obtenerColorEstado(estado?: string): string {
    switch (estado) {
      case "aceptado":
        return "border-green-300 bg-green-50";
      case "rechazado":
        return "border-red-300 bg-red-50";
      default:
        return "border-yellow-300 bg-yellow-50";
    }
  }

  function obtenerTextoEstado(estado?: string): string {
    switch (estado) {
      case "aceptado":
        return "Pagada";
      case "rechazado":
        return "Rechazada";
      default:
        return "Pendiente";
    }
  }

  function obtenerColorTextoEstado(estado?: string): string {
    switch (estado) {
      case "aceptado":
        return "text-green-800";
      case "rechazado":
        return "text-red-800";
      default:
        return "text-yellow-800";
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl bg-white px-4 py-8">
      {vista === "pisos" && (
        <>
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              ← Inicio
            </Link>
          </div>
          <h1 className="mb-8 text-center text-2xl font-semibold text-green-600">
            Pisos
          </h1>
          <PisosGrid onSelectPiso={handleSelectPiso} />
        </>
      )}

      {vista === "apartamentos" && (
        <>
          <div className="mb-6">
            <button
              type="button"
              onClick={volverAPisos}
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              ← Volver a pisos
            </button>
          </div>
          <h1 className="mb-8 text-center text-2xl font-semibold text-green-600">
            Apartamentos
          </h1>
          <p className="mb-6 text-center text-green-600">
            Piso {pisoSeleccionado ?? ""}
          </p>
          <ApartamentosGrid onSelectApartamento={handleSelectApartamento} />
        </>
      )}

      {vista === "recibos" && (
        <>
          <div className="mb-6">
            <button
              type="button"
              onClick={volverAApartamentos}
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              ← Volver a apartamentos
            </button>
          </div>
          <h1 className="mb-2 text-center text-2xl font-semibold text-green-600">
            Recibos por mes
          </h1>
          <p className="mb-8 text-center text-green-600">
            Piso {pisoSeleccionado ?? ""} · Apartamento{" "}
            {apartamentoSeleccionado ?? ""}
          </p>

          {cargando && (
            <p className="py-8 text-center text-slate-500">
              Cargando pagos…
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {!cargando && !error && pagos.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-green-200 bg-green-50/80 px-6 py-12 text-center">
              <p className="text-slate-700">
                No hay pagos registrados para este apartamento.
              </p>
            </div>
          )}
          {!cargando && !error && pagos.length > 0 && (
            <ul className="space-y-4">
              {pagos.map((p) => (
                <li
                  key={p._id}
                  className={`rounded-xl border-2 p-4 ${obtenerColorEstado(
                    p.estado
                  )}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-slate-800">
                      Mes(es): {formatearMeses(p.meses)}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${obtenerColorTextoEstado(
                        p.estado
                      )} bg-white`}
                    >
                      {obtenerTextoEstado(p.estado)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Fecha pago:{" "}
                    {new Date(p.fechaPago).toLocaleDateString("es-VE")} ·{" "}
                    {p.montoUsd} USD
                    {p.montoBs != null &&
                      ` (${p.montoBs.toLocaleString("es-VE")} Bs)`}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Comprobante: {p.numeroComprobante} · {p.banco}
                  </p>
                  {p.comprobanteFileId && (
                    <a
                      href={getComprobanteUrl(p.comprobanteFileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-green-600 hover:text-green-700"
                    >
                      Ver comprobante →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}