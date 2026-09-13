type ReportarPagoUbicacionFieldsProps = Readonly<{
  piso: string;
  apartamento: string;
  pisosDisponibles: number[];
  apartamentosDelPiso: number[];
  cargandoLayout: boolean;
  onPisoChange: (value: string) => void;
  onApartamentoChange: (value: string) => void;
}>;

export function ReportarPagoUbicacionFields({
  piso,
  apartamento,
  pisosDisponibles,
  apartamentosDelPiso,
  cargandoLayout,
  onPisoChange,
  onApartamentoChange,
}: ReportarPagoUbicacionFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="piso" className="mb-1 block text-sm font-medium text-foreground">
          Piso
        </label>
        <select
          id="piso"
          value={piso}
          onChange={(e) => onPisoChange(e.target.value)}
          required
          disabled={cargandoLayout || pisosDisponibles.length === 0}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
        >
          <option value="">{cargandoLayout ? "Cargando pisos…" : "Seleccione"}</option>
          {pisosDisponibles.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="apartamento" className="mb-1 block text-sm font-medium text-foreground">
          Número de apartamento
        </label>
        <select
          id="apartamento"
          value={apartamento}
          onChange={(e) => onApartamentoChange(e.target.value)}
          required
          disabled={!piso || cargandoLayout || apartamentosDelPiso.length === 0}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
        >
          <option value="">{!piso ? "Seleccione un piso primero" : "Seleccione"}</option>
          {apartamentosDelPiso.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
