import Link from "next/link";

/**
 * Página 404 personalizada. Next.js la renderiza automáticamente para rutas inexistentes.
 * Contenido estático: no se usa el path de la URL en el DOM, evitando riesgos de inyección.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Icono principal: círculo morado con exclamación */}
        <div className="relative mx-auto mb-6 flex w-20 justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-violet-200 to-violet-400">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-violet-700">
              !
            </span>
          </div>
          {/* Badge de alerta en esquina superior derecha */}
          <span
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
            aria-hidden
          >
            !
          </span>
        </div>

        <h1 className="text-center text-4xl font-bold text-slate-800">404</h1>
        <h2 className="mt-2 text-center text-lg font-semibold text-slate-800">
          Página no encontrada
        </h2>
        <p className="mt-3 text-center text-sm text-slate-600">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
