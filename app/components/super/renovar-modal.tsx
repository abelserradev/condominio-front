"use client";

import { useState, type SubmitEvent } from "react";

type Props = {
  buildingId: string;
  onRenovado: () => void;
  onRenovar: (id: string, dias: number, nota: string) => Promise<unknown>;
};

export function RenovarModal({ buildingId, onRenovado, onRenovar }: Readonly<Props>) {
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState("365");
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onRenovar(buildingId, Number.parseInt(dias, 10), nota);
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
        className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
      >
        Renovar suscripción
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Renovar suscripción</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="dias" className="mb-1 block text-sm text-muted-foreground">Días a agregar</label>
            <select
              id="dias"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 bg-background text-foreground"
            >
              <option value="30">30 días (1 mes)</option>
              <option value="90">90 días (3 meses)</option>
              <option value="180">180 días (6 meses)</option>
              <option value="365">365 días (1 año)</option>
            </select>
          </div>
          <div>
            <label htmlFor="nota" className="mb-1 block text-sm text-muted-foreground">Nota (opcional)</label>
            <input
              id="nota"
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Pago recibido por transferencia…"
              className="w-full rounded-lg border border-border px-3 py-2 bg-background text-foreground"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="flex-1 rounded-lg border border-border py-2 text-sm text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-secondary py-2 text-sm font-medium text-secondary-foreground disabled:opacity-60"
            >
              {loading ? "Guardando…" : "Confirmar renovación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
