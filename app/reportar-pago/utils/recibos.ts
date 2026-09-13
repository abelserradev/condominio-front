import type { Recibo } from "@/lib/api";

export function filterRecibosByMeses(
  recibos: Recibo[],
  mesesSet: Set<number>,
): Recibo[] {
  return recibos.filter((recibo) =>
    recibo.meses.some((mes) => mesesSet.has(mes)),
  );
}
