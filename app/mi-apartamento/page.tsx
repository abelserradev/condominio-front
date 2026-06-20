"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchRecibos,
  fetchAbono,
  fetchTasaBcv,
  fetchAvisos,
  fetchPaymentsByApartamento,
  changeMyPassword,
  type Recibo,
  type Payment,
  type Aviso,
} from "@/lib/api";
import { useRequireRol, getDatosPropietario } from "@/lib/hooks/useRequireRol";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatearMonto(m: number): string {
  return new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD" }).format(m);
}

export default function MiApartamentoPage() {
  const rol = useRequireRol(["propietario", "inquilino"]);
  const [datos, setDatos] = useState<ReturnType<typeof getDatosPropietario>>(null);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [abono, setAbono] = useState(0);
  const [tasaBcv, setTasaBcv] = useState<number | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarCambioPass, setMostrarCambioPass] = useState(false);
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [passError, setPassError] = useState<string | null>(null);
  const [passOk, setPassOk] = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);

  useEffect(() => {
    const d = getDatosPropietario();
    setDatos(d);
    if (!d) return;

    Promise.all([
      fetchRecibos(d.piso, d.apartamento, "pendiente"),
      fetchPaymentsByApartamento(d.piso, d.apartamento),
      fetchAbono(d.piso, d.apartamento),
      fetchTasaBcv().catch(() => null),
      fetchAvisos(),
    ])
      .then(([recs, pags, ab, tasa, avs]) => {
        setRecibos(recs);
        setPagos(pags);
        setAbono(ab);
        setTasaBcv(tasa?.promedio ?? null);
        setAvisos(avs.slice(0, 3));
      })
      .finally(() => setCargando(false));
  }, []);

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setPassError(null);
    setPassOk(false);
    if (passNueva !== passConfirm) {
      setPassError("Las contraseñas nuevas no coinciden");
      return;
    }
    setCambiandoPass(true);
    try {
      await changeMyPassword(passActual, passNueva);
      setPassOk(true);
      setPassActual("");
      setPassNueva("");
      setPassConfirm("");
    } catch (err) {
      setPassError(err instanceof Error ? err.message : "Error al cambiar contraseña");
    } finally {
      setCambiandoPass(false);
    }
  }

  if (!rol || cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Cargando tu apartamento…</p>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-slate-600">No encontramos los datos de tu apartamento. Inicia sesión de nuevo.</p>
        <Link href="/admin/login" className="mt-4 inline-block text-green-600 underline">
          Ir al login
        </Link>
      </div>
    );
  }

  const saldoPendiente = recibos.reduce(
    (acc, r) => acc + Math.max(0, r.montoUsd - (r.montoPagado ?? 0)),
    0,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <p className="text-sm text-slate-500">{datos.edificio || "Mi edificio"}</p>
        <h1 className="text-2xl font-bold text-slate-800">
          Apartamento {datos.idUnico}
        </h1>
        <p className="text-sm text-slate-600">
          Piso {datos.piso} · Apt {datos.apartamento}
          {rol === "inquilino" && " · Inquilino"}
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Tasa BCV del día</p>
          <p className="text-xl font-semibold text-green-700">
            {tasaBcv != null ? `${tasaBcv.toLocaleString("es-VE")} Bs/USD` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Saldo pendiente</p>
          <p className="text-xl font-semibold text-slate-800">{formatearMonto(saldoPendiente)}</p>
        </div>
        {abono > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 sm:col-span-2">
            <p className="text-sm text-green-800">Abono a tu favor</p>
            <p className="text-xl font-semibold text-green-700">{formatearMonto(abono)}</p>
          </div>
        )}
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recibos pendientes</h2>
          <Link href="/recibos" className="text-sm text-green-600 hover:underline">
            Ver detalle
          </Link>
        </div>
        {recibos.length === 0 ? (
          <p className="text-sm text-slate-500">No tienes recibos pendientes. ¡Al día!</p>
        ) : (
          <ul className="space-y-2">
            {recibos.map((r) => (
              <li key={r._id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>
                  {r.meses.map((m) => MESES[m - 1]).join(", ")} · {r.tipoDeuda}
                </span>
                <span className="font-medium">
                  {formatearMonto(r.montoUsd - (r.montoPagado ?? 0))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pagos.length > 0 && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-800">Mis pagos reportados</h2>
          <ul className="space-y-2">
            {pagos.slice(0, 5).map((p) => (
              <li key={p._id} className="flex justify-between text-sm">
                <span>{p.estado ?? "pendiente"} · {formatearMonto(p.montoUsd)}</span>
                <span className="text-slate-500">
                  {new Date(p.fechaPago).toLocaleDateString("es-VE")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {avisos.length > 0 && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-800">Avisos del edificio</h2>
          <ul className="space-y-2">
            {avisos.map((a) => (
              <li key={a._id} className="text-sm">
                <p className="font-medium text-slate-800">{a.titulo}</p>
                <p className="line-clamp-2 text-slate-600">{a.mensaje}</p>
              </li>
            ))}
          </ul>
          <Link href="/avisos" className="mt-2 inline-block text-sm text-green-600 hover:underline">
            Ver todos
          </Link>
        </section>
      )}

      <Link
        href="/reportar-pago"
        className="mb-6 block w-full rounded-xl bg-green-600 py-3 text-center font-medium text-white hover:bg-green-700"
      >
        Reportar pago
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setMostrarCambioPass((v) => !v)}
          className="flex w-full items-center justify-between text-left font-semibold text-slate-800"
        >
          Cambiar contraseña
          <span className="text-sm font-normal text-slate-500">{mostrarCambioPass ? "▲" : "▼"}</span>
        </button>
        {mostrarCambioPass && (
          <form onSubmit={handleCambiarPassword} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <input
              type="password"
              required
              placeholder="Contraseña actual"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Nueva contraseña"
              value={passNueva}
              onChange={(e) => setPassNueva(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Confirmar nueva contraseña"
              value={passConfirm}
              onChange={(e) => setPassConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {passError && <p className="text-sm text-red-600">{passError}</p>}
            {passOk && <p className="text-sm text-green-600">Contraseña actualizada correctamente.</p>}
            <button
              type="submit"
              disabled={cambiandoPass}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {cambiandoPass ? "Guardando…" : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
