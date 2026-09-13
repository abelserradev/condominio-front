import {
  getApiBaseUrl,
  getBuildingSlugTenant,
} from "./http-session";

const getBaseUrl = getApiBaseUrl;

export async function obtenerCsrfToken(): Promise<string> {
  const res = await fetch(`${getBaseUrl()}/csrf/token`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("No se pudo obtener el token CSRF");
  const data = (await res.json()) as { csrfToken: string };
  if (!data?.csrfToken) throw new Error("Token CSRF vacío");
  return data.csrfToken;
}

export type LoginResponse = {
  access_token: string;
  rol: string;
  edificio?: string;
  buildingId?: string;
  piso?: number;
  apartamento?: number;
  idUnico?: string;
};

async function ejecutarLogin(
  usuario: string,
  contraseña: string,
  headersExtra: HeadersInit,
): Promise<LoginResponse> {
  const csrfToken = await obtenerCsrfToken();
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
      ...headersExtra,
    },
    body: JSON.stringify({ usuario: usuario.trim(), contraseña }),
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Credenciales inválidas");
    }
    const text = await res.text();
    let msg = "Error al iniciar sesión";
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  return res.json() as Promise<LoginResponse>;
}

export async function loginPlataforma(
  usuario: string,
  contraseña: string,
): Promise<LoginResponse> {
  return ejecutarLogin(usuario, contraseña, {
    "x-platform-mode": "true",
  });
}

export async function loginEdificio(
  usuario: string,
  contraseña: string,
): Promise<LoginResponse> {
  return ejecutarLogin(usuario, contraseña, {
    "x-building-slug": getBuildingSlugTenant(),
  });
}

/** @deprecated Preferir loginEdificio o loginPlataforma según el portal. */
export async function login(
  usuario: string,
  contraseña: string,
): Promise<LoginResponse> {
  return loginEdificio(usuario, contraseña);
}
