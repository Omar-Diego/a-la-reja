# Deployment & Configuration

Esta página cubre el modelo de despliegue en runtime para A La Reja: cómo el backend y la base de datos son empaquetados e iniciados con Docker Compose, cómo el frontend se hostea en Vercel, qué variables de entorno requiere cada componente, y los dos scripts de diagnóstico disponibles para verificar un despliegue.

Para los detalles internos de cada componente siendo desplegado, ver:

- **Internos del servicio Docker:** [Docker Setup](DockerSetup.md)
- **Todas las variables de entorno en detalle completo:** [Environment Variables & Configuration](EnvironmentVariables&Configuration.md)
- **Middleware del backend y ciclo de vida de startup del servidor:** [Server Setup & Middleware](ServerSetup&Middleware.md)
- **Connection pool de base de datos y opciones SSL:** [Connection Pool](ConnectionPool.md)

---

## Deployment Topology

A La Reja usa un modelo de hosting dividido. El **frontend** vive en la plataforma administrada de Vercel. El **backend** y la **base de datos** corren juntos en un VPS dentro de Docker Compose.

**Fuentes:** `docker-compose.yml` #1-79

---

## Stack de Docker Compose

El archivo `docker-compose.yml` en la raíz del repositorio define dos servicios — `mysql` y `backend` — en una red bridge compartida llamada `app_network`.

**Fuentes:** `docker-compose.yml` #1-79

### Detalles del Servicio

| Property        | `mysql`             | `backend`                    |
| --------------- | ------------------- | ---------------------------- |
| Container name  | `a_la_reja_mysql`   | `a_la_reja_backend`          |
| Image / Build   | `mysql:8.0`         | `./backend/Dockerfile`       |
| Published port  | `0.0.0.0:3306:3306` | `3001:3001`                  |
| Restart policy  | `unless-stopped`    | `unless-stopped`             |
| Named volume    | `mysql_data`        | —                            |
| Health check    | `mysqladmin ping`   | `/health` via `wget`         |
| Start condition | —                   | `service_healthy` on `mysql` |
| Network         | `app_network`       | `app_network`                |

El servicio `mysql` monta archivos SQL de migración del directorio local `./migrations/` en `/docker-entrypoint-initdb.d/` como solo lectura. MySQL ejecuta estos scripts en orden lexicográfico en el primer startup. Nota que solo las migraciones 001–003 están montadas aquí; las migraciones posteriores (004, 005) deben aplicarse manualmente. Para la secuencia completa de migraciones, ver **Migrations**.

