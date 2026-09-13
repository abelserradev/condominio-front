import { MESES } from "../utils/display";

type CargarReciboModalProps = Readonly<{
  piso: string;
  apartamento: string;
  tipoDeuda: string;
  mesDeuda: string;
  montoUsd: string;
  fechaReportada: string;
  archivoFactura: File | null;
  enviando: boolean;
  comprimiendo: boolean;
  errorFormulario: string | null;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  onTipoDeudaChange: (value: string) => void;
  onMesDeudaChange: (value: string) => void;
  onMontoUsdChange: (value: string) => void;
  onFechaReportadaChange: (value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}>;

/** Modal de alta de recibo: UI separada para mantener page.tsx bajo el límite ADR-F002 */
export function CargarReciboModal({
  piso,
  apartamento,
  tipoDeuda,
  mesDeuda,
  montoUsd,
  fechaReportada,
  archivoFactura,
  enviando,
  comprimiendo,
  errorFormulario,
  onClose,
  onSubmit,
  onTipoDeudaChange,
  onMesDeudaChange,
  onMontoUsdChange,
  onFechaReportadaChange,
  onFileChange,
}: CargarReciboModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="flex h-full max-h-[95vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl sm:h-auto">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-lg font-bold text-slate-800 sm:text-2xl">Cargar Recibo</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            {errorFormulario && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{errorFormulario}</div>
            )}

            <div className="space-y-4">
              <div>
                <p className="mb-2 block text-sm font-medium text-slate-700">Apartamento</p>
                <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:px-4 sm:text-base">
                  P{piso}-A{apartamento}
                </div>
              </div>

              <div>
                <label htmlFor="tipo-deuda" className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo de deuda
                </label>
                <select
                  id="tipo-deuda"
                  value={tipoDeuda}
                  onChange={(e) => onTipoDeudaChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-base"
                  required
                >
                  <option value="">Seleccione el tipo de deuda</option>
                  <option value="Factura">Recibo del condominio</option>
                  <option value="Deuda acumulada">Pago especial (reparaciones, ascensor, etc.)</option>
                </select>
              </div>

              <div>
                <label htmlFor="mes-deuda" className="mb-2 block text-sm font-medium text-slate-700">
                  Mes de la deuda
                </label>
                <select
                  id="mes-deuda"
                  value={mesDeuda}
                  onChange={(e) => onMesDeudaChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-base"
                  required
                >
                  <option value="">Seleccione un mes</option>
                  {MESES.map((mes) => (
                    <option key={mes} value={mes}>
                      {mes}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="monto-usd" className="mb-2 block text-sm font-medium text-slate-700">
                  Monto en dólares
                </label>
                <input
                  id="monto-usd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoUsd}
                  onChange={(e) => onMontoUsdChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-base"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label htmlFor="fecha-reportada" className="mb-2 block text-sm font-medium text-slate-700">
                  Fecha reportada de la deuda
                </label>
                <input
                  id="fecha-reportada"
                  type="date"
                  value={fechaReportada}
                  onChange={(e) => onFechaReportadaChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-base"
                  required
                />
              </div>

              <div>
                <p className="mb-2 block text-sm font-medium text-slate-700">Factura</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <label
                    htmlFor="factura-archivo"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:px-4 sm:text-sm"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Cargar factura
                    <input
                      id="factura-archivo"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={onFileChange}
                      className="hidden"
                      required
                      disabled={comprimiendo}
                    />
                  </label>
                  {comprimiendo && (
                    <span className="text-xs text-amber-600 sm:text-sm">Comprimiendo imagen...</span>
                  )}
                  {archivoFactura && !comprimiendo && (
                    <span className="wrap-break-word text-xs text-slate-600 sm:text-sm">
                      {archivoFactura.name} ({(archivoFactura.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:px-4 sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-base"
              >
                {enviando ? "Cargando..." : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
