# Email Notifications

Esta página documenta el subsistema de notificaciones de email utilizado por el backend de A La Reja. Cubre la función utilitaria `enviarConfirmacionReservacion`, su template HTML, las variables de entorno requeridas, restricciones de verificación de dominio, y el patrón de invocación asíncrona usado para que la entrega de email **nunca bloquee** una respuesta HTTP.

Para el endpoint de reservaciones que dispara esta utilidad, ver [Reservations API](ReservaitonsAPI.md). Para configuración de variables de entorno, ver [Environment Variables & Configuration](EnvironmentVariables&Configuration.md).

---

## Descripción General

El backend envía un único tipo de email transaccional: una confirmación de reservación entregada al usuario inmediatamente después de una reservación exitosa. La entrega de email es manejada por la plataforma **Resend** via su SDK oficial de Node.js.

La utilidad de email está aislada en `backend/utils/email.js` y exporta una función: `enviarConfirmacionReservacion`. El cliente Resend se instancia **una vez al cargar el módulo**, usando la variable de entorno `RESEND_API_KEY`.

> **Patrón de invocación:** El handler POST de reservaciones llama a `enviarConfirmacionReservacion` después de hacer commit a la transacción de base de datos y enviar la respuesta HTTP 201. La llamada es **fire-and-forget** — no se awaita de manera que bloquee la respuesta. Si la entrega de email falla, la falla se registra en consola pero el registro de reservación no se ve afectado.

**Fuentes:** `backend/utils/email.js` #1-12, `backend/package.json` #1-24

---

## `enviarConfirmacionReservacion` Function

**Archivo:** `backend/utils/email.js`

**Firma:**

```javascript
enviarConfirmacionReservacion(email, nombreUsuario, reservacion) → Promise<Object>
```

### Parámetros

| Parámetro                 | Tipo     | Descripción                                              |
| ------------------------- | -------- | -------------------------------------------------------- |
| `email`                   | `string` | Dirección de email del destinatario (email del usuario)  |
| `nombreUsuario`           | `string` | Nombre de display del usuario, interpolado en el body    |
| `reservacion`             | `Object` | Objeto con detalles de la reservación (ver campos abajo) |
| `reservacion.fecha`       | `string` | Fecha de la reservación                                  |
| `reservacion.hora_inicio` | `string` | Hora de inicio                                           |
| `reservacion.hora_fin`    | `string` | Hora de fin                                              |
| `reservacion.cancha`      | `string` | Nombre de la cancha                                      |
| `reservacion.monto`       | `number` | Monto total cargado (decimal)                            |

### Valor de Retorno

La función siempre resuelve (**nunca rechaza**). Retorna una de dos formas:

| Resultado | Return value                                       |
| --------- | -------------------------------------------------- |
| Éxito     | `{ success: true, data: <Resend API result> }`     |
| Falla     | `{ success: false, error: <error message string>}` |

> Este diseño es intencional: los errores se absorben para que una falla de email no pueda propagar ni hacer rollback de una reservación ya committed.

**Fuentes:** `backend/utils/email.js` #20-167

---

## Plantilla de Email

El HTML del email se construye como un template literal inline dentro de `enviarConfirmacionReservacion`. **No usa un archivo de template separado** ni un componente React Email.

**Filas de la tabla de detalles:**

| Fila    | Valor                                            |
| ------- | ------------------------------------------------ |
| Fecha   | `reservacion.fecha`                              |
| Horario | `reservacion.hora_inicio — reservacion.hora_fin` |
| Cancha  | `reservacion.cancha`                             |
| Total   | `montoFormateado` (string de moneda MXN)         |

El campo `monto` se formatea usando `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` antes de la interpolación.

El asunto del email es fijo: **`"Confirmación de tu Reservación - A La Reja"`**.

**Fuentes:** `backend/utils/email.js` #38-124

---

## Variables de Entorno

Dos variables de entorno controlan el envío de emails:

