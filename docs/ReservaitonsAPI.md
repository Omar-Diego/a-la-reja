# Reservations API

Esta página documenta todos los endpoints HTTP expuestos bajo `/api/reservaciones` y `/api/admin/reservaciones`, el mecanismo de booking seguro ante concurrencia, reglas de control de acceso y el flujo de confirmación de email fire-and-forget. Las implementaciones de rutas viven completamente en `backend/routes/reservaciones.js`. Para el utilitario de email invocado durante el booking, ver `backend/utils/email.js` (documentado en [Email Notifications](EmailNotifications.md)). Para el middleware usado (`auth`, `adminAuth`, `asyncHandler`), ver [Server Setup & Middleware](ServerSetup&Middleware.md).

---

## Resumen de Endpoints

| Método   | Ruta                                      | Auth                       | Descripción                                                                                  |
| -------- | ----------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| `POST`   | `/api/reservaciones`                      | `auth` (cualquier usuario) | Crear una reservación con chequeo de conflictos seguro ante concurrencia                     |
| `GET`    | `/api/reservaciones`                      | `requireAdminIfUnfiltered` | Listar reservaciones; chequeo de disponibilidad pública cuando se proveen `fecha`+`canchaId` |
| `GET`    | `/api/reservaciones/usuario`              | `auth`                     | Obtener todas las reservaciones del usuario autenticado                                      |
| `GET`    | `/api/reservaciones/:idReservacion`       | `auth`                     | Obtener una sola reservación; solo propietario o admin                                       |
| `DELETE` | `/api/reservaciones/:idReservacion`       | `auth`                     | Cancelar una reservación; solo propietario                                                   |
| `PUT`    | `/api/reservaciones/:idReservacion`       | `auth`                     | Actualizar una reservación; solo propietario, re-valida disponibilidad                       |
| `DELETE` | `/api/admin/reservaciones/:idReservacion` | `adminAuth`                | Admin force-delete de cualquier reservación                                                  |

**Fuentes:** `backend/routes/reservaciones.js` #64-626

---

## Control de Acceso

### Middleware `requireAdminIfUnfiltered`

La ruta `GET /api/reservaciones` usa un middleware inline local llamado `requireAdminIfUnfiltered` en lugar de un requisito de auth general.

