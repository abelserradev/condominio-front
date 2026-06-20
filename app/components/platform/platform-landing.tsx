import Link from "next/link";

const features = [
  {
    title: "Recibos y pagos",
    desc: "Emite recibos por apartamento, recibe comprobantes y aprueba pagos desde un solo panel.",
  },
  {
    title: "Portal de residentes",
    desc: "Cada propietario consulta su deuda, reporta pagos y ve avisos sin llamar a la administración.",
  },
  {
    title: "Multi-edificio",
    desc: "Cada residencia tiene su subdominio aislado. Tus datos no se mezclan con otros condominios.",
  },
];

export function PlatformLanding() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-green-700">
          Gestión de condominios
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Administra tu edificio sin hojas de cálculo
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
          Recibos, pagos reportados, avisos y portal para propietarios. Prueba gratis 14 días
          y activa tu portal en minutos.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/registro"
            className="rounded-xl bg-green-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            Registrar mi edificio
          </Link>
          <Link
            href="/admin/login"
            className="rounded-xl border border-slate-300 bg-white px-8 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-4 pb-20 sm:grid-cols-3 sm:px-6">
        {features.map((f) => (
          <article
            key={f.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-2 font-semibold text-slate-800">{f.title}</h2>
            <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
