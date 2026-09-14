# Condominio Platform — Frontend

Frontend [Next.js](https://nextjs.org/) para la plataforma SaaS multi-tenant de gestión de condominios. Cada edificio (tenant) se sirve por subdominio; la raíz de la plataforma concentra registro de edificios y panel SuperAdmin.

**Repositorio:** [abelserradev/condominio-front](https://github.com/abelserradev/condominio-front)  
**Backend asociado:** [abelserradev/project-condominio](https://github.com/abelserradev/project-condominio)

## Características principales

- **Multi-tenant por subdominio:** portal del edificio en subdominio dedicado
- **Roles:** SuperAdmin (plataforma), admin de edificio, propietario/inquilino
- **Portal público:** recibos, reporte de pagos, tasa BCV, reglamentos y avisos
- **Panel admin:** recibos, pagos, propietarios, resumen, avisos y reglamentos
- **Mobile-first:** Tailwind CSS 4

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 |
| Gestor de paquetes | pnpm 11.3 (Node 22 en CI) |

## Requisitos

- Node.js **22** (recomendado; mínimo 18)
- [pnpm](https://pnpm.io/)
- API backend disponible en el entorno de desarrollo acordado con el equipo

## Puesta en marcha (desarrollo)

```bash
git clone https://github.com/abelserradev/condominio-front.git
cd condominio-front
pnpm install
pnpm run dev
```

La configuración de entorno (URLs, dominios, despliegue) **no se documenta en este repositorio**. Quien colabora en el proyecto recibe los valores por canal interno.

En local suele usarse `http://localhost:3000` y un subdominio de prueba del edificio (`*.localhost`) según indique el equipo.

## Docker

Existe `Dockerfile` para imagen de producción. Los argumentos de build y variables de runtime se gestionan en el pipeline o panel de despliegue del equipo, no en el README.

## Scripts

| Comando | Uso |
|---------|-----|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` | Build de producción |
| `pnpm run start` | Servir build |
| `pnpm run lint:check` | ESLint (CI) |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run test` | Tests unitarios |
| `pnpm run lib:size` | Guardrail de tamaño del cliente API |

## Estructura del proyecto

```
condominio-front/
├── app/              # Rutas App Router (portal, admin, super)
├── lib/api/          # Cliente HTTP modular
├── middleware.ts     # Enrutamiento por host / tenant
├── DOCUMENTACION.md  # Guía funcional (usuarios y administradores)
└── docs/             # Notas técnicas internas
```

## Flujos (resumen)

- **Portal:** consulta de recibos y reporte de pagos con comprobante; la administración aprueba o rechaza.
- **Admin:** acceso autenticado al panel del edificio.
- **SuperAdmin:** gestión de edificios desde el dominio raíz de la plataforma.

Detalle de pantallas y pasos para usuarios finales: [DOCUMENTACION.md](./DOCUMENTACION.md).

## Calidad y CI

El workflow `.github/workflows/ci.yml` ejecuta lint, typecheck, build y tests en push/PR a `main`, `develop` y ramas `desarrollo/**`.

## Licencia

Proyecto privado. Uso exclusivo para gestión de condominios.
