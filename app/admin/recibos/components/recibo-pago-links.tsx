import type { Payment, Recibo } from "@/lib/api";
import {
  formatearFechaUtc,
  formatearMesesNumeros,
  formatearMonto,
  obtenerMontoAbonoPago,
  obtenerPagosRelacionadosRecibo,
  obtenerRecibosRelacionadosPago,
} from "../utils/display";

export function ResumenMontosRecibo({ recibo }: Readonly<{ recibo: Recibo }>) {
  const montoPagado = recibo.montoPagado ?? 0;
  if (montoPagado <= 0) return null;
  return (
    <div className="mt-1">
      <p className="text-sm text-green-700">
        Pagado: {formatearMonto(montoPagado)}
      </p>
      <p className="text-sm text-amber-700">
        Pendiente: {formatearMonto(recibo.montoUsd - montoPagado)}
      </p>
    </div>
  );
}

export function PagosRelacionadosRecibo({
  recibo,
  pagosLista,
}: Readonly<{
  recibo: Recibo;
  pagosLista: Payment[];
}>) {
  const pagosRelacionados = obtenerPagosRelacionadosRecibo(recibo, pagosLista);
  if (pagosRelacionados.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg bg-green-50 p-3">
      <p className="text-xs font-medium text-green-800">Pagado por:</p>
      {pagosRelacionados.map((pago) => (
        <p key={pago._id} className="mt-1 text-sm text-green-700">
          • Pago #{pago.numeroComprobante} -{" "}
          {formatearMonto(obtenerMontoAbonoPago(recibo, pago))} (
          {formatearFechaUtc(pago.fechaPago)})
        </p>
      ))}
    </div>
  );
}

export function RecibosPagadosPorPago({
  pago,
  recibosLista,
}: Readonly<{
  pago: Payment;
  recibosLista: Recibo[];
}>) {
  const recibosRelacionados = obtenerRecibosRelacionadosPago(pago, recibosLista);
  if (recibosRelacionados.length === 0) return null;
  return (
    <div className="mt-4 rounded-lg bg-blue-50 p-3">
      <p className="text-xs font-medium text-blue-800">
        Recibos pagados con este pago:
      </p>
      {recibosRelacionados.map((reciboRelacionado) => (
        <p key={reciboRelacionado._id} className="mt-1 text-sm text-blue-700">
          • {reciboRelacionado.tipoDeuda} -{" "}
          {formatearMesesNumeros(reciboRelacionado.meses)} -{" "}
          {formatearMonto(reciboRelacionado.montoUsd)}
        </p>
      ))}
    </div>
  );
}