El servicio `backend` resuelve el host de base de datos como `mysql` (el nombre del servicio), no `localhost`, porque ambos contenedores comparten `app_network`. Esto se establece como una variable de entorno fija: `DB_HOST: mysql` (`docker-compose.yml` #54).

---

## Backend Dockerfile

La imagen del backend se construye desde `backend/Dockerfile`. Características clave:

| Layer             | Detail                                                   |
| ----------------- | -------------------------------------------------------- |
| Base image        | `node:20-alpine`                                         |
| Signal handling   | `dumb-init` instalado via `apk`, usado como `ENTRYPOINT` |
| User              | No-root `nodejs` (uid 1001) creado en build time         |
| Working directory | `/app`                                                   |
| Install command   | `npm ci --only=production` (sin devDependencies)         |
| Exposed port      | `3001`                                                   |
| Health check      | `wget --spider http://localhost:3001/health` cada 30s    |
| Start command     | `node index.js`                                          |

El archivo `backend/.dockerignore` excluye `node_modules`, archivos `.env` y `.git` del contexto de build, asegurando que los secretos **nunca** sean horneados en la imagen.

**Fuentes:** `backend/Dockerfile` #1-37

---

## Frontend Deployment (Vercel)

El frontend Next.js se despliega en Vercel **independientemente** del stack Docker. No hay Dockerfile para el frontend; Vercel lo construye desde el código fuente usando `next build`. El frontend se comunica con el backend del VPS sobre HTTPS usando la variable de entorno `NEXT_PUBLIC_API_URL`.

Las variables de entorno de Vercel deben configurarse en el dashboard del proyecto Vercel (o via la Vercel CLI). No son parte del archivo Docker Compose.

---

## Variables de Entorno

Todas las variables de entorno requeridas agrupadas por el tier que las consume.

### Frontend (Next.js en Vercel)

| Variable              | Required | Description                                                                          |
| --------------------- | -------- | ------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Sí       | URL base del backend Express (ej. `https://82-180-163-31.sslip.io`)                  |
| `AUTH_SECRET`         | Sí       | Clave de firma para tokens de sesión de NextAuth.js                                  |
| `NEXTAUTH_URL`        | Opcional | URL canónica del frontend; necesaria para algunos escenarios de redirect de NextAuth |
| `ADMIN_EMAIL`         | Sí       | Email de login admin, comparado en `auth.ts` (nunca enviado al backend)              |
| `ADMIN_PASSWORD`      | Sí       | Contraseña de login admin, comparada en `auth.ts` usando `timingSafeStringEqual`     |

### Backend (dentro de Docker Compose)

| Variable         | Required | Description                                                                                         |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`     | Sí       | Secreto para firmar y verificar JWTs de usuario (debe coincidir con el valor usado por el frontend) |
| `FRONTEND_URL`   | Sí       | Origen CORS permitido para el backend                                                               |
| `PORT`           | Opcional | Puerto HTTP; por defecto `3001`                                                                     |
| `NODE_ENV`       | Opcional | Establecido como `production` en `docker-compose.yml`                                               |
| `RESEND_API_KEY` | Sí       | API key para el servicio de email Resend                                                            |
| `FROM_EMAIL`     | Sí       | Dirección del remitente para emails de confirmación de reservación                                  |
| `DB_SSL`         | Opcional | Establecer como `"false"` en `docker-compose.yml` para despliegues en VPS sin TLS hacia MySQL       |

### Base de Datos (contenedor MySQL)

| Variable              | Required | Description                                                                                    |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `MYSQL_ROOT_PASSWORD` | Sí       | Contraseña root para el contenedor MySQL                                                       |
| `DB_NAME`             | Sí       | Nombre de la base de datos (también pasada al backend como `DB_NAME`)                          |
| `DB_USER`             | Sí       | Usuario de base de datos de la aplicación (también pasada al backend)                          |
| `DB_PASSWORD`         | Sí       | Contraseña de base de datos de la aplicación (también pasada al backend)                       |
| `DB_HOST`             | —        | Fija como `mysql` en `docker-compose.yml`; no se lee de `.env` para el contenedor en ejecución |
| `DB_PORT`             | —        | Fija como `3306` en `docker-compose.yml`                                                       |

> **Nota de seguridad:** Todas las variables requeridas en `docker-compose.yml` usan la sintaxis `${VAR:?error_message}` (`docker-compose.yml` #13-16), que causa que Docker Compose falle inmediatamente con un error descriptivo si alguna variable requerida falta del entorno en el startup.

> **Importante:** El `JWT_SECRET` debe ser **idéntico** entre el backend y el frontend. Si difieren, los tokens emitidos por el backend no serán aceptados. El script `test-backend.js` (descrito abajo) verifica esta condición.

**Fuentes:** `docker-compose.yml` #11-63, `check-env.js` #55-79

---

## Scripts de Diagnóstico

Dos scripts Node.js en la raíz del repositorio asisten en la verificación de la configuración del despliegue.

### check-env.js — Validador de Variables de Entorno

**Uso:** `node check-env.js`

Carga `.env` via `dotenv` y verifica cada variable esperada por presencia. Muestra un estado OK/Error/Advertencia para cada variable. Los secretos están parcialmente enmascarados (se muestran los primeros 4 caracteres). **Sale con código 1** si alguna variable requerida falta.

**Fuentes:** `check-env.js` #55-111

---

### test-backend.js — Verificador de Conectividad de API

**Uso:** `node test-backend.js` (o `NEXT_PUBLIC_API_URL=<url> node test-backend.js`)

Ejecuta cinco tests secuenciales contra el backend en vivo:

| Test | Endpoint                 | Qué verifica                                                                    |
| ---- | ------------------------ | ------------------------------------------------------------------------------- |
| 1    | `GET /health`            | Backend es alcanzable y retorna `200`                                           |
| 2    | `GET /api/canchas`       | Endpoint público retorna datos de canchas                                       |
| 3    | `POST /api/login`        | Login con `test@test.com` / `test123` (fallo es normal si el usuario no existe) |
| 4    | `GET /api/reservaciones` | Request autenticado con token del test 3                                        |
| 5    | `process.env.JWT_SECRET` | Verifica que `JWT_SECRET` está establecido en el entorno actual de shell        |

El **Test 5** específicamente advierte que el `JWT_SECRET` en el entorno actual debe ser el mismo valor usado por el backend en ejecución. Una discrepancia causará fallos de validación de token en runtime incluso si todos los demás tests pasan.

La URL del backend por defecto es `https://82-180-163-31.sslip.io` (`test-backend.js` #8-9), que es la dirección del VPS de producción actual. Sobreescribir con `NEXT_PUBLIC_API_URL`.

**Fuentes:** `test-backend.js` #1-98
