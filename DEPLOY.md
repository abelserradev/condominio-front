# Despliegue Frontend: Coolify + Cloudflare

Dominio: **buildforge.work**

## Coolify: Dockerfile

1. **+ New** → Dockerfile (o Docker Compose con un servicio)
2. **Source**: Git → este repo
3. **Dockerfile**: raíz del proyecto
4. **Dominios**: `http://buildforge.work:3000`
5. **Variables de entorno** (build y runtime): `NEXT_PUBLIC_API_URL=https://api.buildforge.work`

## Requisitos

- Backend desplegado en `https://api.buildforge.work`
- **Variables de entorno** (configurar en Coolify, NO subir a Git):
  - `NEXT_PUBLIC_API_URL`: URL de la API en producción
