"use client";

type ApartamentosGridProps = {
  onSelectApartamento: (apartamento: number) => void;
};

const total_apartamentos = 8;

export function ApartamentosGrid({ onSelectApartamento }: ApartamentosGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: total_apartamentos }, (_, i) => i + 1).map(
        (apartamento) => (
          <button
            key={apartamento}
            type="button"
            onClick={() => onSelectApartamento(apartamento)}
            className="flex aspect-square items-center justify-center rounded-xl border-2 border-green-200 bg-green-50 text-lg font-semibold text-amber-600 shadow-sm transition-all hover:border-green-400 hover:bg-green-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-white"
          >
            {apartamento}
          </button>
        )
      )}
    </div>
  );
}