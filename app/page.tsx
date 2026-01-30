import { Suspense } from "react";
import { IconCard } from "./components/home/icon-card";
import { ReporteOkBanner } from "./components/home/reporte-ok-banner";
import { TasaBcvDelDia } from "./components/home/tasa-bcv-del-dia";
import Image from "next/image";

const iconRecibos = (
  <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  className="h-8 w-8"
>
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
  <path d="M14 2v6h6" />
  <path d="M16 13H8" />
  <path d="M16 17H8" />
  <path d="M10 9H8" />
</svg>
);

const iconReportarPago = (
  <Image 
  src="/calendario.png"
  alt="Reportar pago"
  width={48}
  height={48}
  className="object-contain"/>
);

const iconReglamentos = (
  <Image
    src="/validacion.png"
    alt="Reglamentos"
    width={48}
    height={48}
    className="object-contain"
  />
);

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-white px-4 py-12">
      <Suspense fallback={null}>
        <ReporteOkBanner />
      </Suspense>
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Primera fila: Recibos | Tasa BCV del día | Reportar pago */}
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          <IconCard
            href="/recibos"
            label="Recibos de condominio"
            icon={iconRecibos}
          />
          <TasaBcvDelDia />
          <IconCard
            href="/reportar-pago"
            label="Reportar pago de condominio"
            icon={iconReportarPago}
          />
        </div>
        {/* Segunda fila: Reglamentos */}
        <div className="w-full max-w-xs">
          <IconCard
            href="/reglamentos"
            label="Reglamentos de la residencia"
            icon={iconReglamentos}
          />
        </div>
      </div>
    </div>
  );
}