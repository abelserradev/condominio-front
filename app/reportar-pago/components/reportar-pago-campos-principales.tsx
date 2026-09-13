import type { Bank } from "@/lib/api";
import { INPUT_NUMBER_CLASS } from "../constants";
import { formatFechaParaUsuario } from "../utils/comprobante";

type ReportarPagoCamposPrincipalesProps = Readonly<{
  bancos: Bank[];
  banco: string;
  cargandoBancos: boolean;
  errorBancos: string | null;
  fechaPago: string;
  numeroComprobante: string;
  montoUsd: string;
  montoBs: string;
  tasaBcv: number | null;
  tasaBcvFecha: string | null;
  errorTasaHistorica: string | null;
  onBancoChange: (value: string) => void;
  onFechaPagoChange: (value: string) => void;
  onNumeroComprobanteChange: (value: string) => void;
  onMontoUsdChange: (value: string) => void;
  onMontoBsChange: (value: string) => void;
}>;

export function ReportarPagoCamposPrincipales({
  bancos,
  banco,
  cargandoBancos,
  errorBancos,
  fechaPago,
  numeroComprobante,
  montoUsd,
  montoBs,
  tasaBcv,
  tasaBcvFecha,
  errorTasaHistorica,
  onBancoChange,
  onFechaPagoChange,
  onNumeroComprobanteChange,
  onMontoUsdChange,
  onMontoBsChange,
}: ReportarPagoCamposPrincipalesProps) {
  return (
    <>
      <div>
        <label htmlFor="banco" className="mb-1 block text-sm font-medium text-foreground">
          Banco de envío
        </label>
        <select
          id="banco"
          value={banco}
          onChange={(e) => onBancoChange(e.target.value)}
          required
          disabled={cargandoBancos}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
        >
          <option value="">{cargandoBancos ? "Cargando…" : "Seleccione"}</option>
          {bancos.map((b) => (
            <option key={b._id} value={b.nombre}>
              {b.nombre}
            </option>
          ))}
        </select>
        {errorBancos && <p className="mt-1 text-xs text-destructive">{errorBancos}</p>}
      </div>

      <div>
        <label htmlFor="fechaPago" className="mb-1 block text-sm font-medium text-foreground">
          Fecha de pago
        </label>
        <input
          type="date"
          id="fechaPago"
          value={fechaPago}
          onChange={(e) => onFechaPagoChange(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="numeroComprobante" className="mb-1 block text-sm font-medium text-foreground">
          Número de comprobante
        </label>
        <input
          type="text"
          id="numeroComprobante"
          value={numeroComprobante}
          onChange={(e) => onNumeroComprobanteChange(e.target.value)}
          required
          placeholder="Ej. 123456789"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="montoUsd" className="mb-1 block text-sm font-medium text-foreground">
          Monto cancelado en $
        </label>
        <input
          type="number"
          id="montoUsd"
          value={montoUsd}
          onChange={(e) => onMontoUsdChange(e.target.value)}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
          className={INPUT_NUMBER_CLASS}
        />
      </div>

      <div>
        <label htmlFor="montoBs" className="mb-1 block text-sm font-medium text-foreground">
          Monto cancelado en Bs
        </label>
        <input
          type="number"
          id="montoBs"
          value={montoBs}
          onChange={(e) => onMontoBsChange(e.target.value)}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
          className={INPUT_NUMBER_CLASS}
        />
        {tasaBcv != null && tasaBcv > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {tasaBcvFecha
              ? `Tasa BCV del ${formatFechaParaUsuario(tasaBcvFecha)}: ${tasaBcv.toLocaleString("es-VE")} Bs/USD`
              : `Tasa BCV del día: ${tasaBcv.toLocaleString("es-VE")} Bs/USD`}
          </p>
        )}
        {errorTasaHistorica && (
          <p className="mt-1 text-xs text-accent-foreground">{errorTasaHistorica}</p>
        )}
      </div>
    </>
  );
}
