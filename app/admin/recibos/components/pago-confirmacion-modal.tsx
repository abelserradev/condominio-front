import type { Payment } from "@/lib/api";
import {
  clasesBotonConfirmacion,
  formatearMesesNumeros,
  formatearMonto,
  textoBotonConfirmacion,
} from "../utils/display";

type PagoConfirmacionModalProps = Readonly<{
  pago: Payment;
  accion: "aceptar" | "rechazar";
  procesando: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>;

export function PagoConfirmacionModal({
  pago,
  accion,
  procesando,
  onCancel,
  onConfirm,
}: PagoConfirmacionModalProps) {
  const esAceptar = accion === "aceptar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">
            {esAceptar ? "Confirmar Aceptación" : "Confirmar Rechazo"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            disabled={procesando}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="mb-4 text-slate-700">
            ¿Está seguro que desea {esAceptar ? "aceptar" : "rechazar"} este pago?
          </p>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Detalles del pago:</p>
            <p className="mt-1 text-slate-800">Monto: {formatearMonto(pago.montoUsd)}</p>
            <p className="mt-1 text-slate-800">Mes(es): {formatearMesesNumeros(pago.meses)}</p>
            <p className="mt-1 text-slate-800">Comprobante: {pago.numeroComprobante}</p>
          </div>
          {esAceptar && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">
                ⚠️ Al aceptar, el monto se aplicará a los recibos correspondientes. Si el pago es parcial, se
                actualizará el monto pendiente de los recibos.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={procesando}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={procesando}
            className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors disabled:opacity-50 ${clasesBotonConfirmacion(accion)}`}
          >
            {textoBotonConfirmacion(procesando, accion)}
          </button>
        </div>
      </div>
    </div>
  );
}
