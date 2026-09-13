import type { Payment, Recibo } from "@/lib/api";
import { getComprobanteUrl } from "@/lib/api";
import { RecibosPagadosPorPago } from "./recibo-pago-links";
import {
  formatearFechaUtc,
  formatearMesesNumeros,
  formatearMonto,
  obtenerColorEstado,
  obtenerTextoEstado,
} from "../utils/display";

type PagosReportadosListProps = {
  pagos: Payment[];
  recibos: Recibo[];
  onAceptar: (pago: Payment) => void;
  onRechazar: (pago: Payment) => void;
};

export function PagosReportadosList({
  pagos,
  recibos,
  onAceptar,
  onRechazar,
}: PagosReportadosListProps) {
  if (pagos.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">
        Pagos Reportados por Propietarios
      </h2>
      <div className="space-y-4">
        {pagos.map((pago) => (
          <div
            key={pago._id}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Mes(es): {formatearMesesNumeros(pago.meses)}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Fecha de pago: {formatearFechaUtc(pago.fechaPago)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${obtenerColorEstado(
                  pago.estado,
                )}`}
              >
                {obtenerTextoEstado(pago.estado)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-600">Monto</p>
                <p className="text-lg font-bold text-slate-800">
                  {formatearMonto(pago.montoUsd)}
                </p>
                {pago.montoBs && (
                  <p className="text-sm text-slate-600">
                    {new Intl.NumberFormat("es-VE", {
                      style: "currency",
                      currency: "VES",
                    }).format(pago.montoBs)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Comprobante
                </p>
                <p className="text-slate-800">{pago.numeroComprobante}</p>
                <p className="text-sm text-slate-600">{pago.banco}</p>
              </div>
            </div>

            {pago.comprobanteFileId && (
              <div className="mt-4">
                <a
                  href={getComprobanteUrl(pago.comprobanteFileId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-green-600 hover:text-green-700"
                >
                  Ver comprobante →
                </a>
              </div>
            )}

            {pago.createdAt && (
              <p className="mt-4 text-xs text-slate-500">
                Reportado el:{" "}
                {new Date(pago.createdAt).toLocaleDateString("es-VE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            <RecibosPagadosPorPago pago={pago} recibosLista={recibos} />

            {pago.estado === "pendiente" && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => onAceptar(pago)}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => onRechazar(pago)}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
