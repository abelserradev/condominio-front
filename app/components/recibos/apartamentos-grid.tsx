"use client";

type ApartamentosGridProps = {
  apartamentos: number[];
  onSelectApartamento: (apartamento: number) => void;
};

export function ApartamentosGrid({
  apartamentos,
  onSelectApartamento,
}: Readonly<ApartamentosGridProps>) {
  if (apartamentos.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No hay apartamentos en este piso.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {apartamentos.map((apartamento) => (
        <button
          key={apartamento}
          type="button"
          onClick={() => onSelectApartamento(apartamento)}
          className="flex aspect-square items-center justify-center rounded-xl border-2 border-border bg-muted text-lg font-semibold text-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {apartamento}
        </button>
      ))}
    </div>
  );
}
