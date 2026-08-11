"use client";

import { useEffect } from "react";

type PisosGridProps = {
    onSelectPiso: (piso: number) => void;
};

const total_pisos = 30;

export function PisosGrid({ onSelectPiso}: Readonly<PisosGridProps>) {
    useEffect(() => {
      // #region agent log
      fetch('http://127.0.0.1:7770/ingest/8d24192f-e050-43eb-bac5-e21e3ba0ea2e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5c886b'},body:JSON.stringify({sessionId:'5c886b',runId:'pre-fix',hypothesisId:'H1',location:'pisos-grid.tsx:mount',message:'PisosGrid render',data:{hardcodedTotalPisos:total_pisos,hardcodedApartamentosPorPiso:8},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }, []);
    return (
        <div className="grid grid-cols-5 gap-3 sm:gap-4 ">
      {Array.from({ length: total_pisos }, (_, i) => i + 1).map((piso) => (
        <button
          key={piso}
          type="button"
          onClick={() => onSelectPiso(piso)}
          className="flex aspect-square items-center justify-center rounded-xl border-2 border-border bg-muted text-lg font-semibold text-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"        >
          {piso}
        </button>
      ))}
    </div>
    );
}