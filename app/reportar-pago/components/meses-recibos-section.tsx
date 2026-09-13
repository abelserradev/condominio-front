import type { Recibo } from "@/lib/api";
import { MESES_NOMBRES } from "../constants";

type MesesRecibosSectionProps = {
  mesesSeleccionados: number[];
  onToggleMes: (index: number) => void;
  piso: string;
  apartamento: string;
  cargandoRecibos: boolean;
  recibosPendientes: Recibo[];
  recibosSeleccionados: string[];
  onToggleRecibo: (reciboId: string) => void;
  abono: number;
};

export function MesesRecibosSection({
  mesesSeleccionados,
  onToggleMes,
  piso,
  apartamento,
  cargandoRecibos,
  recibosPendientes,
  recibosSeleccionados,
  onToggleRecibo,
  abono,
}: MesesRecibosSectionProps) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-foreground">
        Mes o meses a pagar
      </span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MESES_NOMBRES.map((nombre, i) => (
          <label
            key={nombre}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={mesesSeleccionados.includes(i)}
              onChange={() => onToggleMes(i)}
              className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
            />
            <span className="text-sm text-foreground">{nombre}</span>
          </label>
        ))}
      </div>
      {mesesSeleccionados.length === 0 && (
        <p className="mt-1 text-xs text-secondary">
          Seleccione al menos un mes.
        </p>
      )}
      {cargandoRecibos && piso && apartamento && mesesSeleccionados.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Buscando recibos pendientes...
        </p>
      )}
      {!cargandoRecibos && recibosPendientes.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-primary/10 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {recibosPendientes.length > 1
              ? "Seleccione los recibos a pagar:"
              : "Recibo pendiente a pagar:"}
          </h3>
          <div className="space-y-2">
            {recibosPendientes.map((recibo) => {
              const montoPagado = recibo.montoPagado ?? 0;
              const montoPendiente = recibo.montoUsd - montoPagado;
              const estaSeleccionado = recibosSeleccionados.includes(recibo._id);
              const mostrarCheckbox = recibosPendientes.length > 1;

              return (
                <label
                  key={recibo._id}
                  className={`flex cursor-pointer items-center justify-between rounded border ${
                    estaSeleccionado
                      ? "border-primary bg-primary/20"
                      : "border-border bg-card"
                  } px-3 py-2 transition-colors hover:bg-muted`}
                >
                  <div className="flex flex-1 items-center gap-3">
                    {mostrarCheckbox && (
                      <input
                        type="checkbox"
                        checked={estaSeleccionado}
                        onChange={() => onToggleRecibo(recibo._id)}
                        className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {recibo.tipoDeuda}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recibo.meses
                          .map((m) => MESES_NOMBRES[m - 1])
                          .join(", ")}
                      </p>
                      {montoPagado > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Total: ${recibo.montoUsd.toFixed(2)} · Pagado: $
                          {montoPagado.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-secondary">
                      ${montoPendiente.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                  </div>
                </label>
              );
            })}
          </div>
          {recibosSeleccionados.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {abono > 0 && (
                <p className="text-xs text-secondary">
                  Tienes ${abono.toFixed(2)} de abono que se aplicará a esta deuda.
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {abono > 0
                    ? "Total a pagar (con abono aplicado):"
                    : "Total a pagar:"}
                </p>
                <p className="text-lg font-bold text-secondary">
                  $
                  {Math.max(
                    0,
                    recibosPendientes
                      .filter((r) => recibosSeleccionados.includes(r._id))
                      .reduce((sum, r) => {
                        const pagado = r.montoPagado ?? 0;
                        return sum + (r.montoUsd - pagado);
                      }, 0) - abono,
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          {recibosPendientes.length > 1 && recibosSeleccionados.length === 0 && (
            <p className="mt-2 text-xs text-accent-foreground">
              Seleccione al menos un recibo para continuar.
            </p>
          )}
        </div>
      )}
      {!cargandoRecibos &&
        recibosPendientes.length === 0 &&
        piso &&
        apartamento &&
        mesesSeleccionados.length > 0 && (
          <p className="mt-2 text-xs text-accent-foreground">
            No hay recibos pendientes para los meses seleccionados.
          </p>
        )}
    </div>
  );
}
