import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Gestión Financiera",
    desc: "Emite recibos por apartamento, recibe comprobantes y aprueba pagos con trazabilidad completa.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    title: "Comunicación",
    desc: "Publica avisos, notificaciones y comunicados a todos los residentes desde un panel central.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Multi-Edificio",
    desc: "Cada residencia tiene su espacio aislado. Tus datos nunca se mezclan con otros condominios.",
  },
];

export function PlatformLanding() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      {/* Hero oscuro */}
      <section className="bg-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-20 text-center sm:px-6 sm:py-28">
          <Image
            src="/logo_condominio.webp"
            alt="URBIX"
            width={200}
            height={80}
            className="h-16 w-auto object-contain sm:h-20"
            priority
          />

          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              El sistema operativo de tu comunidad
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-background sm:text-5xl lg:text-6xl">
              URBIX
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-background/70 sm:text-lg">
              La plataforma de gestión integrada que conecta copropietarios, administración y
              seguridad en un ecosistema digital inteligente para 2026.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/registro"
              className="rounded-xl bg-secondary px-8 py-3 text-base font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/90"
            >
              Solicitar demo
            </Link>
            <Link
              href="/admin/login"
              className="rounded-xl border border-background/20 bg-background/10 px-8 py-3 text-base font-medium text-background transition hover:bg-background/20"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-16 sm:grid-cols-3 sm:px-6 sm:py-20">
        {features.map((f) => (
          <article
            key={f.title}
            className="rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-secondary">
              {f.icon}
            </div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">
              {f.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
