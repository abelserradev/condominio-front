# Condominio Platform — Frontend

Frontend Next.js para la plataforma SaaS multi-tenant de gestión de condominios. Soporta múltiples edificios con subdominios dinámicos y autenticación por roles.

## Características principales

- **Multi-tenant por subdominio:** Cada edificio accede por su propio subdominio
- **Roles:** SuperAdmin, Admin de edificio, Propietario/Inquilino
- **Responsive mobile-first:** Diseño optimizado para móvil con escalado a desktop
- **Reporte de pagos:** Formulario con carga de comprobantes y compresión de imágenes
- **Portal de residentes:** Consulta de recibos y reporte de pagos sin login
- **Panel de administración:** Gestión de recibos, pagos y configuración

## Stack tecnológico

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router)
- **UI:** React 19
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Compresión:** browser-image-compression
- **Client-side routing:** next/navigation

## Requisitos

- Node.js 18 o superior
- Backend API corriendo (por defecto en http://localhost:3001)
- pnpm o npm

## Instalación

### Con Docker (recomendado)

```bash
cd frontend/condominio
docker compose up --build
```

La aplicación estará disponible en el puerto **3000**.

### Sin Docker

1. Tener el backend corriendo en http://localhost:3001
2. Crear el archivo `.env.local` (ver sección de variables)
3. Ejecutar:

```bash
cd frontend/condominio
pnpm install
pnpm run dev
```

La aplicación estará en http://localhost:3000

## Variables de entorno

Crear un archivo `.env.local` en `frontend/condominio/`:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL base del backend API | `http://localhost:3001` |

**Opcional:**

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto donde escucha Next.js (en producción/Docker) |

**Importante:** No subir nunca archivos `.env.local` al repositorio.

## Estructura del proyecto

```
frontend/condominio/
├── app/
│   ├── layout.tsx              # Layout raíz con metadata
│   ├── page.tsx                # Home del edificio (subdominio)
│   ├── globals.css             # Estilos globales
│   ├── reportar-pago/          # Formulario reporte de pagos
│   ├── recibos/                # Consulta de recibos
│   ├── reglamentos/            # Reglamentos del edificio
│   ├── avisos/                 # Avisos de la administración
│   ├── admin/
│   │   ├── login/              # Login de administradores
│   │   ├── inicio/             # Dashboard del admin
│   │   ├── recibos/            # Gestión de recibos
│   │   ├── pagos-aceptados/    # Listado de pagos
│   │   └── resumen/            # Resumen del edificio
│   ├── super/                  # Panel SuperAdmin
│   │   ├── login/              # Login SuperAdmin
│   │   ├── edificios/          # Gestión de edificios
│   │   └── avisos-globales/    # Avisos de plataforma
│   └── components/             # Componentes reutilizables
│       ├── header.tsx          # Header con navegación
│       ├── home/               # Componentes de la home
│       ├── recibos/            # Grids de pisos/apartamentos
│       └── super/              # Componentes del panel super
├── lib/
│   └── api.ts                  # Cliente API y tipos
├── public/                     # Archivos estáticos
├── middleware.ts               # Middleware de subdominios
└── README.md                   # Este archivo
```

## Flujos principales

### Acceso por subdominio

- Cada edificio tiene su propio subdominio (ej. `mi-edificio.localhost`)
- El middleware (`middleware.ts`) detecta el subdominio y lo pasa al layout
- El cliente API incluye el slug del edificio en cada request (`x-building-slug`)

### Reporte de pagos (portal público)

1. Residente accede a `/reportar-pago`
2. Selecciona piso/apartamento y meses a pagar
3. El sistema muestra los recibos pendientes
4. Adjunta comprobante (con compresión de imagen en cliente)
5. Indica banco y monto
6. El pago queda en estado "pendiente" hasta aprobación

### Panel de administración

1. Admin accede a `/admin/login`
2. Se autentica con usuario/contraseña
3. Token JWT se guarda en localStorage (`admin_token`)
4. Sidebar con navegación a recibos, pagos, resumen

### SuperAdmin

1. Accede a `/super/login`
2. Token con rol `super_admin` en `super_token`
3. Gestiona edificios, suscripciones y avisos globales

## API Client

El cliente API centralizado en `lib/api.ts` proporciona:

- Funciones por dominio: `fetchBanks`, `fetchTasaBCV`, `postPayment`, etc.
- Manejo de CSRF token para POST requests
- Headers de autenticación (Bearer desde localStorage)
- Tipos TypeScript exportados: `Payment`, `Recibo`, `Apartment`, etc.

## Documentación adicional

- [Memoria del agente — Frontend](../../condominio/memoryFront.md)
- [Plan SaaS Multi-Tenant](../../condominio/saas-multitenant-plan.md)
- [Documentación general](../../.cursor/rules/condominio.mdc)

## Licencia

Proyecto privado. Uso exclusivo para gestión de condominios.