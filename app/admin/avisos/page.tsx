"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchAvisos,
  createAviso,
  updateAviso,
  deleteAviso,
  type Aviso,
  type AvisoPrioridad,
  type AvisoTipo,
} from "@/lib/api";

const PRIORIDAD_LABEL: Record<AvisoPrioridad, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const PRIORIDAD_OPCIONES: AvisoPrioridad[] = ["alta", "media", "baja"];

const TIPO_OPCIONES: AvisoTipo[] = [
  "evento",
  "inconveniente",
  "aviso_general",
  "comunicado_oficial",
];

const TIPO_LABEL: Record<AvisoTipo, string> = {
  evento: "Evento",
  inconveniente: "Inconveniente",
  aviso_general: "Aviso general",
  comunicado_oficial: "Comunicado oficial",
};

function formatearFechaCreada(fecha: string | undefined): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  const opciones: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return `Creada el ${d.toLocaleDateString("es-ES", opciones)}`;
}

function clasesPrioridad(prioridad: AvisoPrioridad): string {
  switch (prioridad) {
    case "alta":
      return "bg-red-100 text-red-800 border-red-200";
    case "media":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "baja":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function AdminAvisosPage() {
  const router = useRouter();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [prioridad, setPrioridad] = useState<AvisoPrioridad>("media");
  const [tipo, setTipo] = useState<AvisoTipo>("aviso_general");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    cargarAvisos();
  }, [router]);

  function cargarAvisos() {
    setCargando(true);
    fetchAvisos()
      .then(setAvisos)
      .catch(() => setAvisos([]))
      .finally(() => setCargando(false));
  }

  function limpiarFormulario() {
    setTitulo("");
    setMensaje("");
    setPrioridad("media");
    setTipo("aviso_general");
    setEditandoId(null);
  }

  function rellenarParaEditar(aviso: Aviso) {
    setTitulo(aviso.titulo);
    setMensaje(aviso.mensaje);
    setPrioridad((aviso.prioridad ?? "media") as AvisoPrioridad);
    setTipo(aviso.tipo);
    setEditandoId(aviso._id);
  }

  function enviarFormulario(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!titulo.trim() || !mensaje.trim()) {
      setError("Título y descripción son obligatorios.");
      return;
    }
    setEnviando(true);
    const payload = { titulo: titulo.trim(), mensaje: mensaje.trim(), prioridad, tipo };
    const promesa = editandoId
      ? updateAviso(editandoId, payload)
      : createAviso({ ...payload, estado: "borrador" });
    promesa
      .then((aviso) => {
        if (editandoId) {
          setAvisos((prev) =>
            prev.map((a) => (a._id === aviso._id ? aviso : a))
          );
        } else {
          setAvisos((prev) => [aviso, ...prev]);
        }
        limpiarFormulario();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al guardar"))
      .finally(() => setEnviando(false));
  }

  function toggleEstado(aviso: Aviso) {
    const nuevoEstado = aviso.estado === "publicado" ? "borrador" : "publicado";
    setEnviando(true);
    updateAviso(aviso._id, { estado: nuevoEstado })
      .then((actualizado) => {
        setAvisos((prev) =>
          prev.map((a) => (a._id === actualizado._id ? actualizado : a))
        );
        if (editandoId === aviso._id) setEditandoId(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al actualizar"))
      .finally(() => setEnviando(false));
  }

  function eliminar(aviso: Aviso) {
    if (!confirm(`¿Eliminar el aviso "${aviso.titulo}"?`)) return;
    setEliminandoId(aviso._id);
    deleteAviso(aviso._id)
      .then(() => {
        setAvisos((prev) => prev.filter((a) => a._id !== aviso._id));
        if (editandoId === aviso._id) limpiarFormulario();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al eliminar"))
      .finally(() => setEliminandoId(null));
  }

  const publicados = avisos.filter((a) => a.estado === "publicado").length;
  const borradores = avisos.filter((a) => a.estado === "borrador").length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-purple-400 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Gestión de Avisos</h1>
              <p className="text-sm text-slate-500">Panel de administración</p>
            </div>
          </div>
          <Link
            href="/admin/inicio"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Nuevo aviso</h2>
            <form onSubmit={enviarFormulario} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-slate-700">
                  Título
                </label>
                <input
                  id="titulo"
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título del aviso"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label htmlFor="mensaje" className="mb-1 block text-sm font-medium text-slate-700">
                  Descripción
                </label>
                <textarea
                  id="mensaje"
                  rows={4}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Descripción detallada del aviso"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label htmlFor="tipo" className="mb-1 block text-sm font-medium text-slate-700">
                  Tipo
                </label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as AvisoTipo)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {TIPO_OPCIONES.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prioridad" className="mb-1 block text-sm font-medium text-slate-700">
                  Prioridad
                </label>
                <select
                  id="prioridad"
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as AvisoPrioridad)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {PRIORIDAD_OPCIONES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORIDAD_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={enviando}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {editandoId ? "Guardar" : "Crear"}
              </button>
              {editandoId && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar edición
                </button>
              )}
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-800">
                Todos los avisos ({avisos.length})
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {publicados} Publicados
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  {borradores} Borradores
                </span>
              </div>
            </div>

            {cargando && (
              <p className="py-8 text-center text-slate-500">Cargando avisos…</p>
            )}

            {!cargando && avisos.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <p className="text-slate-600">No hay avisos. Crea uno desde el formulario.</p>
              </div>
            )}

            {!cargando && avisos.length > 0 && (
              <ul className="space-y-4">
                {avisos.map((aviso) => {
                  const esPublicado = aviso.estado === "publicado";
                  const prioridadAviso = (aviso.prioridad ?? "media") as AvisoPrioridad;
                  return (
                    <li
                      key={aviso._id}
                      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${
                        esPublicado ? "border-l-4 border-l-green-500" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-800">{aviso.titulo}</h3>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${clasesPrioridad(prioridadAviso)}`}
                            >
                              {PRIORIDAD_LABEL[prioridadAviso]}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                esPublicado
                                  ? "bg-slate-700 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {esPublicado ? "Publicado" : "Borrador"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{aviso.mensaje}</p>
                          <p className="mt-2 text-xs text-slate-400">
                            {formatearFechaCreada(aviso.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleEstado(aviso)}
                            disabled={enviando}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            {esPublicado ? "Despublicar" : "Publicar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => rellenarParaEditar(aviso)}
                            className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                            title="Editar"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminar(aviso)}
                            disabled={eliminandoId === aviso._id}
                            className="rounded-lg border border-slate-300 bg-white p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
                            title="Eliminar"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
