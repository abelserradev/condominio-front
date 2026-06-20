"use client";

type ApartamentosGridProps = {
  onSelectApartamento: (apartamento: number) => void;
};

const total_apartamentos = 8;

export function ApartamentosGrid({ onSelectApartamento }: Readonly<ApartamentosGridProps>) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: total_apartamentos }, (_, i) => i + 1).map(
        (apartamento) => (
          <button
            key={apartamento}
            type="button"
            onClick={() => onSelectApartamento(apartamento)}
            className="flex aspect-square items-center justify-center rounded-xl border-2 border-border bg-muted text-lg font-semibold text-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {apartamento}
          </button>
        )
      )}
    </div>
  );
}