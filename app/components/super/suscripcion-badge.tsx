const ESTADOS: Record<string, string> = {
  trial: "bg-accent/20 text-accent-foreground",
  activo: "bg-primary/20 text-foreground",
  vencido: "bg-destructive/10 text-destructive",
  suspendido: "bg-muted text-muted-foreground",
};

export function SuscripcionBadge({ estado }: Readonly<{ estado: string }>) {
  const cls = ESTADOS[estado] ?? "bg-muted text-muted-foreground";
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
