# Despliegue Frontend: Coolify + Cloudflare

Dominio: **buildforge.work**

## Coolify: Dockerfile

1. **+ New** → Dockerfile (o Docker Compose con un servicio)
2. **Source**: Git → este repo
3. **Dockerfile**: raíz del proyecto
4. **Dominios**: `https://buildforge.work`
5. **Variables de entorno** (runtime, obligatorias):

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `API_PROXY_TARGET` | `http://nombre-contenedor-api:3001` | URL **interna** del backend en la red Docker de Coolify. El frontend proxy `/api` → backend por aquí. |
| `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | `buildforge.work` | Dominio raíz para subdominios en `/registro`. |
| `FRONTEND_URL` (backend) | `https://buildforge.work` | Origen permitido en CORS del backend. |

`NEXT_PUBLIC_API_URL` ya **no es necesaria** en el browser: las peticiones van por `/api` (same-origin).

## Conectar frontend con backend en Coolify

1. En el servicio **frontend**, ve a **Network** / **Connect to Predefined Network** y conéctalo a la red del backend.
2. Obtén el hostname interno del contenedor API (nombre del servicio o contenedor en Coolify).
3. Configura `API_PROXY_TARGET=http://<hostname-interno>:3001`.

## Backend (obligatorio para registro)

En el servicio API de Coolify:

- `FRONTEND_URL=https://buildforge.work`
- `PLATFORM_ROOT_DOMAIN=buildforge.work` (URLs de portal tipo `slug.buildforge.work`)

## Problema conocido: api.buildforge.work en bucle 307

Si `https://api.buildforge.work` responde 307 en bucle, las llamadas directas desde el browser fallan por CORS.
La solución es usar el proxy `/api` del frontend con `API_PROXY_TARGET` apuntando al backend **interno**, no a la URL pública.

Para arreglar la URL pública del API, revisa en Coolify/Traefik que no haya reglas HTTPS duplicadas ni redirect al mismo path.
