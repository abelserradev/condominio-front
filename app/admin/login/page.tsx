"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function AdminLoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = `${getBaseUrl()}/auth/login`;
    console.log('[Login] POST', url, { usuario: usuario.trim(), tieneContraseña: !!contraseña });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), contraseña }),
      });
      console.log('[Login] response', res.status, res.statusText, res.ok);
      if (!res.ok) {
        const text = await res.text();
        console.log('[Login] error body', text);
        let msg = "Error al iniciar sesión";
        try {
          const j = JSON.parse(text) as { message?: string };
          if (j?.message) msg = j.message;
        } catch (_) {}
        throw new Error(msg);
      }
      const data = (await res.json()) as { access_token: string };
      console.log('[Login] ok, guardando token');
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_token", data.access_token);
        window.dispatchEvent(new Event("adminLogin"));
      }
      router.replace("/admin/inicio");
    } catch (err) {
      console.error('[Login] catch', err);
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-12">
      <div
        className="w-[320px] rounded-lg p-6 text-center"
        style={{ background: "#2a2b38" }}
      >
        <h4 className="mb-4 text-2xl font-medium" style={{ color: "#f5f5f5" }}>
          Iniciar sesión
        </h4>
        <form onSubmit={handleSubmit}>
          <div
            className="mb-3 flex items-center gap-2 rounded px-4 py-3"
            style={{ backgroundColor: "#1f2029" }}
          >
            <svg
              className="h-5 w-5 shrink-0"
              style={{ fill: "#ffeba7" }}
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
              className="w-full border-none bg-transparent outline-none"
              style={{ color: "#d3d3d3" }}
            />
          </div>
          <div
            className="mb-4 flex items-center gap-2 rounded px-4 py-3"
            style={{ backgroundColor: "#1f2029" }}
          >
            <svg
              className="h-5 w-5 shrink-0"
              style={{ fill: "#ffeba7" }}
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
              className="w-full border-none bg-transparent outline-none"
              style={{ color: "#d3d3d3" }}
            />
          </div>
          {error && (
            <p className="mb-3 text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mb-2 w-full rounded py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "#ffeba7",
              color: "#5e6681",
              boxShadow: "0 8px 24px 0 rgb(255 235 167 / 20%)",
            }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <Link
            href="/"
            className="block text-sm transition-colors duration-300 hover:opacity-90"
            style={{ color: "#f5f5f5" }}
          >
            Volver al inicio
          </Link>
        </form>
      </div>
    </div>
  );
}