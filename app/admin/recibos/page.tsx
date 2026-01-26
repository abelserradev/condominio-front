"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

export default function AdminRecibosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const piso = searchParams.get("piso");
  const apartamento = searchParams.get("apartamento");
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    if (piso && apartamento) {
      cargarPagos();
    }
  }, [piso, apartamento, router]);

  async function cargarPagos() {
    if (!piso || !apartamento) return;
    try {
      setCargando(true);
      const todosPagos = await fetchPayments(
        parseInt(piso),
        parseInt(apartamento)
      );
      // Ordenar por fecha de creación (más recientes primero)
      const ordenados = todosPagos.sort((a, b) => {
        const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return fechaB - fechaA;
      });
      setPagos(ordenados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pagos");
    } finally {
      setCargando(false);
    }
  }

  function formatearMeses(meses: number[]): string {
    return meses.map((m) => MESES[m - 1]).join(", ");
  }

  function formatearMonto(monto: number): string {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(monto);
  }

  function obtenerColorEstado(estado?: string): string {
    switch (estado) {
      case "aceptado":
        return "bg-green-100 text-green-800";
      case "rechazado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  }

  function obtenerTextoEstado(estado?: string): string {
    switch (estado) {
      case "aceptado":
        return "Aceptado";
      case "rechazado":
        return "Rechazado";
      default:
        return "Pendiente";
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/admin/inicio"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            ← Volver a inicio
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-800">
          Reportes de Pago
        </h1>
        <p className="mb-6 text-slate-600">
          Piso {piso} - Apartamento {apartamento}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {pagos.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-slate-500">
            No hay reportes de pago para este apartamento
          </div>
        ) : (
          <div className="space-y-4">
            {pagos.map((pago) => (
              <div
                key={pago._id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Mes(es): {formatearMeses(pago.meses)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Fecha de pago:{" "}
                      {new Date(pago.fechaPago).toLocaleDateString("es-VE")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${obtenerColorEstado(
                      pago.estado
                    )}`}
                  >
                    {obtenerTextoEstado(pago.estado)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Monto</p>
                    <p className="text-lg font-bold text-slate-800">
                      {formatearMonto(pago.montoUsd)}
                    </p>
                    {pago.montoBs && (
                      <p className="text-sm text-slate-600">
                        {new Intl.NumberFormat("es-VE", {
                          style: "currency",
                          currency: "VES",
                        }).format(pago.montoBs)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Comprobante
                    </p>
                    <p className="text-slate-800">{pago.numeroComprobante}</p>
                    <p className="text-sm text-slate-600">{pago.banco}</p>
                  </div>
                </div>

                {pago.comprobanteFileId && (
                  <div className="mt-4">
                    <a
                      href={getComprobanteUrl(pago.comprobanteFileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-green-600 hover:text-green-700"
                    >
                      Ver comprobante →
                    </a>
                  </div>
                )}

                {pago.createdAt && (
                  <p className="mt-4 text-xs text-slate-500">
                    Reportado el:{" "}
                    {new Date(pago.createdAt).toLocaleDateString("es-VE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}