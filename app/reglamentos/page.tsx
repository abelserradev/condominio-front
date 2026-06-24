"use client";

import { useEffect, useState } from "react";
import { fetchReglamento, getFileUrl, type Reglamento } from "@/lib/api";

export default function ReglamentosPage() {
  const [reglamento, setReglamento] = useState<Reglamento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReglamento()
      .then(setReglamento)
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-slate-600">Cargando reglamento…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-800">Reglamento del condominio</h1>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }

  if (!reglamento) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-800">Reglamento del condominio</h1>
        <p className="mt-4 text-slate-600">
          El administrador aún no ha publicado el reglamento de esta residencia.
        </p>
      </div>
    );
  }

  const pdfUrl = getFileUrl(reglamento.fileId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Reglamento del condominio</h1>
          <p className="mt-1 text-sm text-slate-500">
            {reglamento.nombre} · Actualizado el{" "}
            {new Date(reglamento.actualizadoEn).toLocaleDateString("es-VE")}
          </p>
        </div>
        <a
          href={pdfUrl}
          download={reglamento.nombre}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Descargar PDF
        </a>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <iframe
          src={pdfUrl}
          title={reglamento.nombre}
          className="h-[70vh] w-full min-h-[400px]"
        />
      </div>
    </div>
  );
}
