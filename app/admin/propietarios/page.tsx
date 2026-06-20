"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchOwners,
  createOwner,
  updateOwner,
  deactivateOwner,
  fetchApartments,
  type Owner,
  type Apartment,
} from "@/lib/api";

export default function AdminPropietariosPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Owner | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [piso, setPiso] = useState("1");
  const [apartamento, setApartamento] = useState("1");
  const [rol, setRol] = useState<"propietario" | "inquilino">("propietario");
  const [password, setPassword] = useState("");

  function resetForm() {
    setNombre("");
    setEmail("");
    setPiso("1");
    setApartamento("1");
    setRol("propietario");
    setPassword("");
    setEditando(null);
  }

  function abrirCrear() {
    resetForm();
    setModalAbierto(true);
  }

  function abrirEditar(o: Owner) {
    setEditando(o);
    setNombre(o.nombre);
    setEmail(o.email);
    setPiso(String(o.piso));
    setApartamento(String(o.apartamento));
    setRol(o.rol);
    setPassword("");
    setModalAbierto(true);
  }

  async function cargarLista() {
    setCargando(true);
    setError(null);
    try {
      const [list, apts] = await Promise.all([
        fetchOwners(mostrarInactivos),
        fetchApartments(),
      ]);
      setOwners(list);
      setApartments(apts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const rolUser = localStorage.getItem("user_rol");
    if (!token || rolUser !== "admin") {
      router.replace("/admin/login");
      return;
    }
    cargarLista();
  }, [mostrarInactivos, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const pisoNum = parseInt(piso, 10);
      const aptNum = parseInt(apartamento, 10);

      if (editando) {
        const payload: Parameters<typeof updateOwner>[1] = {
          nombre: nombre.trim(),
          email: email.trim(),
          piso: pisoNum,
          apartamento: aptNum,
          rol,
        };
        if (password.trim()) payload.password = password;
        await updateOwner(editando._id, payload);
      } else {
        await createOwner({
          nombre: nombre.trim(),
          email: email.trim(),
          piso: pisoNum,
          apartamento: aptNum,
          rol,
          password,
        });
      }
      setModalAbierto(false);
      resetForm();
      await cargarLista();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setEnviando(false);
    }
  }

  async function handleDesactivar(id: string) {
    if (!confirm("¿Desactivar este propietario? No podrá iniciar sesión.")) return;
    try {
      await deactivateOwner(id);
      await cargarLista();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al desactivar");
    }
  }

  const pisosDisponibles = [...new Set(apartments.map((a) => a.piso))].sort((a, b) => a - b);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Propietarios e inquilinos</h1>
          <p className="text-sm text-slate-600">
            Gestiona quién puede acceder al portal con su correo y contraseña.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + Nuevo propietario
        </button>
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={mostrarInactivos}
          onChange={(e) => setMostrarInactivos(e.target.checked)}
        />
        Mostrar inactivos
      </label>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-slate-500">Cargando…</p>
      ) : owners.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No hay propietarios registrados. Crea el primero para que puedan iniciar sesión.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Apartamento</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((o) => (
                <tr key={o._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{o.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{o.email}</td>
                  <td className="px-4 py-3">{o.idUnico}</td>
                  <td className="px-4 py-3 capitalize">{o.rol}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        o.activo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {o.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(o)}
                        className="text-green-600 hover:underline"
                      >
                        Editar
                      </button>
                      {o.activo && (
                        <button
                          type="button"
                          onClick={() => handleDesactivar(o._id)}
                          className="text-red-600 hover:underline"
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {editando ? "Editar propietario" : "Nuevo propietario"}
            </h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="prop-nombre" className="mb-1 block text-sm text-slate-600">
                  Nombre
                </label>
                <input
                  id="prop-nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="prop-email" className="mb-1 block text-sm text-slate-600">
                  Correo (login)
                </label>
                <input
                  id="prop-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prop-piso" className="mb-1 block text-sm text-slate-600">
                    Piso
                  </label>
                  <select
                    id="prop-piso"
                    value={piso}
                    onChange={(e) => setPiso(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {pisosDisponibles.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prop-apt" className="mb-1 block text-sm text-slate-600">
                    Apartamento
                  </label>
                  <input
                    id="prop-apt"
                    type="number"
                    min={1}
                    required
                    value={apartamento}
                    onChange={(e) => setApartamento(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="prop-rol" className="mb-1 block text-sm text-slate-600">
                  Rol
                </label>
                <select
                  id="prop-rol"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as "propietario" | "inquilino")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="propietario">Propietario</option>
                  <option value="inquilino">Inquilino</option>
                </select>
              </div>
              <div>
                <label htmlFor="prop-pass" className="mb-1 block text-sm text-slate-600">
                  {editando ? "Nueva contraseña (opcional)" : "Contraseña inicial"}
                </label>
                <input
                  id="prop-pass"
                  type="password"
                  required={!editando}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres, mayúscula y número"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
                {!editando && (
                  <p className="mt-1 text-xs text-slate-500">
                    Comparte esta contraseña con el propietario. Pronto se enviará por correo automáticamente.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalAbierto(false);
                  resetForm();
                }}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 rounded-lg bg-green-600 py-2 font-medium text-white disabled:opacity-60"
              >
                {enviando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
