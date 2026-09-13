import type { Payment, Recibo } from "@/lib/api";

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatearMonto(monto: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
  }).format(monto);
}

export function obtenerColorEstado(estado?: string): string {
  switch (estado) {
    case "aceptado":
      return "bg-green-100 text-green-800";
    case "rechazado":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

export function obtenerTextoEstado(estado?: string): string {
  switch (estado) {
    case "aceptado":
      return "Aceptado";
    case "rechazado":
      return "Rechazado";
    default:
      return "Pendiente";
  }
}

export function compararPorCreatedAtDesc<T extends { createdAt?: string }>(
  a: T,
  b: T,
): number {
  const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return fechaB - fechaA;
}

export function formatearMesesNumeros(meses: number[]): string {
  return meses.map((m) => MESES[m - 1]).join(", ");
}

export function formatearFechaUtc(fecha: string | Date): string {
  if (!fecha) return "N/A";
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;
  const año = date.getUTCFullYear();
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const día = String(date.getUTCDate()).padStart(2, "0");
  return `${día}/${mes}/${año}`;
}

export function obtenerPagosRelacionadosRecibo(
  recibo: Recibo,
  pagosLista: Payment[],
): Payment[] {
  return pagosLista.filter(
    (p) => p.recibosPagados?.includes(recibo._id) && p.estado === "aceptado",
  );
}

export function obtenerMontoAbonoPago(recibo: Recibo, pago: Payment): number {
  const abono = recibo.abonos?.find((a) => a.paymentId === pago._id);
  return abono?.monto ?? pago.montoUsd;
}

export function obtenerRecibosRelacionadosPago(
  pago: Payment,
  recibosLista: Recibo[],
): Recibo[] {
  if (!pago.recibosPagados?.length) return [];
  return recibosLista.filter((r) => pago.recibosPagados?.includes(r._id));
}

export function textoBotonConfirmacion(
  procesando: boolean,
  accion: "aceptar" | "rechazar" | null,
): string {
  if (procesando) return "Procesando...";
  if (accion === "aceptar") return "Aceptar";
  return "Rechazar";
}

export function clasesBotonConfirmacion(
  accion: "aceptar" | "rechazar" | null,
): string {
  if (accion === "aceptar") return "bg-green-600 hover:bg-green-700";
  return "bg-red-600 hover:bg-red-700";
}
