"use client";

import { Apartment, fetchApartments } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AdminSidebarProps = {
  abierto?: boolean;
  onCerrar?: () => void;
};

function groupByPiso(apartamentos: Apartment[]): Map<number, Apartment[]> {
    const map = new Map<number, Apartment[]>();
    for ( const apt of apartamentos) {
        const list = map.get(apt.piso) ?? [];
        list.push(apt);
        map.set(apt.piso, list);
    }
    for (const list of map.values()) {
        list.sort((a, b) => a.numero - b.numero);
    }
    return map;
}

export function AdminSidebar({ abierto = false, onCerrar }: AdminSidebarProps) {
    const router = useRouter();
    const [apartamentos, setApartamentos] = useState<Apartment[]>([]);
    const [cargando, setCargando] = useState(true);
    const [pisoExpandido, setPisoExpandido] = useState<Record<number, boolean>>({});

    useEffect(() => {
        async function cargar() {
            try {
                const list = await fetchApartments();
                const ordenados = list.sort((a, b) => {
                    if (a.piso !== b.piso) return a.piso - b.piso;
                    return a.numero - b.numero;
                });
                setApartamentos(ordenados);
            } catch {
                setApartamentos([]);
            } finally {
                setCargando(false);
            }
        }
        cargar();
    }, []);

    const porPiso = groupByPiso(apartamentos);
    const pisosOrdenados = Array.from(porPiso.keys()).sort((a, b) => a - b);

    function togglePiso(piso: number) {
        setPisoExpandido((prev) => ({ ...prev, [piso]: !prev[piso] }));
      }
    
    function irARecibos(piso: number, apartamento: number) {
      router.push(`/admin/recibos?piso=${piso}&apartamento=${apartamento}`);
      onCerrar?.();
    }

    function irAResumen() {
      router.push("/admin/resumen");
      onCerrar?.();
    }

    function irAAvisos() {
      router.push("/admin/avisos");
      onCerrar?.();
    }

    const asideClasses = `fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-64 flex-col bg-slate-900 text-white shadow-xl transition-transform duration-300 ease-in-out
      max-md:z-50 max-md:top-16
      ${abierto ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`;

    return (
      <>
        {abierto && (
          <div
            role="button"
            tabIndex={0}
            onClick={onCerrar}
            onKeyDown={(e) => e.key === "Escape" && onCerrar?.()}
            className="fixed inset-0 top-16 z-40 bg-black/50 md:hidden"
            aria-label="Cerrar menú"
          />
        )}
      <aside className={asideClasses}>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-700 p-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Navegación
            </span>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
              aria-label="Cerrar menú"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
            <div className="flex-1 overflow-y-auto p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pisos
              </p>
              {cargando ? (
                <p className="py-2 text-sm text-slate-400">Cargando...</p>
              ) : (
                <ul className="space-y-0.5">
                  {pisosOrdenados.map((piso) => {
                    const expandido = pisoExpandido[piso] ?? false;
                    const apts = porPiso.get(piso) ?? [];
                    return (
                      <li key={piso}>
                        <button
                          type="button"
                          onClick={() => togglePiso(piso)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-800"
                        >
                          <span className="font-medium">Piso {piso}</span>
                          <svg
                            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expandido ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {expandido && (
                          <ul className="ml-3 space-y-0.5 border-l border-slate-700 pl-2">
                            {apts.map((apt) => (
                              <li key={apt._id}>
                                <button
                                  type="button"
                                  onClick={() => irARecibos(apt.piso, apt.numero)}
                                  className="block w-full rounded px-2 py-1.5 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                                >
                                  Apartamento {apt.numero}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-4 border-t border-slate-700 pt-3 space-y-0.5">
                <button
                  type="button"
                  onClick={irAAvisos}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Avisos
                </button>
                <button
                  type="button"
                  onClick={irAResumen}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Resumen
                </button>
              </div>
            </div>
          </div>
        </aside>
      </>
      );
}
