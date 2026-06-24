"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import {
  deleteReglamento,
  fetchReglamento,
  getFileUrl,
  uploadReglamento,
  type Reglamento,
} from "@/lib/api";

function obtenerTextoBotonSubir(subiendo: boolean, hayReglamento: boolean): string {
  if (subiendo) return "Subiendo…";
  if (hayReglamento) return "Reemplazar reglamento";
  return "Publicar reglamento";
}

function obtenerTextoBotonEliminar(eliminando: boolean): string {
  if (eliminando) return "Eliminando…";
  return "Eliminar reglamento";
}

export default function AdminReglamentosPage() {
  const router = useRouter();
  const [reglamento, setReglamento] = useState<Reglamento | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const rol = localStorage.getItem("user_rol");
    if (rol !== "admin" && rol !== "superadmin") {
      router.replace("/admin/login");
      return;
    }
    fetchReglamento()
      .then(setReglamento)
      .catch(() => setReglamento(null))
      .finally(() => setCargando(false));
  }, [router]);

  async function handleSubir(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!archivo) {
      setError("Selecciona un archivo PDF");
      return;
    }
    if (archivo.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF");
      return;
    }
    setSubiendo(true);
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await uploadReglamento(archivo);
      setReglamento(actualizado);
      setArchivo(null);
      setMensaje("Reglamento publicado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar() {
    if (!confirm("¿Eliminar el reglamento publicado?")) return;
    setEliminando(true);
    setError(null);
    setMensaje(null);
    try {
      await deleteReglamento();
      setReglamento(null);
      setMensaje("Reglamento eliminado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setEliminando(false);
    }
  }

  if (cargando) {
    return <p className="p-6 text-slate-600">Cargando…</p>;
  }

  const textoBotonSubir = obtenerTextoBotonSubir(subiendo, reglamento !== null);
  const textoBotonEliminar = obtenerTextoBotonEliminar(eliminando);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-2 text-2xl font-bold text-slate-800">Reglamento del edificio</h1>
      <p className="mb-6 text-sm text-slate-600">
        Sube el PDF del reglamento de convivencia. Los propietarios lo verán en la sección pública Reglamentos.
      </p>

      {reglamento && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="font-medium text-slate-800">{reglamento.nombre}</p>
          <p className="text-sm text-slate-500">
            Publicado el {new Date(reglamento.actualizadoEn).toLocaleDateString("es-VE")}
          </p>
          <a
            href={getFileUrl(reglamento.fileId)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-green-700 underline"
          >
            Ver PDF actual
          </a>
        </div>
      )}

      <form onSubmit={handleSubir} className="mb-4 max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="admin-reglamento-pdf" className="mb-1 block text-sm text-slate-600">
            Archivo PDF
          </label>
          <input
            id="admin-reglamento-pdf"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={subiendo || !archivo}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {textoBotonSubir}
        </button>
      </form>

      {reglamento && (
        <button
          type="button"
          onClick={handleEliminar}
          disabled={eliminando}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {textoBotonEliminar}
        </button>
      )}

      {mensaje && <p className="mt-4 text-sm text-green-700">{mensaje}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
