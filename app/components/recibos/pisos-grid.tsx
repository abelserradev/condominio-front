"use client";

import { useEffect } from "react";

type PisosGridProps = {
  pisos: number[];
  onSelectPiso: (piso: number) => void;
};

export function PisosGrid({ pisos, onSelectPiso }: Readonly<PisosGridProps>) {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7770/ingest/8d24192f-e050-43eb-bac5-e21e3ba0ea2e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5c886b'},body:JSON.stringify({sessionId:'5c886b',runId:'post-fix',hypothesisId:'H1',location:'pisos-grid.tsx:mount',message:'PisosGrid render',data:{pisosCount:pisos.length,pisos},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [pisos]);

  if (pisos.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No hay pisos configurados para este edificio.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-3 sm:gap-4 ">
      {pisos.map((piso) => (
        <button
          key={piso}
          type="button"
          onClick={() => onSelectPiso(piso)}
          className="flex aspect-square items-center justify-center rounded-xl border-2 border-border bg-muted text-lg font-semibold text-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {piso}
        </button>
      ))}
    </div>
  );
}
