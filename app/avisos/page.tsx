"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAvisos, type Aviso } from "@/lib/api";

const TIPO_LABEL: Record<string, string> = {
  evento: "Evento",
  inconveniente: "Inconveniente",
  aviso_general: "Aviso general",
  comunicado_oficial: "Comunicado oficial",
};

function formatearFecha(fecha: string | undefined): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const año = d.getFullYear();
  return `${dia}/${mes}/${año}`;
}

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetchAvisos()
      .then((lista) => setAvisos(lista.filter((a) => a.estado === "publicado")))
      .catch(() => setAvisos([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl bg-white px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          ← Inicio
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-slate-800">Avisos</h1>
      <p className="mb-8 text-sm text-slate-500">
        Reportes, eventos, inconvenientes y solicitudes de la administración.
      </p>

      {cargando && (
        <p className="py-8 text-center text-slate-500">Cargando avisos…</p>
      )}

      {!cargando && avisos.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <p className="text-slate-600">No hay avisos en este momento.</p>
        </div>
      )}

      {!cargando && avisos.length > 0 && (
        <ul className="space-y-4">
          {avisos.map((aviso) => (
            <li
              key={aviso._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {TIPO_LABEL[aviso.tipo] ?? aviso.tipo}
                </span>
                <span className="text-xs text-slate-400">
                  {formatearFecha(aviso.createdAt)}
                </span>
              </div>
              <h2 className="font-semibold text-slate-800">{aviso.titulo}</h2>
              <p className="mt-1 text-sm text-slate-600">{aviso.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}