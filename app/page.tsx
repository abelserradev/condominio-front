import { Suspense } from "react";
import { IconCard } from "./components/home/icon-card";
import { ReporteOkBanner } from "./components/home/reporte-ok-banner";
import { TasaBcvDelDia } from "./components/home/tasa-bcv-del-dia";
import { NecesitasAyudaCard } from "./components/home/ayuda-card";
import Image from "next/image";

const iconRecibos = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

const iconReportarPago = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M17 9V7a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2" />
    <path d="M13 16h6l-3-3 3-3" />
    <path d="M16 13v6" />
  </svg>
);

const iconReglamentos = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <Suspense fallback={null}>
          <ReporteOkBanner />
        </Suspense>

        <TasaBcvDelDia />

        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-800">Acciones rápidas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <IconCard
              href="/recibos"
              label="Recibos de condominio"
              description="Consulta y descarga tus recibos"
              icon={iconRecibos}
              color="blue"
            />
            <IconCard
              href="/reportar-pago"
              label="Reportar pago"
              description="Sube tu comprobante de pago"
              icon={iconReportarPago}
              color="purple"
            />
            <IconCard
              href="/reglamentos"
              label="Reglamentos"
              description="Normas y reglamentos de la residencia"
              icon={iconReglamentos}
              color="orange"
            />
          </div>
        </section>

        <NecesitasAyudaCard />
      </div>
    </div>
  );
}