**Lógica** (`backend/routes/reservaciones.js` #32-37):

- Si tanto `req.query.fecha` como `req.query.canchaId` están presentes → llamar `next()` (acceso no autenticado permitido).
- De lo contrario → delegar a `adminAuth` (se requiere JWT de admin).

Esto permite que las páginas del calendario de booking consulten la disponibilidad de slots sin estar autenticados, mientras sigue restringiendo la lista completa de reservaciones a los admins.

### Aplicación por Propietario

Los endpoints que modifican o recuperan una reservación específica aplican el ownership a nivel de query o via un chequeo explícito:

| Endpoint                 | Mecanismo de aplicación                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `GET /:idReservacion`    | Chequeo post-query: `reservacion.USUARIOS_idUsuario !== req.usuario.idUsuario && req.usuario.role !== "admin"` → 403 |
| `DELETE /:idReservacion` | SQL `WHERE idReservacion = ? AND USUARIOS_idUsuario = ?`; 0 filas afectadas → 404                                    |
| `PUT /:idReservacion`    | Chequeo de ownership por `SELECT` separado antes de validación de disponibilidad y `UPDATE`                          |

El `idUsuario` usado en todas estas comparaciones siempre proviene de `req.usuario.idUsuario` (establecido por el middleware auth del JWT), nunca del body de la petición.

**Fuentes:** `backend/routes/reservaciones.js` #32-37, #380-387, #427-442, #518-529

---

## Detalles de Rutas

### POST `/api/reservaciones` — Crear Reservación

**Campos del request body:**

| Campo         | Tipo     | Validación                                       |
| ------------- | -------- | ------------------------------------------------ |
| `fecha`       | `string` | Requerido; regex `/^\d{4}-\d{2}-\d{2}$/`         |
| `hora_inicio` | `string` | Requerido; regex `/^\d{2}:\d{2}(:\d{2})?$/`      |
| `hora_fin`    | `string` | Requerido; mismo regex; debe ser > `hora_inicio` |
| `idCancha`    | `number` | Requerido                                        |
| `monto`       | `number` | Requerido; debe ser un número positivo           |

`idUsuario` se toma exclusivamente del token JWT — no puede suministrarse en el body.

El control de concurrencia se describe en detalle en su propia sección abajo.

Después de un commit exitoso, el endpoint despacha un email de confirmación y retorna `201` inmediatamente sin esperar a que el email se resuelva.

**Fuentes:** `backend/routes/reservaciones.js` #64-227

---

### GET `/api/reservaciones` — Listar Reservaciones

**Modo filtrado (disponibilidad pública)** — activado cuando ambos parámetros de query `fecha` y `canchaId` están presentes:

Retorna solo `idReservacion`, `hora_inicio`, `hora_fin` para la fecha y cancha dadas, ordenados por `hora_inicio`. Usado por el calendario de booking del frontend para determinar qué slots ya están tomados.

**Modo sin filtro (admin)** — cuando cualquier parámetro de query está ausente:

Retorna la lista completa de reservaciones unida con `USUARIOS` (`LEFT JOIN`, porque `USUARIOS_idUsuario` es nullable) y `CANCHAS`. Los usuarios eliminados aparecen como `'Usuario eliminado'` via `COALESCE`. Ordenados por `fecha DESC`, `hora_inicio DESC`.

**Fuentes:** `backend/routes/reservaciones.js` #244-291

---

### GET `/api/reservaciones/usuario` — Reservaciones del Usuario

Retorna todas las reservaciones para `req.usuario.idUsuario`, unidas con `CANCHAS` para `nombre` y `ubicacion`. Resultados ordenados por `fecha`, `hora_inicio` ascendente. La fecha se formatea con `DATE_FORMAT(r.fecha, '%Y-%m-%d')` para output de string consistente independientemente de la serialización de fechas del driver MySQL.

**Fuentes:** `backend/routes/reservaciones.js` #307-328

---

### GET `/api/reservaciones/:idReservacion` — Reservación Individual

Obtiene detalle completo incluyendo `precio_por_hora` de `CANCHAS`. Después del query, realiza un chequeo de ownership en código: si el usuario autenticado no es ni el propietario ni un admin, retorna `403`. Si la reservación no existe, retorna `404`.

**Fuentes:** `backend/routes/reservaciones.js` #343-391

---

### DELETE `/api/reservaciones/:idReservacion` — Cancelar Reservación (Propietario)

Emite `DELETE FROM RESERVACIONES WHERE idReservacion = ? AND USUARIOS_idUsuario = ?`. Si `affectedRows === 0`, retorna `404` — esto cubre tanto "no encontrado" como "no es el propietario", intencionalmente sin distinguir entre los dos.

**Fuentes:** `backend/routes/reservaciones.js` #408-444

---

### PUT `/api/reservaciones/:idReservacion` — Actualizar Reservación

Aplica las mismas reglas de validación de input que `POST` (formatos de fecha/hora, `hora_fin > hora_inicio`). La secuencia de actualización es:

1. Verificar ownership via `SELECT idReservacion WHERE idReservacion = ? AND USUARIOS_idUsuario = ?`.
2. Chequear reservaciones superpuestas en la nueva combinación `(fecha, idCancha)`, excluyendo la reservación actual (`AND idReservacion != ?`).
3. Si no hay conflictos, ejecutar `UPDATE RESERVACIONES SET fecha, hora_inicio, hora_fin, CANCHAS_idCancha WHERE idReservacion = ? AND USUARIOS_idUsuario = ?`.

> **Nota:** `monto` no se actualiza con este endpoint — solo los campos de programación y asignación de cancha.

**Fuentes:** `backend/routes/reservaciones.js` #466-583

---

### DELETE `/api/admin/reservaciones/:idReservacion` — Admin Force Delete

Protegido por `adminAuth`. Emite un `DELETE FROM RESERVACIONES WHERE idReservacion = ?` directo sin ningún chequeo de ownership. Retorna `404` si la reservación no existe.

**Fuentes:** `backend/routes/reservaciones.js` #598-623

---

## Control de Concurrencia en POST

La sección más crítica de este archivo es la transacción de booking en `POST /api/reservaciones`. El patrón estándar `pool.query()` se reemplaza con una conexión dedicada para habilitar transacciones explícitas y bloqueo a nivel de fila.

**Fuentes:** `backend/routes/reservaciones.js` #119-226

### ¿Por qué `FOR UPDATE`?

Sin `FOR UPDATE`, dos transacciones concurrentes podrían ambas leer cero conflictos, ambas proceder al `INSERT`, y crear un double-booking. La declaración `SELECT ... FOR UPDATE` adquiere un bloqueo a nivel de fila en cualquier fila coincidente. Si ambas transacciones corren simultáneamente sin superposición existente, se serializan en el bloqueo — el `SELECT FOR UPDATE` de la segunda transacción se bloqueará hasta que la primera haga commit o rollback, momento en que la segunda verá la fila recién insertada y retornará un conflicto.

**Condición de superposición usada:**

```sql
hora_inicio < ?  (hora_fin de la nueva reservación)
AND hora_fin > ? (hora_inicio de la nueva reservación)
```

Este es un test de superposición de intervalos estándar: dos intervalos `[A, B)` y `[C, D)` se superponen cuando `A < D AND B > C`.

---

## Confirmación por Email (Fire-and-Forget)

Después del `COMMIT`, la ruta consulta el nombre del usuario y la cancha usando el pool (no la conexión liberada), luego llama a `enviarConfirmacionReservacion` de `backend/utils/email.js`.

La llamada usa `.catch()` para absorber errores sin afectar la respuesta HTTP — la reservación ya está committed en este punto, por lo que el fallo del email es no-fatal.

**Condición para enviar** (`backend/routes/reservaciones.js` #186-213):

- `usuarioData.length > 0` — registro de usuario encontrado
- `usuarioData[0].email` — el usuario tiene una dirección de email
- `process.env.RESEND_API_KEY` — la API key está configurada

Si cualquier condición falla, el email se omite y se emite un mensaje de log.

**Firma de `enviarConfirmacionReservacion`** (`backend/utils/email.js` #33-37):

```javascript
enviarConfirmacionReservacion(email, nombreUsuario, {
  fecha,
  hora_inicio,
  hora_fin,
  cancha,
});
```
