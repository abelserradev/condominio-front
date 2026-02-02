export function NecesitasAyudaCard() {
    return (
      <div className="flex w-full items-start gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-800">¿Necesitas ayuda?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Contacta con la junta de condominio para cualquier consulta que no se encuentre en el portal.
          </p>
        </div>
      </div>
    );
  }