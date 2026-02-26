# Server Setup & Middleware

Esta página cubre el punto de entrada del backend Express.js (`backend/index.js`): cómo se inicializa la aplicación, qué middleware corre en cada petición y en qué orden, cómo se montan las rutas, el ciclo de vida de inicio y la secuencia de shutdown graceful.

Para detalles sobre el connection pool de base de datos en sí, ver [Connection Pool](ConnectionPool.md). Para los route handlers montados aquí, ver [Reservations API](ReservaitonsAPI.md), [Users API](UsersAPI.md) y [Courts API](CourtsAPI.md). Para las variables de entorno requeridas en el inicio, ver [Environment Variables & Configuration](EnvironmentVariables&Configuration.md).

---

## Descripción General

El backend es una única aplicación Express.js definida en `backend/index.js`. Actúa como la única puerta de enlace entre el frontend Next.js y la base de datos MySQL. Todas las rutas tienen prefijo `/api`, y toda la comunicación inter-servicio es asegurada a nivel de middleware antes de que cualquier route handler se ejecute.

### Dependencias en Tiempo de Ejecución

(`backend/package.json` #1-24)

| Paquete              | Rol                                        |
| -------------------- | ------------------------------------------ |
| `express`            | Framework HTTP (v5)                        |
| `helmet`             | Headers de respuesta de seguridad          |
| `express-rate-limit` | Throttling de peticiones                   |
| `cors`               | Política de peticiones cross-origin        |
| `dotenv`             | Carga de variables de entorno              |
| `mysql2`             | Connection pool de base de datos           |
| `jsonwebtoken`       | Verificación JWT en el middleware de rutas |
| `bcryptjs`           | Hashing de contraseñas en route handlers   |
| `resend`             | Entrega de email transaccional             |

---

## Stack de Middleware

El middleware se registra en un orden estricto. La secuencia importa: las capas de seguridad corren primero, luego el parsing del body, luego los rate limits específicos de ruta, luego las rutas mismas, y finalmente los error handlers.

**Fuentes:** `backend/index.js` #37-218

---

### helmet

`backend/index.js` #37-49

`helmet` se aplica primero, incondicionalmente. Establece los siguientes response headers:

| Directiva                    | Valor                              |
| ---------------------------- | ---------------------------------- |
| Content-Security-Policy      | `defaultSrc 'self'`                |
| Content-Security-Policy      | `styleSrc 'self', 'unsafe-inline'` |
| Content-Security-Policy      | `scriptSrc 'self'`                 |
| Content-Security-Policy      | `imgSrc 'self', data:, https:`     |
| Cross-Origin-Embedder-Policy | Deshabilitado (`false`)            |

`crossOriginEmbedderPolicy` está deshabilitado para prevenir problemas con ciertos patrones de carga de assets del frontend.

---

### Limitación de Tasa

Dos instancias de `express-rate-limit` están configuradas. Ambas usan una ventana deslizante de 15 minutos con estado en memoria. (`backend/index.js` #52-72)

| Variable del limiter | Ventana | Máx. Peticiones | Aplicado a                              |
| -------------------- | ------- | --------------- | --------------------------------------- |
| `generalLimiter`     | 15 min  | 100             | Todas las rutas (`app.use`)             |
| `authLimiter`        | 15 min  | 5               | `POST /api/login`, `POST /api/usuarios` |

Ambas instancias de limiter establecen `standardHeaders: true` y `legacyHeaders: false`, lo que significa que el estado del rate limit se comunica via los headers `RateLimit-*` (estándar draft RFC 6585), no los headers legacy `X-RateLimit-*`.

`app.set("trust proxy", 1)` (`backend/index.js` #27) está establecido para que `express-rate-limit` lea la IP real del cliente desde el header `X-Forwarded-For` cuando el servidor corre detrás de un reverse proxy (como lo hace dentro de Docker Compose).

El `authLimiter` se aplica solo a `POST /api/usuarios`, no a todos los métodos, via un chequeo condicional:

```javascript
if (req.method === "POST") return authLimiter(req, res, next);
```

**Fuentes:** `backend/index.js` #27, #52-76, #157-162

---

### CORS

`backend/index.js` #79-124

El middleware `cors` usa una función de origen dinámica en lugar de un string estático. El array `allowedOrigins` se construye al inicio desde valores hardcodeados más `process.env.FRONTEND_URL`:

```javascript
const allowedOrigins = [
  "https://a-la-reja.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean);
```

**Lógica de evaluación de origen:**

- Métodos permitidos: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.
- Headers permitidos: `Content-Type`, `Authorization`.
- `credentials: true` está establecido para soportar cookies junto al header `Authorization`.

---

### Parsing del Body

`backend/index.js` #128-131

Tanto el JSON como los parsers de body URL-encoded están registrados con un límite de 10 KB para reducir la exposición a ataques de denegación de servicio de payloads sobredimensionados:

```javascript
express.json({ limit: "10kb" });
express.urlencoded({ extended: true, limit: "10kb" });
```

---

### Logger de Peticiones en Desarrollo

`backend/index.js` #134-140

Cuando `NODE_ENV` no es `"production"`, un middleware inline simple registra cada petición con un timestamp ISO, método HTTP y URL en stdout. Este middleware **no se registra en producción**.

---

## Montaje de Rutas

Todas las rutas están registradas bajo el prefijo `/api`. El `authLimiter` se aplica antes del registro de rutas para los dos paths sensibles a auth.

Los cinco módulos de rutas se importan y registran en este orden (`backend/index.js` #145-173):

| Variable              | Archivo                   | Montado en |
| --------------------- | ------------------------- | ---------- |
| `authRoutes`          | `./routes/auth`           | `/api`     |
| `profileRoutes`       | `./routes/profile`        | `/api`     |
| `adminUsuariosRoutes` | `./routes/admin/usuarios` | `/api`     |
| `reservacionesRoutes` | `./routes/reservaciones`  | `/api`     |
| `canchasRoutes`       | `./routes/canchas`        | `/api`     |

**Fuentes:** `backend/index.js` #145-174

---

## Endpoint de Salud

`GET /health` (`backend/index.js` #180-199) es un endpoint no autenticado que verifica la conectividad live de la base de datos. Adquiere una conexión del pool, corre `SELECT 1`, luego la libera.

**Success response (HTTP 200):**

```json
{
  "status": "healthy",
  "timestamp": "<ISO string>",
  "database": "connected"
}
```

**Failure response (HTTP 503):**

```json
{
  "status": "unhealthy",
  "timestamp": "<ISO string>",
  "database": "disconnected"
}
```

Este endpoint es usado por el healthcheck de Docker definido en el backend Dockerfile (ver **Docker Setup**).

---

## Manejo de Errores

Dos funciones de middleware terminales siguen a todas las rutas:

**404 Handler** (`backend/index.js` #205-211): Captura cualquier petición que no coincidió con una ruta registrada y retorna:

```json
{ "error": "Ruta no encontrada", "path": "<originalUrl>" }
```

**`dbErrorHandler`** (`backend/index.js` #218): Importado desde `./middlewares/dbErrorHandler`. Registrado al final, como requiere Express. Traduce códigos de error MySQL a códigos de estado HTTP apropiados. Ver **Connection Pool** para la lógica completa de mapeo de errores.

---

## Inicio del Servidor — `startServer()`

`startServer()` (`backend/index.js` #226-308) corre al cargar el módulo y condiciona la inicialización del listener HTTP a dos precondiciones:

**Variables de entorno requeridas al inicio:**

| Variable      | Propósito                                   |
| ------------- | ------------------------------------------- |
| `DB_HOST`     | MySQL host                                  |
| `DB_USER`     | MySQL username                              |
| `DB_PASSWORD` | MySQL password                              |
| `DB_NAME`     | MySQL database name                         |
| `JWT_SECRET`  | JWT signing key para el middleware de rutas |

Si alguna está ausente, el proceso termina con código `1` antes de intentar una conexión a la base de datos.

**Diagnóstico de errores de base de datos:** En caso de fallo de conexión, `startServer()` mapea códigos de error conocidos de Node.js/MySQL a output de consola legible:

| Código de error              | Significado                                      |
| ---------------------------- | ------------------------------------------------ |
| `ECONNREFUSED`               | MySQL no está corriendo o host/puerto incorrecto |
| `ER_ACCESS_DENIED_ERROR`     | Credenciales incorrectas                         |
| `ER_BAD_DB_ERROR`            | El nombre de la base de datos no existe          |
| `ETIMEDOUT` / `EHOSTUNREACH` | Problema de red o firewall                       |

Puerto por defecto: `process.env.PORT || 3000`. En el stack Docker Compose esto se establece a `3001` externamente.

---

## Cierre Controlado — `setupGracefulShutdown()`

`setupGracefulShutdown(server)` (`backend/index.js` #318-366) registra handlers en cuatro eventos del proceso:

| Señal / Evento       | Disparador                                                           |
| -------------------- | -------------------------------------------------------------------- |
| `SIGTERM`            | Parada del orquestador de contenedores (e.g., `docker compose down`) |
| `SIGINT`             | Ctrl-C en terminal                                                   |
| `uncaughtException`  | Error sincrónico no manejado                                         |
| `unhandledRejection` | Promise rejection no manejada (solo producción)                      |

**Secuencia de shutdown:**

1. `server.close()` — deja de aceptar nuevas conexiones.
2. `closePool()` — drena y cierra el connection pool MySQL.
3. `process.exit(0)` en éxito, `process.exit(1)` en error.

Un hard timeout de 10 segundos fuerza `process.exit(1)` si la secuencia graceful se bloquea (`backend/index.js` #338-341).

`unhandledRejection` solo activa la secuencia de shutdown en producción. En desarrollo, solo se registra en log.
