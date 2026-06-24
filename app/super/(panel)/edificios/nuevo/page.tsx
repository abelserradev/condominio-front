"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearSuperBuilding } from "@/lib/api";

export default function NuevoEdificioPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [totalPisos, setTotalPisos] = useState("10");
  const [apartamentosPorPiso, setApartamentosPorPiso] = useState("8");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [datosContactoPago, setDatosContactoPago] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await crearSuperBuilding({
        slug: slug.trim().toLowerCase(),
        nombre: nombre.trim(),
        totalPisos: Number.parseInt(totalPisos, 10),
        apartamentosPorPiso: Number.parseInt(apartamentosPorPiso, 10),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword,
        datosContactoPago: datosContactoPago.trim() || undefined,
      });
      router.push(`/super/edificios/${created._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear edificio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/super/edificios" className="mb-4 inline-block text-sm text-green-600 hover:underline">
        ← Volver
      </Link>
      <h2 className="mb-6 text-xl font-bold text-slate-800">Nuevo edificio</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="super-nuevo-slug" className="mb-1 block text-sm text-slate-600">
            Slug (subdominio)
          </label>
          <input
            id="super-nuevo-slug"
            required
            pattern="[a-z0-9-]+"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="torre-norte"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="super-nuevo-nombre" className="mb-1 block text-sm text-slate-600">
            Nombre del edificio
          </label>
          <input
            id="super-nuevo-nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="super-nuevo-pisos" className="mb-1 block text-sm text-slate-600">
              Pisos
            </label>
            <input
              id="super-nuevo-pisos"
              type="number"
              min={1}
              required
              value={totalPisos}
              onChange={(e) => setTotalPisos(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="super-nuevo-aptos-piso" className="mb-1 block text-sm text-slate-600">
              Aptos/piso
            </label>
            <input
              id="super-nuevo-aptos-piso"
              type="number"
              min={1}
              required
              value={apartamentosPorPiso}
              onChange={(e) => setApartamentosPorPiso(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label htmlFor="super-nuevo-admin-email" className="mb-1 block text-sm text-slate-600">
            Correo del administrador
          </label>
          <input
            id="super-nuevo-admin-email"
            type="email"
            required
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@edificio.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="super-nuevo-admin-password" className="mb-1 block text-sm text-slate-600">
            Contraseña admin
          </label>
          <input
            id="super-nuevo-admin-password"
            type="password"
            required
            minLength={6}
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="super-nuevo-datos-pago" className="mb-1 block text-sm text-slate-600">
            Instrucciones de pago (opcional)
          </label>
          <textarea
            id="super-nuevo-datos-pago"
            value={datosContactoPago}
            onChange={(e) => setDatosContactoPago(e.target.value)}
            rows={3}
            placeholder="Transferir a cuenta X, enviar comprobante a…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" aria-live="polite">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Creando…" : "Crear edificio"}
        </button>
      </form>
    </div>
  );
}
