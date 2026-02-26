# Environment Variables & Configuration

Esta página documenta cada variable de entorno consumida por el sistema A La Reja, el componente que lee cada variable, y los dos scripts de diagnóstico usados para verificar la configuración. Cubre los tres niveles de deployment: el frontend Next.js en Vercel, el backend Express.js corriendo en Docker, y el contenedor MySQL.

Para cómo el servidor backend valida estas variables al arranque, ver [Server Setup & Middleware](ServerSetup&Middleware.md). Para cómo el stack de Docker Compose se construye y qué servicios comparten qué variables, ver [Docker Setup](DockerSetup.md). Para cómo `AUTH_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` son consumidos durante el flujo de autenticación, ver [NextAuth Configuration](NextAuthConfiguration.md).

---

## Propiedad de Variables por Componente

Cada variable de entorno pertenece exactamente a un nivel de deployment.

**Fuentes:** `check-env.js` #54-79, `docker-compose.yml` #11-63, `backend/index.js` #29-83

---

## Referencia Completa de Variables

### Frontend (Next.js on Vercel)

Estas variables se establecen en la configuración del proyecto Vercel o en un archivo `.env` local. Las variables con prefijo `NEXT_PUBLIC_*` se incrustan en el bundle del navegador en build time; todas las demás permanecen server-side.

| Variable              | Requerida | Secreta | Default | Propósito                                                                                            |
| --------------------- | --------- | ------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Sí        | No      | —       | URL base para todas las llamadas `fetch()` al backend Express (ej. `https://82-180-163-31.sslip.io`) |
| `AUTH_SECRET`         | Sí        | Sí      | —       | Clave de firma para sesiones NextAuth y la llamada `jose SignJWT` del admin en `auth.ts`             |
| `NEXTAUTH_URL`        | No        | No      | Auto    | URL canónica completa de la app Next.js; requerida en algunos entornos hosted para callbacks OAuth   |
| `ADMIN_EMAIL`         | Sí        | No      | —       | La dirección de email que identifica el path de login de administrador en `auth.ts`                  |
| `ADMIN_PASSWORD`      | Sí        | Sí      | —       | Contraseña admin en texto plano comparada via `timingSafeStringEqual()` en `auth.ts`                 |

**Fuentes:** `check-env.js` #55-64

---

### Backend (Express.js in Docker)

Estas variables son inyectadas por Docker Compose al arranque del contenedor. El backend valida que las cinco más críticas estén presentes en `startServer()` antes de que el servidor acepte conexiones — si alguna falta, el proceso sale con código `1`.

| Variable         | Requerida | Secreta | Default       | Propósito                                                                                                                            |
| ---------------- | --------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `JWT_SECRET`     | Sí        | Sí      | —             | Secreto compartido para `jwt.sign()` y `jwt.verify()` en todos los tokens de usuario. Debe coincidir con `AUTH_SECRET` del frontend. |
| `FRONTEND_URL`   | Sí        | No      | —             | Añadido a `allowedOrigins` en la configuración CORS                                                                                  |
| `PORT`           | No        | No      | `3000`        | Puerto de escucha HTTP; Docker Compose lo establece en `3001`                                                                        |
| `NODE_ENV`       | No        | No      | `development` | Controla la strictness de CORS, logging de requests, y comportamiento de unhandled rejection                                         |
| `RESEND_API_KEY` | Sí        | Sí      | —             | API key para el servicio de email Resend                                                                                             |
| `FROM_EMAIL`     | Sí        | No      | —             | Dirección del remitente para emails de confirmación de reservaciones                                                                 |
| `DB_SSL`         | No        | No      | `false`       | Habilita SSL/TLS en la conexión del pool MySQL cuando se establece en cualquier valor truthy                                         |

**Fuentes:** `backend/index.js` #29-84, `docker-compose.yml` #51-63

---

### Base de Datos (contenedor MySQL 8.0)

Estas variables son consumidas tanto por el contenedor MySQL (para crear la base de datos y usuario en primer boot) como por el backend Express (para abrir conexiones del pool).

| Variable              | Requerida | Secreta | Lado             | Propósito                                                                                                                       |
| --------------------- | --------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `MYSQL_ROOT_PASSWORD` | Sí        | Sí      | Contenedor MySQL | Contraseña root; también usada por el comando `mysqladmin ping` del healthcheck                                                 |
| `DB_NAME`             | Sí        | No      | Ambos            | Nombre de la base de datos; pasado como `MYSQL_DATABASE` a MySQL y como `database` al pool del backend                          |
| `DB_USER`             | Sí        | No      | Ambos            | Usuario de la aplicación no-root; pasado como `MYSQL_USER` a MySQL y como `user` al pool                                        |
| `DB_PASSWORD`         | Sí        | Sí      | Ambos            | Contraseña para `DB_USER`; pasado como `MYSQL_PASSWORD` a MySQL y como `password` al pool                                       |
| `DB_HOST`             | No        | No      | Solo backend     | Hostname para el pool MySQL. Docker Compose lo hardcodea a `mysql` (el nombre del servicio); default a `localhost` en dev local |
| `DB_PORT`             | No        | No      | Solo backend     | Puerto para el pool MySQL. Default a `3306`                                                                                     |

