"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPayments, type Payment } from "@/lib/api";

function formatearMonto(monto: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
  }).format(monto);
}

export default function AdminPagosAceptadosPage() {
  const router = useRouter();
  const [pagosAceptados, setPagosAceptados] = useState<Payment[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    async function cargar() {
      try {
        setCargando(true);
        const pagos = await fetchPayments(undefined, undefined, "aceptado");
        const ordenados = pagos.sort((a, b) => {
          const fa = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const fb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return fb - fa;
        });
        setPagosAceptados(ordenados);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar pagos");
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [router]);

  if (cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-slate-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Pagos aceptados</h1>
        <Link
          href="/admin/inicio"
          className="text-sm font-medium text-[#5b21b6] hover:underline"
        >
          Volver al inicio
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-medium text-slate-600">
                <th className="px-6 py-3">Tipo de deuda</th>
                <th className="px-6 py-3">Piso</th>
                <th className="px-6 py-3">Apartamento</th>
                <th className="px-6 py-3">Monto</th>
                <th className="px-6 py-3">Fecha de pago</th>
              </tr>
            </thead>
            <tbody>
              {pagosAceptados.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No hay pagos aceptados
                  </td>
                </tr>
              ) : (
                pagosAceptados.map((pago) => (
                  <tr
                    key={pago._id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-slate-800">Condominio</td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {pago.piso}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                        {pago.apartamento}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {formatearMonto(pago.montoUsd)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(pago.fechaPago).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
