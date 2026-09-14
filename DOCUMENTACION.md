# Documentación — Frontend Condominio

Guía para **propietarios**, **administración del edificio** y **colaboradores** del producto. Describe pantallas y flujos de uso, no la configuración técnica del despliegue (esa información es interna).

---

## 1. ¿Qué es el frontend?

Es la aplicación web que se abre en el navegador. Permite:

- **Propietarios / residentes:** consultar recibos, reportar pagos, ver la tasa BCV, leer reglamentos y avisos.
- **Administración del edificio:** iniciar sesión, gestionar recibos, revisar pagos, resumen y avisos.

No hace falta instalar software; basta un navegador actualizado.

---

## 2. Guía de uso

### 2.1 Portal del edificio (acceso público)

| Página | Ruta | Descripción |
|--------|------|-------------|
| **Inicio** | `/` | Enlaces a recibos, tasa BCV, reportar pago, reglamentos y avisos. |
| **Recibos** | `/recibos` | Recibos pendientes por piso y apartamento. Si hay abono a favor, se muestra y reduce el total a pagar. |
| **Reportar pago** | `/reportar-pago` | Formulario: ubicación, meses, banco, monto y comprobante. Pagos en exceso pueden quedar como abono. |
| **Reglamentos** | `/reglamentos` | Normas del condominio. |
| **Avisos** | `/avisos` | Comunicados de la administración. |

### 2.2 Panel de administración (requiere login)

| Página | Ruta | Descripción |
|--------|------|-------------|
| **Iniciar sesión** | `/admin/login` | Acceso con credenciales de administrador. |
| **Inicio** | `/admin/inicio` | Panel principal. |
| **Recibos** | `/admin/recibos` | Crear y gestionar recibos; revisar pagos reportados. |
| **Pagos aceptados** | `/admin/pagos-aceptados` | Historial de pagos confirmados. |
| **Resumen** | `/admin/resumen` | Vista resumida del edificio. |
| **Avisos** | `/admin/avisos` | Publicar y editar avisos. |
| **Propietarios** | `/admin/propietarios` | Gestión de propietarios (según permisos del edificio). |

### 2.3 Flujo: reportar un pago

1. Entrar en **Reportar pago**.
2. Elegir **piso** y **apartamento** y los **meses** a pagar.
3. Indicar **banco** y **monto** y adjuntar **comprobante** (imagen o PDF).
4. Enviar el formulario → el pago queda **pendiente**.
5. La administración lo **acepta** o **rechaza** desde el panel.

---

## 3. Colaboradores técnicos (resumen)

- Repositorio: [condominio-front](https://github.com/abelserradev/condominio-front).
- Arranque habitual: `pnpm install` y `pnpm run dev` (ver [README.md](./README.md)).
- **Configuración de entornos, URLs, dominios y despliegue:** solo por canal interno del equipo; no se documenta en este repositorio.

---

## 4. Preguntas frecuentes

**¿Por qué no veo recibos?**  
Comprueba piso y apartamento. Solo aparecen recibos con saldo pendiente.

**¿Qué formato de comprobante?**  
Imagen (JPG, PNG) o PDF. Tamaño razonable para subida desde móvil; las imágenes pueden comprimirse en el navegador.

**¿Cómo entro al panel de administración?**  
Usa **Iniciar sesión** en el portal de tu edificio con las credenciales que te dio la administración.

**¿Funciona en el móvil?**  
Sí, la interfaz es responsive. Si algo no carga, contacta a la administración o al soporte del servicio (no es un ajuste que el usuario final deba hacer en el navegador).

---

## 5. Más información

- Visión técnica breve: [README.md](./README.md).
- Backend asociado: [project-condominio](https://github.com/abelserradev/project-condominio).