**Fuentes:** `docker-compose.yml` #11-19, #54-58, `check-env.js` #67-72

---

## Validación de Inicio del Backend

La función `startServer()` en `backend/index.js` tiene una lista hardcodeada de variables requeridas y llama a `process.exit(1)` si alguna está ausente. Esto es distinto de los scripts de diagnóstico descritos abajo — **corre cada vez que el backend arranca**.

**Fuentes:** `backend/index.js` #226-250

---

## Inyección de Variables de Docker Compose

Docker Compose lee un archivo `.env` desde la raíz del proyecto en runtime y sustituye variables en las definiciones de servicio. La sintaxis `${VAR:?error_message}` hace que `docker compose up` falle inmediatamente si la variable no está establecida, **previniendo misconfiguraciones silenciosas**.

> **Nota:** `DB_HOST` **no se lee desde `.env`** — Docker Compose lo establece al string literal `mysql`, que resuelve a la IP del contenedor MySQL en `app_network`. De manera similar, `NODE_ENV` y `PORT` están hardcodeados como `production` y `3001` en `docker-compose.yml` y no se esperan en `.env`.

**Fuentes:** `docker-compose.yml` #1-71

---

## Scripts de Diagnóstico

Dos scripts Node.js en la raíz del proyecto pueden ejecutarse para verificar la configuración sin iniciar ningún servicio.

### `check-env.js` — Validador de Variables de Entorno

**Uso:** `node check-env.js`

Llama a `require("dotenv").config()` luego itera sobre cada variable conocida usando el helper `checkVar()`.

**Comportamiento de `checkVar()`:**

| Condición                           | Salida                                             |
| ----------------------------------- | -------------------------------------------------- |
| Variable requerida y establecida    | OK con valor (o preview enmascarado si es secreta) |
| Variable opcional y no establecida  | Advertencia                                        |
| Variable requerida y no establecida | Error — establece exit code 1                      |

Las variables secretas (`AUTH_SECRET`, `ADMIN_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`) se enmascaran: solo se muestran los primeros cuatro caracteres, el resto se reemplaza con `*`.

**Fuentes:** `check-env.js` #1-118

---

### `test-backend.js` — API Connectivity Verifier

**Uso:** `node test-backend.js`

Realiza solicitudes HTTP en vivo contra el backend corriendo para verificar la configuración end-to-end. Lee `NEXT_PUBLIC_API_URL` del entorno (default a `https://82-180-163-31.sslip.io`) y ejecuta los siguientes tests en secuencia:

| #   | Test                            | Endpoint                 | Auth                        |
| --- | ------------------------------- | ------------------------ | --------------------------- |
| 1   | Health check                    | `GET /health`            | Ninguna                     |
| 2   | Public court listing            | `GET /api/canchas`       | Ninguna                     |
| 3   | User login                      | `POST /api/login`        | `test@test.com` / `test123` |
| 4   | Authenticated reservation fetch | `GET /api/reservaciones` | Token del test 3            |
| 5   | JWT_SECRET presence check       | —                        | Solo env local              |

> **Test 5** no hace una solicitud de red. Lee `JWT_SECRET` del entorno local e imprime una advertencia recordando al operador que el valor debe ser **idéntico** en el frontend y el backend o la verificación de tokens fallará.

**Fuentes:** `test-backend.js` #1-98

---

## Notas de Seguridad

- El archivo `.env` **nunca debe comprometerse en control de versiones**. Tanto `check-env.js` como comentarios inline en `docker-compose.yml` lo hacen explícito.
- `JWT_SECRET`, `AUTH_SECRET`, y todas las contraseñas deben generarse con una herramienta como `openssl rand -base64 32` para asegurar entropía suficiente.
- `JWT_SECRET` debe ser el mismo valor en el backend (donde firma tokens via `jwt.sign()`) y, para tokens admin, en el frontend (donde `jose SignJWT` usa `AUTH_SECRET` como clave). El test 5 de `test-backend.js` surfacea mismatches entre entornos.
- `ADMIN_PASSWORD` se almacena como texto plano en el entorno. **Nunca se escribe en la base de datos.** La comparación en `auth.ts` usa `timingSafeStringEqual()` para prevenir timing attacks.
