import type { PortalInfo } from "@/lib/api";

type Props = {
  info: PortalInfo;
};

export function PortalSuscripcionBloqueada({ info }: Props) {
  const esSuspendido = info.motivoBloqueo === "suspendido";
  const titulo = esSuspendido
    ? "Suscripción suspendida"
    : "Suscripción vencida";
  const descripcion = esSuspendido
    ? "El acceso a este portal fue suspendido. Contacta al administrador de la plataforma URBIX para reactivar el servicio."
    : "La suscripción de este edificio ha vencido. Contacta al administrador de la plataforma URBIX para renovar el plan.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">{titulo}</h1>
        <p className="mb-1 text-sm font-medium text-secondary">{info.nombre}</p>
        <p className="mb-6 text-sm text-muted-foreground">{descripcion}</p>
        {info.datosContactoPago && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-left text-sm text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Instrucciones de pago</p>
            <p className="whitespace-pre-wrap">{info.datosContactoPago}</p>
          </div>
        )}
      </div>
    </div>
  );
}
