"use client";

import { useState } from "react";

type Props = {
  buildingId: string;
  onRenovado: () => void;
  onRenovar: (id: string, dias: number, nota: string) => Promise<void>;
};

export function RenovarModal({ buildingId, onRenovado, onRenovar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState("365");
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onRenovar(buildingId, parseInt(dias, 10), nota);
      setAbierto(false);
      onRenovado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al renovar");
    } finally {
      setLoading(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Renovar suscripción
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Renovar suscripción</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Días a agregar</label>
            <select
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="30">30 días (1 mes)</option>
              <option value="90">90 días (3 meses)</option>
              <option value="180">180 días (6 meses)</option>
              <option value="365">365 días (1 año)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Nota (opcional)</label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Pago recibido por transferencia…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="flex-1 rounded-lg border border-slate-300 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Guardando…" : "Confirmar renovación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
