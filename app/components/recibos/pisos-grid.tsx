"use client";

type PisosGridProps = {
  pisos: number[];
  onSelectPiso: (piso: number) => void;
};

export function PisosGrid({ pisos, onSelectPiso }: Readonly<PisosGridProps>) {
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
