"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSuperBuildings, type SuperBuilding } from "@/lib/api";
import { SuscripcionBadge, diasHasta } from "@/app/components/super/suscripcion-badge";

export default function SuperEdificiosPage() {
  const [edificios, setEdificios] = useState<SuperBuilding[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuperBuildings()
      .then(setEdificios)
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="text-slate-600">Cargando edificios…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Edificios registrados</h2>
        <Link
          href="/super/edificios/nuevo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Nuevo edificio
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Vence</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {edificios.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No hay edificios. Crea el primero.
                </td>
              </tr>
            ) : (
              edificios.map((e) => (
                <tr key={e._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{e.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{e.slug}</td>
                  <td className="px-4 py-3">
                    <SuscripcionBadge estado={e.estadoSuscripcion} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {e.suscripcionHasta
                      ? `${diasHasta(e.suscripcionHasta)} días`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/super/edificios/${e._id}`}
                      className="text-green-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
