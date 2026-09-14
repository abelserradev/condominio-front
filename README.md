# Condominio Platform — Frontend

Frontend [Next.js](https://nextjs.org/) para la plataforma SaaS multi-tenant de gestión de condominios. Cada edificio (tenant) se sirve por subdominio; la raíz de la plataforma concentra registro de edificios y panel SuperAdmin.

**Repositorio:** [abelserradev/condominio-front](https://github.com/abelserradev/condominio-front)  
**Backend asociado:** [abelserradev/project-condominio](https://github.com/abelserradev/project-condominio)

## Características principales

- **Multi-tenant por subdominio:** portal del edificio en `{slug}.tu-dominio.com` (en local: `{slug}.localhost:3000`)
- **Roles:** SuperAdmin (plataforma), admin de edificio, propietario/inquilino (portal y login de residentes)
- **Portal público:** recibos, reporte de pagos con comprobante, tasa BCV, reglamentos y avisos
- **Panel admin:** recibos, pagos reportados, propietarios, resumen, avisos y reglamentos
- **Proxy `/api`:** el middleware reescribe peticiones al backend en runtime (útil en Docker/Coolify sin rebuild)
- **Mobile-first:** Tailwind CSS 4

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 |
| Imágenes | browser-image-compression |
| Gestor de paquetes | pnpm 11.3 (Node 22 en CI) |

## Requisitos

- Node.js **22** (recomendado; mínimo 18)
- [pnpm](https://pnpm.io/) (`corepack enable` si usas Node oficial)
- API backend en ejecución (por defecto `http://localhost:3001`)

## Puesta en marcha (desarrollo)

```bash
git clone https://github.com/abelserradev/condominio-front.git
cd condominio-front
pnpm install
# Crea .env.local según la tabla de variables (abajo)
pnpm run dev
```

- **Raíz plataforma (SuperAdmin / registro):** [http://localhost:3000](http://localhost:3000)
- **Portal de un edificio en local:** [http://residencia-sofia.localhost:3000](http://residencia-sofia.localhost:3000) (slug configurable con `NEXT_PUBLIC_DEV_BUILDING_SLUG`)

En `localhost:3000` sin subdominio, el middleware asume el slug de desarrollo (`residencia-sofia` por defecto).

## Variables de entorno

Crear `.env.local` en la raíz del repositorio:

| Variable | Descripción | Por defecto / notas |
|----------|-------------|---------------------|
| `NEXT_PUBLIC_API_URL` | URL pública del backend para el navegador | `http://localhost:3001`. Si el cliente usa rutas relativas `/api`, el proxy del middleware puede bastar en server-side |
| `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | Dominio raíz en producción (sin subdominio tenant) | Ej. `buildforge.work`. En CI se usa para validar el build |
| `NEXT_PUBLIC_DEV_BUILDING_SLUG` | Slug del edificio cuando entras por `localhost:3000` | `residencia-sofia` |
| `API_PROXY_TARGET` | URL del backend **solo servidor** (middleware/SSR). Prioridad sobre inferencia por dominio | En Docker: `http://condominio-api:3001` |
| `PORT` | Puerto HTTP en producción | `3000` |

**Producción / Docker:** `NEXT_PUBLIC_*` se inyectan en **build time**; `API_PROXY_TARGET` en **runtime** (ver `Dockerfile`).

No subas `.env.local` al repositorio.

## Docker

```bash
docker build -t condominio-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tu-dominio.com \
  --build-arg NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=tu-dominio.com \
  .

docker run -p 3000:3000 \
  -e API_PROXY_TARGET=http://host.docker.internal:3001 \
  condominio-frontend
```

Ajusta URLs según tu red (Coolify, compose, etc.).

## Scripts

| Comando | Uso |
|---------|-----|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` | Build de producción |
| `pnpm run start` | Servir build |
| `pnpm run lint:check` | ESLint (CI) |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run test` | Jest (unitarios en `lib/api/__tests__`) |
| `pnpm run lib:size` | Guardrail de tamaño del cliente API |

## Estructura del proyecto

```
condominio-front/
├── app/
│   ├── page.tsx                    # Home del tenant
│   ├── registro/                   # Alta self-service de edificio (dominio raíz)
│   ├── reportar-pago/              # Reporte de pagos + hooks/componentes
│   ├── recibos/                    # Consulta de recibos
│   ├── mi-apartamento/             # Portal propietario autenticado
│   ├── reglamentos/ | avisos/
│   ├── admin/                      # login, inicio, recibos, pagos, propietarios, avisos, resumen, reglamentos
│   └── super/                      # login + panel edificios (SuperAdmin)
├── lib/
│   ├── api.ts                      # Reexport del cliente modular
│   ├── api/                        # auth, payments, recibos, portal, super, …
│   └── backend-url.ts              # Resolución de proxy al backend
├── middleware.ts                   # Subdominios, cookies de tenant, proxy /api
├── DOCUMENTACION.md                # Guía funcional (usuarios y admins)
└── docs/                           # Auditorías y evaluaciones de arquitectura
```

## Flujos principales

### Tenant y API

1. El **host** determina si estás en modo plataforma o en un edificio (`middleware.ts`).
2. En modo edificio se envían `x-building-slug` (y cookies) al backend.
3. Las peticiones del navegador pueden ir a `/api/...` y el middleware las reescribe al backend (`getBackendProxyTarget()`).

### Reporte de pago (público)

Residente elige ubicación y meses → adjunta comprobante (compresión en cliente) → pago **pendiente** hasta que admin acepta o rechaza en el panel.

### Administración

Login en `/admin/login` → JWT en `localStorage` (`admin_token`) → rutas bajo `/admin/*` con CSRF en operaciones sensibles (vía `lib/api`).

### SuperAdmin

En el dominio raíz: `/super/login` → token `super_token` → gestión de edificios en `/super/(panel)/edificios`.

## Calidad y CI

El workflow `.github/workflows/ci.yml` ejecuta en push/PR a `main`, `develop` y ramas `desarrollo/**`:

1. `pnpm run lint:check` y `typecheck`
2. `pnpm run build`
3. `pnpm run test` y guardrail `lib:size`

Reproduce localmente antes de abrir PR:

```bash
pnpm run lint:check && pnpm run typecheck && pnpm run build && pnpm run test
```

## Documentación relacionada

- [DOCUMENTACION.md](./DOCUMENTACION.md) — rutas, flujos y guía para usuarios/administradores
- [docs/arch-eval/](./docs/arch-eval/) — ADRs y plan de migración del cliente API
- Backend: README y `specs/` en [project-condominio](https://github.com/abelserradev/project-condominio)

## Licencia

Proyecto privado. Uso exclusivo para gestión de condominios.
