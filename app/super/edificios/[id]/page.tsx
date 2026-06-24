"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchSuperBuilding,
  fetchSuperBuildingAdmin,
  renovarSuperBuilding,
  resetSuperBuildingAdmin,
  suspenderSuperBuilding,
  type SuperBuilding,
  type BuildingAdminInfo,
} from "@/lib/api";
import { SuscripcionBadge, diasHasta } from "@/app/components/super/suscripcion-badge";
import { RenovarModal } from "@/app/components/super/renovar-modal";

export default function SuperEdificioDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [edificio, setEdificio] = useState<SuperBuilding | null>(null);
  const [adminInfo, setAdminInfo] = useState<BuildingAdminInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [reseteando, setReseteando] = useState(false);
  const [resetOk, setResetOk] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([
      fetchSuperBuilding(id),
      fetchSuperBuildingAdmin(id).catch(() => null),
    ])
      .then(([building, admin]) => {
        setEdificio(building);
        setAdminInfo(admin);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleSuspender() {
    if (!confirm("¿Suspender este edificio? Los admins no podrán operar hasta renovar.")) return;
    setSuspending(true);
    try {
      await suspenderSuperBuilding(id);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al suspender");
    } finally {
      setSuspending(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (nuevaPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setReseteando(true);
    setResetOk(null);
    setError(null);
    try {
      const res = await resetSuperBuildingAdmin(id, nuevaPassword);
      setResetOk(`Contraseña actualizada para ${res.usuario}`);
      setNuevaPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al restablecer contraseña");
    } finally {
      setReseteando(false);
    }
  }

  if (cargando) return <p className="text-slate-600">Cargando…</p>;
  if (!edificio) return <p className="text-red-600">{error ?? "Edificio no encontrado"}</p>;

  const dias = edificio.suscripcionHasta ? diasHasta(edificio.suscripcionHasta) : null;

  return (
    <div>
      <Link href="/super/edificios" className="mb-4 inline-block text-sm text-green-600 hover:underline">
        ← Volver al listado
      </Link>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{edificio.nombre}</h2>
            <p className="text-slate-600">{edificio.slug}.tuapp.com</p>
          </div>
          <SuscripcionBadge estado={edificio.estadoSuscripcion} />
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Pisos × aptos</dt>
            <dd className="font-medium">{edificio.totalPisos} × {edificio.apartamentosPorPiso}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Suscripción hasta</dt>
            <dd className="font-medium">
              {edificio.suscripcionHasta
                ? new Date(edificio.suscripcionHasta).toLocaleDateString("es-VE")
                : "—"}
              {dias != null && (
                <span className="ml-2 text-slate-500">({dias} días restantes)</span>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Instrucciones de pago (para el admin del edificio)</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">
              {edificio.datosContactoPago || "Sin configurar"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <RenovarModal
            buildingId={id}
            onRenovado={cargar}
            onRenovar={renovarSuperBuilding}
          />
          {edificio.estadoSuscripcion !== "suspendido" && (
            <button
              type="button"
              onClick={handleSuspender}
              disabled={suspending}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {suspending ? "Suspendiendo…" : "Suspender"}
            </button>
          )}
        </div>
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800">Administrador del edificio</h3>
        {adminInfo ? (
          <div className="space-y-4 text-sm">
            <p>
              <span className="text-slate-500">Correo de acceso:</span>{" "}
              <strong>{adminInfo.email ?? adminInfo.usuario}</strong>
            </p>
            <p>
              <span className="text-slate-500">Portal:</span>{" "}
              <a href={adminInfo.portalUrl} className="text-green-700 underline" target="_blank" rel="noreferrer">
                {adminInfo.portalUrl}
              </a>
            </p>
            <form onSubmit={handleResetPassword} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <label htmlFor="super-nueva-password" className="mb-1 block text-slate-600">
                  Nueva contraseña
                </label>
                <input
                  id="super-nueva-password"
                  type="password"
                  minLength={6}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <button
                type="submit"
                disabled={reseteando || nuevaPassword.length < 6}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {reseteando ? "Guardando…" : "Restablecer contraseña"}
              </button>
            </form>
            {resetOk && <p className="text-green-700">{resetOk}</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No se encontró administrador vinculado a este edificio.</p>
        )}
      </section>

      {edificio.historialRenovaciones && edificio.historialRenovaciones.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Historial de renovaciones</h3>
          <ul className="space-y-2 text-sm">
            {edificio.historialRenovaciones.map((h, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium">+{h.diasAgregados} días</span>
                {" · "}
                {new Date(h.fecha).toLocaleDateString("es-VE")}
                {" · "}
                {h.renovadoPor}
                {h.nota && <span className="text-slate-500"> — {h.nota}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
