# Documentación — Frontend Condominio Residencia Sofia

Sistema web para propietarios y administración del condominio. Esta documentación está pensada para **usuarios finales**, **administradores** y **desarrolladores**.

---

## 1. ¿Qué es el frontend?

El **frontend** es la parte visible del sistema: la página web que los propietarios y la administración usan en el navegador. Permite:

- **Propietarios:** Ver recibos, reportar pagos, consultar la tasa BCV, leer reglamentos y avisos.
- **Administración:** Iniciar sesión, gestionar recibos, aceptar o rechazar pagos, ver resumen y avisos.

Todo funciona en el navegador (Chrome, Firefox, Safari, Edge) sin instalar nada.

---

## 2. Guía de uso (para usuarios y administradores)

### 2.1 Páginas para propietarios (acceso público)

| Página | Ruta | Descripción |
|--------|------|-------------|
| **Inicio** | `/` | Página principal con enlaces a Recibos, Tasa BCV, Reportar pago, Reglamentos y Avisos. |
| **Recibos** | `/recibos` | Consulta de recibos pendientes por piso y apartamento. Se elige el piso y luego el apartamento para ver el detalle. |
| **Reportar pago** | `/reportar-pago` | Formulario para reportar un pago: piso, apartamento, meses, banco, monto y comprobante (imagen o PDF). El pago queda pendiente hasta que la administración lo acepte. |
| **Tasa BCV** | En inicio | Muestra la tasa de cambio del día (Banco Central de Venezuela). Útil para conversiones USD/BS al reportar pagos. |
| **Reglamentos** | `/reglamentos` | Contenido estático con las normas del condominio. |
| **Avisos** | `/avisos` | Avisos publicados por la administración para los residentes. |

### 2.2 Páginas para administración (requieren login)

| Página | Ruta | Descripción |
|--------|------|-------------|
| **Iniciar sesión** | `/admin/login` | Acceso con usuario y contraseña. Solo administradores. |
| **Inicio admin** | `/admin/inicio` | Panel principal de administración. |
| **Recibos** | `/admin/recibos` | Crear recibos (facturas) por piso, apartamento y meses. Listar y gestionar recibos existentes. |
| **Pagos aceptados** | `/admin/pagos-aceptados` | Listado de pagos que ya fueron aceptados. |
| **Resumen** | `/admin/resumen` | Vista resumida del estado del condominio. |
| **Avisos** | `/admin/avisos` | Crear, editar y eliminar avisos para los residentes. |

### 2.3 Flujo típico: reportar un pago

1. El propietario entra en **Reportar pago**.
2. Selecciona **piso** y **apartamento**.
3. Elige los **meses** que está pagando.
4. Indica **banco** y **monto**.
5. Adjunta el **comprobante** (foto o PDF del depósito/transferencia).
6. Envía el formulario.
7. El pago queda en estado **pendiente**.
8. La administración entra en el panel, revisa el pago y lo **acepta** o **rechaza**.

---

## 3. Requisitos para ejecutar (para técnicos)

- **Node.js** 18 o superior.
- **npm** o **pnpm**.
- El **backend** debe estar corriendo (puerto 3001) y accesible.

---

## 4. Cómo poner en marcha el frontend

### 4.1 Instalación

```bash
cd frontend/condominio
npm install
```

### 4.2 Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### 4.3 Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL del backend (API). Si está vacía, se usa el proxy `/api` hacia `localhost:3001`. | `http://localhost:3001` |

**Ejemplo para acceso desde otro dispositivo en la red:**

- `NEXT_PUBLIC_API_URL=http://192.168.1.100:3001`

---

## 5. Estructura del proyecto (para desarrolladores)

```
frontend/condominio/
├── app/
│   ├── layout.tsx          # Layout principal (header, metadata)
│   ├── page.tsx             # Página de inicio
│   ├── reportar-pago/       # Formulario reportar pago
│   ├── recibos/             # Consulta recibos por piso/apartamento
│   ├── reglamentos/         # Reglamentos estáticos
│   ├── avisos/              # Avisos públicos
│   ├── admin/               # Panel administración
│   │   ├── login/
│   │   ├── inicio/
│   │   ├── recibos/
│   │   ├── pagos-aceptados/
│   │   ├── resumen/
│   │   └── avisos/
│   └── components/          # Componentes compartidos
├── lib/
│   └── api.ts               # Cliente API (fetch, login, CSRF, etc.)
└── DOCUMENTACION.md         # Este archivo
```

### 5.1 Tecnologías utilizadas

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**

### 5.2 Autenticación

- El token de administrador se guarda en `localStorage` con la clave `admin_token`.
- El header escucha los eventos `adminLogin` y `adminLogout` para actualizar el botón de sesión.
- Las peticiones autenticadas envían el token en el header `Authorization: Bearer <token>`.

### 5.3 API cliente (`lib/api.ts`)

- Funciones por dominio: `banks`, `tasa-bcv`, `payments`, `recibos`, `apartments`, `login`, `files`, `avisos`.
- CSRF: se obtiene el token con `obtenerCsrfToken()` y se envía en login y al crear pagos.
- Tipos exportados: `Bank`, `TasaBcv`, `Payment`, `Recibo`, `Abono`, `Apartment`, etc.

---

## 6. Preguntas frecuentes

**¿Por qué no veo mis recibos?**  
Comprueba que hayas elegido correctamente el piso y el apartamento. Los recibos solo se muestran si existen y tienen saldo pendiente.

**¿Qué formato debe tener el comprobante?**  
Imagen (JPG, PNG) o PDF. Tamaño máximo recomendado: 5 MB. Las imágenes se comprimen automáticamente antes de enviar.

**¿Cómo accedo al panel de administración?**  
Entra en **Iniciar sesión** (en el header) y usa las credenciales de administrador que te hayan proporcionado.

**¿Puedo usar el sistema desde el móvil?**  
Sí. La interfaz es responsive. Si accedes desde otro dispositivo en la misma red, puede ser necesario configurar `NEXT_PUBLIC_API_URL` y `FRONTEND_URL` en el backend (ver DOCKER.md en la raíz del proyecto).

---

## 7. Más información

- **Levantar todo el proyecto:** Ver `DOCKER.md` en la raíz del proyecto.
- **Backend:** Ver `backend/condomini/DOCUMENTACION.md`.
- **Despliegue:** Ver `backend/condomini/DEPLOY.md` si aplica.
