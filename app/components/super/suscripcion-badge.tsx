const ESTADOS: Record<string, string> = {
  trial: "bg-yellow-100 text-yellow-800",
  activo: "bg-green-100 text-green-800",
  vencido: "bg-red-100 text-red-800",
  suspendido: "bg-gray-100 text-gray-800",
};

export function SuscripcionBadge({ estado }: { estado: string }) {
  const cls = ESTADOS[estado] ?? "bg-slate-100 text-slate-700";
  const label = estado.charAt(0).toUpperCase() + estado.slice(1);
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function diasHasta(fechaIso: string): number {
  const fin = new Date(fechaIso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}
