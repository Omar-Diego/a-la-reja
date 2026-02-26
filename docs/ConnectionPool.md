# Connection Pool

Esta página documenta el pool de conexiones MySQL utilizado por el backend Express.js: cómo se configura, cómo se inicializa y apaga, y cómo los errores de base de datos se traducen en respuestas HTTP. Cubre `backend/config/db.js` y `backend/middlewares/dbErrorHandler.js`.

Para información sobre cómo el servidor backend arranca y llama a `testConnection()`, ver [Server Setup & Middleware](ServerSetup&Middleware.md). Para el esquema de base de datos al que se conecta el pool, ver [Schema](Schema.md).

---

## Configuración del Pool

El pool se crea en `backend/config/db.js` usando `mysql2/promise`, que provee a cada query una interfaz `async/await`. Un único objeto `pool` es exportado y compartido entre todos los route handlers.

**Objeto de configuración del pool (`poolConfig`):**

| Opción               | Default         | Fuente                    | Propósito                                          |
| -------------------- | --------------- | ------------------------- | -------------------------------------------------- |
| `host`               | —               | `DB_HOST` env var         | Hostname del servidor de base de datos             |
| `port`               | `3306`          | `DB_PORT` env var         | Puerto del servidor de base de datos               |
| `user`               | —               | `DB_USER` env var         | Username MySQL                                     |
| `password`           | —               | `DB_PASSWORD` env var     | Contraseña MySQL                                   |
| `database`           | —               | `DB_NAME` env var         | Nombre del schema objetivo                         |
| `connectionLimit`    | `10`            | `DB_CONNECTION_LIMIT` env | Máximo de conexiones simultáneas en el pool        |
| `queueLimit`         | `0` (ilimitado) | `DB_QUEUE_LIMIT` env      | Máximo de solicitudes en cola antes de error       |
| `waitForConnections` | `true`          | hardcoded                 | Bloquear callers hasta que una conexión esté libre |
| `connectTimeout`     | `10000 ms`      | hardcoded                 | Máximo ms para esperar una nueva conexión          |
| `multipleStatements` | `false`         | hardcoded                 | Deshabilitado para prevenir SQL injection          |
| `timezone`           | `"local"`       | hardcoded                 | Timezone aplicado a valores fecha/hora             |
| `charset`            | `"utf8mb4"`     | hardcoded                 | Codificación de caracteres                         |

**Fuentes:** `backend/config/db.js` #37-71

---

## SSL/TLS Configuration

SSL es opt-in via la variable de entorno `DB_SSL`. El objeto `sslConfig` se construye condicionalmente antes de crear el pool.

El valor resuelto de `sslConfig` se asigna a la clave `ssl` de `poolConfig`. En un deployment típico de Docker Compose donde el backend y MySQL comparten la misma `app_network`, SSL **no es requerido** y `DB_SSL` se deja sin establecer.

**Fuentes:** `backend/config/db.js` #30-46

---

## API Exportada

El módulo exporta tres elementos, todos consumidos por otras partes del backend:

| Export           | Propósito                                     |
| ---------------- | --------------------------------------------- |
| `pool`           | El objeto pool live de `mysql2/promise`       |
| `testConnection` | Verifica la conectividad DB al arranque       |
| `closePool`      | Drena y cierra limpiamente el pool al apagado |

**Fuentes:** `backend/config/db.js` #136-140

---

## `testConnection()`

Llamado una vez durante `startServer()` al arranque de la aplicación. Adquiere una conexión del pool, ejecuta `SELECT 1`, registra el host/puerto/database y el tamaño del pool, luego libera la conexión de vuelta al pool. Si la query falla, el error se re-lanza, lo que hace que `startServer()` aborte.

**Fuentes:** `backend/config/db.js` #85-112

---

## `closePool()`

Llamado por `setupGracefulShutdown` en `backend/index.js` cuando el proceso recibe una señal de terminación. Llama a `pool.end()`, que espera a que las queries en vuelo terminen antes de cerrar todas las conexiones limpiamente.

**Fuentes:** `backend/config/db.js` #122-133

---

## `pool`

El objeto pool live de `mysql2/promise`. Los route handlers lo importan directamente y llaman a `pool.query()` para queries simples o `pool.getConnection()` cuando necesitan control de transacciones (ej. el insert de reservación concurrentemente seguro — ver **Reservations API**).

---

## Ciclo de Vida del Pool

**Fuentes:** `backend/config/db.js` #85-133

---

## Manejador de Errores de Base de Datos

`backend/middlewares/dbErrorHandler.js` exporta un middleware de manejo de errores de Express (`dbErrorHandler`) y un helper wrapper (`asyncHandler`). Es responsable de:

- Detectar si un error lanzado provino de MySQL
- Mapear códigos de error MySQL a códigos de estado HTTP apropiados
- Retornar un mensaje de error genérico y no leaky al cliente
- Registrar detalles completos del error server-side (el SQL se suprime en producción)

### `asyncHandler`

Los route handlers que usan `pool.query()` o `pool.getConnection()` se envuelven con `asyncHandler` para asegurar que cualquier promesa rechazada sea reenviada a la cadena de errores de Express via `next(err)`.

**Fuentes:** `backend/middlewares/dbErrorHandler.js` #306-310

### Mapeo de Códigos de Error

`getClientResponse()` inspecciona `error.code` y `error.errno` para seleccionar un estado HTTP:

| Código MySQL / errno                                                                 | Estado HTTP | Mensaje al cliente                                   |
| ------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------- |
| `ECONNREFUSED`, `ETIMEDOUT`, `EHOSTUNREACH`, `ENOTFOUND`, `PROTOCOL_CONNECTION_LOST` | `503`       | Servicio temporalmente no disponible                 |
| `ER_DUP_ENTRY` (1062)                                                                | `409`       | El registro ya existe                                |
| `ER_NO_REFERENCED_ROW`, `ER_NO_REFERENCED_ROW_2` (1216, 1452)                        | `400`       | La cancha o usuario no existe                        |
| `ER_ROW_IS_REFERENCED`, `ER_ROW_IS_REFERENCED_2` (1217, 1451)                        | `400`       | No se puede eliminar — tiene reservaciones asociadas |
| `ER_BAD_NULL_ERROR`, `ER_DATA_TOO_LONG`, `ER_TRUNCATED_WRONG_VALUE`                  | `400`       | Datos inválidos                                      |
| `ER_LOCK_WAIT_TIMEOUT` (1205), `ER_LOCK_DEADLOCK` (1213)                             | `503`       | Servidor ocupado, reintentar                         |
| `ER_ACCESS_DENIED_ERROR`, `ER_DBACCESS_DENIED_ERROR`                                 | `503`       | Servicio temporalmente no disponible                 |
| `ER_BAD_DB_ERROR`, `ER_NO_SUCH_TABLE`, `ER_BAD_FIELD_ERROR`                          | `500`       | Error interno del servidor                           |
| Todos los demás errores DB                                                           | `500`       | Error del servidor                                   |

**Fuentes:** `backend/middlewares/dbErrorHandler.js` #84-204, #254-289

---

## Comportamiento de Logging del Servidor

`logError()` siempre imprime: timestamp, método de solicitud/URL/IP, `error.code`, `error.errno`, `error.sqlState`, y `error.message`. En entornos no-producción imprime adicionalmente el string SQL crudo y el stack trace completo. El SQL **nunca se registra en producción** para evitar filtrar la estructura de las queries.
