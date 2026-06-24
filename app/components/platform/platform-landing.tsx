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
    desc: "Emite recibos por apartamento, registra comprobantes y aprueba pagos con trazabilidad completa.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    title: "Comunicación Directa",
    desc: "Publica avisos y notificaciones a todos los residentes desde un panel central en tiempo real.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Multi-Edificio",
    desc: "Cada residencia en su propio espacio aislado. Tus datos nunca se mezclan con otros condominios.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Tasa BCV al Día",
    desc: "Muestra automáticamente la tasa del BCV para facilitar conversiones y gestión en bolívares.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Comprobantes Digitales",
    desc: "Los residentes adjuntan fotos del comprobante. La administración los revisa desde el panel.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Panel de Resumen",
    desc: "Visualiza el estado de pagos, deudas pendientes y aceptados en un dashboard limpio.",
  },
];

const stats = [
  { valor: "14 días", etiqueta: "Prueba gratuita" },
  { valor: "100%", etiqueta: "Sin tarjeta requerida" },
  { valor: "24/7", etiqueta: "Acceso online" },
];

export function PlatformLanding() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-foreground">
        {/* Destellos de fondo */}
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/15 blur-[120px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 h-[360px] w-[360px] rounded-full bg-secondary/10 blur-[100px]"
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:py-24">

          {/* Texto izquierda */}
          <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-secondary">
              Plataforma SaaS · 2026
            </span>

            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-background sm:text-5xl lg:text-6xl">
              El sistema operativo{" "}
              <span className="text-secondary">de tu comunidad</span>
            </h1>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-background/65 sm:text-lg">
              Conecta copropietarios, administración y pagos en un único
              ecosistema digital. Gestión transparente, sin papeles, desde
              cualquier dispositivo.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="rounded-xl bg-secondary px-8 py-3.5 text-base font-semibold text-secondary-foreground shadow-lg shadow-secondary/20 transition hover:bg-secondary/90 hover:shadow-secondary/30"
              >
                Comenzar gratis →
              </Link>
              <Link
                href="/super/login"
                className="rounded-xl border border-background/20 bg-background/10 px-8 py-3.5 text-base font-medium text-background/90 transition hover:bg-background/20"
              >
                Ya tengo cuenta
              </Link>
            </div>

            {/* Mini stats */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 lg:justify-start">
              {stats.map((s) => (
                <div key={s.etiqueta} className="flex flex-col items-center lg:items-start">
                  <span className="text-2xl font-bold text-secondary">{s.valor}</span>
                  <span className="text-xs text-background/50">{s.etiqueta}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Imagen derecha */}
          <div className="relative flex flex-1 items-center justify-center">
            {/* Glow exterior */}
            <div
              className="absolute inset-0 -z-10 scale-105 rounded-3xl bg-primary/15 blur-3xl"
              aria-hidden
            />
            {/* Anillo decorativo */}
            <div className="absolute inset-0 rounded-3xl border border-background/10" aria-hidden />

            <Image
              src="/Comple.png"
              alt="URBIX — Portal de gestión de condominio"
              width={670}
              height={469}
              priority
              quality={95}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 55vw, 520px"
              className="relative h-auto w-full max-w-[480px] rounded-3xl shadow-2xl shadow-black/40 ring-1 ring-background/10 lg:max-w-[520px]"
            />

            {/* Badge flotante — pagos */}
            <div className="absolute -bottom-3 -left-3 flex items-center gap-2 rounded-xl border border-border/50 bg-card/90 px-4 py-2.5 shadow-lg backdrop-blur-sm sm:-bottom-4 sm:-left-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20">
                <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-foreground">Pago aprobado</p>
                <p className="text-[10px] text-muted-foreground">Apto 4-B · hace 2 min</p>
              </div>
            </div>

            {/* Badge flotante — aviso */}
            <div className="absolute -right-3 -top-3 flex items-center gap-2 rounded-xl border border-border/50 bg-card/90 px-4 py-2.5 shadow-lg backdrop-blur-sm sm:-right-6 sm:-top-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-foreground">Nuevo aviso</p>
                <p className="text-[10px] text-muted-foreground">Corte de agua · 10am</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Características ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
            Todo lo que necesita tu edificio
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Desde el cobro de condominio hasta los avisos comunitarios, en una
            sola plataforma.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-secondary transition-colors group-hover:bg-primary/25">
                {f.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-foreground">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────── */}
      <section className="mx-4 mb-12 overflow-hidden rounded-3xl bg-foreground sm:mx-6">
        <div className="relative px-6 py-14 text-center sm:px-10 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_80%,rgba(106,197,246,0.12),transparent_70%)]"
            aria-hidden
          />
          <h2 className="mb-3 text-2xl font-bold text-background sm:text-3xl">
            ¿Listo para digitalizar tu edificio?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-background/60 sm:text-base">
            14 días de prueba sin costo. Sin tarjeta de crédito. Cancela
            cuando quieras.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-8 py-3.5 text-base font-semibold text-secondary-foreground shadow-lg shadow-secondary/20 transition hover:bg-secondary/90"
          >
            Crear mi edificio gratis
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

    </div>
  );
}
