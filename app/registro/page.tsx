"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { checkBuildingSlug, registerBuilding, type RegisterBuildingResult } from "@/lib/api";

type SlugEstado = "idle" | "checking" | "ok" | "taken" | "reserved" | "invalid" | "network";

function esDominioPublico(host: string): boolean {
  if (!host || host === "localhost" || host === "127.0.0.1") return false;
  if (!host.includes(".")) return false;
  if (/^[0-9a-f]{8,}$/i.test(host)) return false;
  return true;
}

export default function RegistroPage() {
  const [paso, setPaso] = useState(1);
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [totalPisos, setTotalPisos] = useState("10");
  const [apartamentosPorPiso, setApartamentosPorPiso] = useState("8");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [slugEstado, setSlugEstado] = useState<SlugEstado>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RegisterBuildingResult | null>(null);
  const [dominioPlataforma, setDominioPlataforma] = useState(
    process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? "buildforge.work",
  );

  const slugNorm = slug.trim().toLowerCase();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN) return;
    const host = globalThis.window.location.hostname.replace(/^www\./, "");
    if (esDominioPublico(host)) {
      setDominioPlataforma(host);
    }
  }, []);

  const verificarSlug = useCallback(async (value: string) => {
    const s = value.trim().toLowerCase();
    if (s.length < 3) {
      setSlugEstado("invalid");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(s)) {
      setSlugEstado("invalid");
      return;
    }
    setSlugEstado("checking");
    try {
      const res = await checkBuildingSlug(s);
      if (res.disponible) {
        setSlugEstado("ok");
      } else {
        setSlugEstado(res.motivo === "reservado" ? "reserved" : "taken");
      }
    } catch {
      setSlugEstado("network");
    }
  }, []);

  useEffect(() => {
    if (!slugNorm) {
      setSlugEstado("idle");
      return;
    }
    const t = setTimeout(() => verificarSlug(slugNorm), 400);
    return () => clearTimeout(t);
  }, [slugNorm, verificarSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slugEstado !== "ok") return;
    setLoading(true);
    setError(null);
    try {
      const res = await registerBuilding({
        slug: slugNorm,
        nombre: nombre.trim(),
        direccion: direccion.trim() || undefined,
        totalPisos: Number.parseInt(totalPisos, 10),
        apartamentosPorPiso: Number.parseInt(apartamentosPorPiso, 10),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword,
      });
      setResultado(res);
      setPaso(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  }

  if (paso === 3 && resultado) {
    const trialFecha = new Date(resultado.trialHasta).toLocaleDateString("es-VE");
    const loginUrl = `${resultado.portalUrl}/admin/login`;
    const correoAdmin = resultado.adminEmail ?? adminEmail.trim().toLowerCase();
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="mb-2 text-xl font-bold text-slate-800">¡Edificio registrado!</h1>
          <p className="mb-4 text-sm text-slate-600">
            <strong>{resultado.nombre}</strong> tiene 14 días de prueba hasta el {trialFecha}.
          </p>
          <div className="mb-6 rounded-lg bg-white p-4 text-left text-sm text-slate-700">
            <p className="mb-2 font-medium text-slate-800">Acceso al panel admin</p>
            <p>
              <span className="text-slate-500">Correo:</span>{" "}
              <strong>{correoAdmin}</strong>
            </p>
            <p className="mt-1 text-slate-500">
              Usa la contraseña que definiste en el paso anterior. Guárdala en un lugar seguro.
            </p>
            {correoAdmin && (
              <p className="mt-2 text-xs text-slate-500">
                Te enviamos un correo de bienvenida a {correoAdmin} si el servicio de email está configurado.
              </p>
            )}
          </div>
          <p className="mb-2 text-sm text-slate-500">Tu portal:</p>
          <a
            href={resultado.portalUrl}
            className="mb-4 block break-all text-green-700 underline"
          >
            {resultado.portalUrl}
          </a>
          <a
            href={loginUrl}
            className="inline-block rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white hover:bg-green-700"
          >
            Ir a iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Link href="/" className="mb-6 inline-block text-sm text-green-600 hover:underline">
        ← Volver al inicio
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-slate-800">Registrar edificio</h1>
      <p className="mb-8 text-sm text-slate-600">
        Paso {paso} de 2 — prueba gratuita de 14 días, sin pago inicial.
      </p>

      <form
        onSubmit={(e) => {
          if (paso === 1) {
            e.preventDefault();
            if (slugEstado === "ok" && nombre.trim().length >= 3) setPaso(2);
            return;
          }
          handleSubmit(e);
        }}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {paso === 1 && (
          <>
            <div>
              <label htmlFor="registro-slug" className="mb-1 block text-sm font-medium text-slate-700">
                Subdominio del portal
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="registro-slug"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="torre-norte"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
                />
                <span className="shrink-0 text-sm text-slate-400">.{dominioPlataforma}</span>
              </div>
              {slugEstado === "checking" && (
                <p className="mt-1 text-xs text-slate-500">Verificando…</p>
              )}
              {slugEstado === "ok" && (
                <p className="mt-1 text-xs text-green-600">Disponible</p>
              )}
              {slugEstado === "taken" && (
                <p className="mt-1 text-xs text-red-600">Ya está en uso</p>
              )}
              {slugEstado === "reserved" && (
                <p className="mt-1 text-xs text-red-600">Nombre reservado</p>
              )}
              {slugEstado === "invalid" && slugNorm.length > 0 && (
                <p className="mt-1 text-xs text-red-600">Solo minúsculas, números y guiones</p>
              )}
              {slugEstado === "network" && (
                <p className="mt-1 text-xs text-red-600">No se pudo verificar disponibilidad. Intenta de nuevo.</p>
              )}
            </div>
            <div>
              <label htmlFor="registro-nombre" className="mb-1 block text-sm font-medium text-slate-700">
                Nombre del edificio
              </label>
              <input
                id="registro-nombre"
                required
                minLength={3}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Residencia Las Palmas"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="registro-direccion" className="mb-1 block text-sm font-medium text-slate-700">
                Dirección (opcional)
              </label>
              <input
                id="registro-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="registro-total-pisos" className="mb-1 block text-sm text-slate-600">Pisos</label>
                <input
                  id="registro-total-pisos"
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={totalPisos}
                  onChange={(e) => setTotalPisos(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="registro-apartamentos-piso" className="mb-1 block text-sm text-slate-600">Aptos/piso</label>
                <input
                  id="registro-apartamentos-piso"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={apartamentosPorPiso}
                  onChange={(e) => setApartamentosPorPiso(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={slugEstado !== "ok" || nombre.trim().length < 3}
              className="w-full rounded-lg bg-green-600 py-2.5 font-medium text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </>
        )}

        {paso === 2 && (
          <>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Portal: <strong>{slugNorm}.{dominioPlataforma}</strong> — {nombre}
            </p>
            <div>
              <label htmlFor="registro-admin-email" className="mb-1 block text-sm font-medium text-slate-700">
                Correo del administrador
              </label>
              <input
                id="registro-admin-email"
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@mi-edificio.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-500">
                Con este correo iniciarás sesión en el panel del edificio.
              </p>
            </div>
            <div>
              <label htmlFor="registro-admin-password" className="mb-1 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                id="registro-admin-password"
                type="password"
                required
                minLength={6}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-slate-700"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 py-2.5 font-medium text-white disabled:opacity-60"
              >
                {loading ? "Creando…" : "Crear edificio"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
