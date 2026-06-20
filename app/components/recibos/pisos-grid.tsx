"use client";

type PisosGridProps = {
    onSelectPiso: (piso: number) => void;
};

const total_pisos = 30;

export function PisosGrid({ onSelectPiso}: Readonly<PisosGridProps>) {
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