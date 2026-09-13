import type { Payment, Recibo } from "@/lib/api";
import { getComprobanteUrl } from "@/lib/api";
import {
  PagosRelacionadosRecibo,
  ResumenMontosRecibo,
} from "./recibo-pago-links";
import { formatearFechaUtc, formatearMesesNumeros, formatearMonto } from "../utils/display";

type RecibosCondominioListProps = {
  recibos: Recibo[];
  pagos: Payment[];
};

export function RecibosCondominioList({
  recibos,
  pagos,
}: RecibosCondominioListProps) {
  if (recibos.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">
        Recibos del Condominio
      </h2>
      <div className="space-y-4">
        {recibos.map((recibo) => (
          <div
            key={recibo._id}
            className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Mes(es): {formatearMesesNumeros(recibo.meses)}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Tipo: {recibo.tipoDeuda}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Fecha reportada: {formatearFechaUtc(recibo.fechaReportada)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  recibo.estado === "pagado"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {recibo.estado === "pagado" ? "Pagado" : "Pendiente"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-slate-800">
                  Total: {formatearMonto(recibo.montoUsd)}
                </p>
                <ResumenMontosRecibo recibo={recibo} />
              </div>
              {recibo.facturaFileId && (
                <a
                  href={getComprobanteUrl(recibo.facturaFileId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Ver factura
                </a>
              )}
            </div>
            <PagosRelacionadosRecibo recibo={recibo} pagosLista={pagos} />
          </div>
        ))}
      </div>
    </div>
  );
}
