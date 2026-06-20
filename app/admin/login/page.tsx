"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login, type LoginResponse } from "@/lib/api";

const DESTINOS_POR_ROL: Record<string, string> = {
  superadmin: "/super/edificios",
  admin: "/admin/inicio",
  propietario: "/mi-apartamento",
  inquilino: "/mi-apartamento",
};

function guardarSesion(data: LoginResponse): void {
  if (globalThis.window === undefined) return;
  localStorage.setItem("admin_token", data.access_token);
  localStorage.setItem("user_rol", data.rol ?? "admin");
  if (data.edificio) localStorage.setItem("user_edificio", data.edificio);
  if (data.piso != null) localStorage.setItem("user_piso", String(data.piso));
  if (data.apartamento != null) localStorage.setItem("user_apartamento", String(data.apartamento));
  if (data.idUnico) localStorage.setItem("user_id_unico", data.idUnico);
  globalThis.window.dispatchEvent(new Event("adminLogin"));
}

function obtenerMensajeError(err: unknown): string {
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return "Error de conexión. Verifica que el backend esté corriendo en http://localhost:3001";
  }
  return err instanceof Error ? err.message : "Error al iniciar sesión";
}

function redirigirPorRol(router: ReturnType<typeof useRouter>, rol: string | undefined): void {
  router.replace(DESTINOS_POR_ROL[rol ?? "admin"] ?? "/admin/inicio");
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data: LoginResponse = await login(usuario.trim(), contraseña);
      guardarSesion(data);
      redirigirPorRol(router, data.rol);
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <div className="w-[320px] rounded-xl bg-foreground p-7 text-center shadow-xl">
        <Image
          src="/logo_condominio.webp"
          alt="URBIX"
          width={120}
          height={40}
          className="mx-auto mb-5 h-10 w-auto object-contain"
          priority
        />
        <h4 className="mb-5 text-xl font-semibold text-background">
          Iniciar sesión
        </h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-background/10 px-4 py-3">
            <svg
              className="h-5 w-5 shrink-0 fill-accent"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M256 256a112 112 0 1 0 0-224 112 112 0 1 0 0 224zm-48 80c-74.2 0-134.6 60.4-134.6 134.6 0 22.6 18.3 40.9 40.9 40.9h283.4c22.6 0 40.9-18.3 40.9-40.9C438.6 396.4 378.2 336 304 336H208z" />
            </svg>
            <input
              autoComplete="off"
              id="usuario"
              name="usuario"
              type="text"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="w-full border-none bg-transparent text-background/90 outline-none placeholder:text-background/40"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-background/10 px-4 py-3">
            <svg
              className="h-5 w-5 shrink-0 fill-accent"
              viewBox="0 0 576 512"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M80 192V144c0-79.5 64.5-144 144-144s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64v192c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64h16zm144-48c-26.5 0-48 21.5-48 48v48h96V192c0-26.5-21.5-48-48-48z" />
            </svg>
            <input
              autoComplete="off"
              id="contraseña"
              name="contraseña"
              type="password"
              placeholder="Contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
              className="w-full border-none bg-transparent text-background/90 outline-none placeholder:text-background/40"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive-foreground bg-destructive/80 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold uppercase tracking-wide text-accent-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <Link
            href="/"
            className="block text-sm text-background/70 transition-colors hover:text-background"
          >
            Volver al inicio
          </Link>
        </form>
      </div>
    </div>
  );
}