| Variable         | Requerida   | Default          | Descripción                                                                                   |
| ---------------- | ----------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | Sí          | —                | API key emitida por Resend. Debe estar establecida o todos los envíos fallan silenciosamente. |
| `FROM_EMAIL`     | Recomendada | `"onresend.dev"` | Dirección del remitente usada en el campo `from`.                                             |

> **Advertencia:** El valor fallback `"onresend.dev"` **no es una dirección de email válida** y causará fallas de envío. En producción, `FROM_EMAIL` debe establecerse en una dirección cuyo dominio esté verificado en Resend (ej. `reservaciones@yourdomain.com`).

**Fuentes:** `backend/utils/email.js` #12-18

---

## Requisito de Verificación de Dominio

Resend requiere que el dominio en la dirección `from` esté verificado antes de entregar correo a destinatarios arbitrarios.

| Opción                                    | Cuándo usar                                                        |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Dominio personalizado (`@tudominio.com`)  | Verificar via el dashboard de Resend en `resend.com/domains`       |
| Shared domain de Resend (`@onresend.dev`) | Disponible en el free tier; no requiere verificación personalizada |

El error handler en `backend/utils/email.js` #149-162 verifica las cadenas `"domain"`, `"verify"`, y `"not verified"` en el mensaje de error y emite un log de remediación sugerida si alguna coincide.

**Fuentes:** `backend/utils/email.js` #14-17, #148-162

---

## Invocación Asíncrona desde la Ruta de Reservaciones

La función es llamada desde el handler `POST /api/reservaciones`. Se invoca **después de que la transacción de base de datos hace commit** y la respuesta HTTP es enviada. Esto asegura que una entrega lenta o fallida de email no tenga efecto en el resultado de creación de reservación observado por el cliente.

La llamada usa `.catch()` para swallow errores sin afectar la ruta de respuesta HTTP — la reservación ya está committed en este punto, por lo que la falla de email es **no-fatal**.

### Condición para enviar (`backend/routes/reservaciones.js` #186-213):

- `usuarioData.length > 0` — registro de usuario encontrado
- `usuarioData[0].email` — el usuario tiene una dirección de email
- `process.env.RESEND_API_KEY` — la API key está configurada

Si alguna condición falla, el email se omite y se emite un mensaje de log.

**Fuentes:** `backend/utils/email.js` #126-166

---

## Estrategia de Manejo de Errores

El `try/catch` dentro de `enviarConfirmacionReservacion` absorbe todos los errores del SDK Resend. La lógica está declarada explícitamente en `backend/utils/email.js` #163-165:

> _"No lanzamos el error para no afectar la creación de la reservación. El correo es secundario — la reservación ya está creada."_

**Campos de output del log de error:**

| Línea de log                               | Contenido                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `[Email] Error al enviar correo a {email}` | `error.message`                                                               |
| `[Email] Código de error`                  | `error.code` o `"Desconocido"`                                                |
| `[Email] FROM_EMAIL usado`                 | El valor resuelto de `FROM_EMAIL`                                             |
| Aviso de dominio (condicional)             | Emitido cuando el mensaje contiene `"domain"`, `"verify"`, o `"not verified"` |

**Fuentes:** `backend/utils/email.js` #140-166

---

## Dependencia

El paquete npm `resend` (versión `^6.9.2`) es la **única dependencia externa** para funcionalidad de email, listada en `backend/package.json`. Es un consumidor peer-optional de `@react-email/render`; A La Reja **no usa React Email** y pasa strings HTML crudos directamente.

---

## Script de Diagnóstico

Un script de prueba standalone existe en `backend/test-email.js`. Instancia el cliente Resend directamente (no a través del módulo de utilidad) y envía un email de prueba hardcodeado. Está pensado para **verificación manual** de la API key y configuración de dominio durante el setup, no para pruebas automatizadas.

**Ejecutar con:**

```bash
node test-email.js
```

Lee `RESEND_API_KEY` y `FROM_EMAIL` desde `.env` via `dotenv`. La dirección del destinatario hardcodeada en el script es una dirección de desarrollador y debe actualizarse antes de usarlo en otros entornos.
