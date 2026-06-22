# Despliegue Frontend: Coolify + Cloudflare

Dominio: **buildforge.work**

## Error `ECONNREFUSED` al proxy `/api`

Si en los logs del frontend ves:

```
Failed to proxy http://api:3001/... ECONNREFUSED
```

El frontend **no está en la misma red Docker** que el stack del API. El hostname `api` solo existe dentro del compose del backend.

### Solución A — Conectar redes en Coolify (app frontend separada)

1. Abre el stack **backend** (compose) en Coolify → anota el nombre del **proyecto/recurso** (ej. `wso48084wggc80oc4gk0wwcc`).
2. Abre **`condominio-front`** → **Configuration** → **Advanced** (o **Network**).
3. **Connect to Predefined Network** → selecciona la red del compose del backend.
4. Mantén `API_PROXY_TARGET=http://api:3001` (o prueba `http://condominio-api:3001`).
5. **Redeploy** el frontend.

### Solución B — Workaround vía IP del host (rápido)

Si el API publica el puerto `3001` en el servidor (tu compose tiene `3001:3001`), usa la IP del servidor Coolify:

```
API_PROXY_TARGET=http://192.168.0.168:3001
```

(Sustituye por la IP real de tu servidor donde corre Coolify.)

En Linux Docker también suele funcionar:

```
API_PROXY_TARGET=http://172.17.0.1:3001
```

Redeploy del frontend tras cambiar la variable.

### Solución C — Frontend en el mismo compose (recomendado a largo plazo)

`docker-compose.prod.yml` incluye el servicio `frontend` en la misma red que `api`.
Despliega **un solo** recurso Docker Compose en Coolify en lugar de dos apps separadas.

---

## Variables de entorno

### Frontend (`condominio-front` o servicio `frontend` del compose)

| Variable | Valor |
|----------|--------|
| `API_PROXY_TARGET` | `http://api:3001` (misma red) **o** `http://IP-SERVIDOR:3001` (workaround) |
| `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | `buildforge.work` |

Dominio en Coolify: `https://buildforge.work`

### Backend (compose / API)

| Variable | Valor |
|----------|--------|
| `FRONTEND_URL` | `https://buildforge.work` |
| `PLATFORM_ROOT_DOMAIN` | `buildforge.work` |

No uses URLs con ID de contenedor (`1766ef8cebb0`, `02dcbbffa1e6`) en `FRONTEND_URL`.

---

## Comprobar que funciona

```
GET https://buildforge.work/api/buildings/check-slug/hola
→ 200 {"disponible":true}
```
