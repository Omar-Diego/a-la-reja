# Architecture

Esta página describe la arquitectura general del sistema de A La Reja: los tres niveles (frontend, backend, base de datos), cómo están alojados, cómo se comunican y qué archivos de código pertenecen a cada área. Para detalles específicos de autenticación, ver [Authentication](Authentication.md). Para detalles de configuración de deployment, ver [Deployment & Configuration](Deployment&Configuration.md).

---

## Descripción General del Sistema

A La Reja es una aplicación web de tres niveles:

| Tier        | Technology                   | Host   | Container           |
| ----------- | ---------------------------- | ------ | ------------------- |
| Frontend    | Next.js 16 (App Router, SSR) | Vercel | —                   |
| Backend API | Express.js 5.2.1             | VPS    | `a_la_reja_backend` |
| Database    | MySQL 8.0                    | VPS    | `a_la_reja_mysql`   |

El frontend y el backend están alojados en infraestructura separada. El frontend llama al backend sobre HTTPS usando la variable de entorno `NEXT_PUBLIC_API_URL`. El backend y la base de datos se comunican sobre una red bridge interna de Docker (`app_network`) y nunca aceptan conexiones desde internet público en el puerto de base de datos.

---

## Frontend (Vercel)

El frontend es una aplicación Next.js App Router deployada en Vercel. Todas las páginas viven bajo `app/` y son renderizadas del lado del servidor por defecto.

### Archivos clave del frontend

| Archivo                       | Rol                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `app/layout.tsx`              | Root layout; envuelve todas las páginas en `SessionProvider` → `AuthProvider` → `MobileBlocker` |
| `auth.ts`                     | Configuración de NextAuth.js; Credentials provider; emite/valida JWTs                           |
| `middleware.ts`               | Edge middleware; aplica control de acceso a nivel de ruta antes del renderizado                 |
| `app/context/AuthContext.tsx` | Auth context del lado del cliente; lee sesión, espeja token en cookie, expone `getAuthHeader()` |
| `next.config.ts`              | Configuración de Next.js                                                                        |

El único punto de entrada para comunicación API con el backend es a través de `getAuthHeader()` de `AuthContext`, que lee el token almacenado en la sesión NextAuth (y espejado a una `js-cookie`) y lo adjunta como `Authorization: Bearer <token>` en cada llamada `fetch` saliente.

---

## Backend (Docker — Express.js)

El backend es una aplicación Node.js/Express.js corriendo dentro de Docker en el puerto `3001`. Es el único proceso que habla con la base de datos o con el servicio de email Resend.

### Stack de Middleware

El stack de middleware en `backend/index.js` se aplica en este orden:

| Orden | Middleware                                            | Propósito                                                       |
| ----- | ----------------------------------------------------- | --------------------------------------------------------------- |
| 1     | `helmet`                                              | Establece headers HTTP de seguridad (CSP, etc.)                 |
| 2     | `generalLimiter`                                      | Rate limit: 100 req / 15 min por IP                             |
| 3     | `cors`                                                | Restringe orígenes a la lista `allowedOrigins` + `*.vercel.app` |
| 4     | `express.json({ limit: "10kb" })`                     | Parsing del body con límite de tamaño                           |
| 5     | `authLimiter` (en `/api/login`, `POST /api/usuarios`) | Rate limit estricto: 5 req / 15 min                             |
| 6     | Route handlers                                        | Lógica de negocio                                               |
| 7     | 404 handler                                           | Catch-all para rutas no definidas                               |
| 8     | `dbErrorHandler`                                      | Mapea códigos de error MySQL a respuestas HTTP                  |

### Organización de Rutas

Todas las rutas tienen prefijo `/api`:

| Archivo de rutas                   | Montado en | Auth requerida                              |
| ---------------------------------- | ---------- | ------------------------------------------- |
| `backend/routes/auth.js`           | `/api`     | Ninguna (endpoint de login público)         |
| `backend/routes/profile.js`        | `/api`     | Middleware `auth`                           |
| `backend/routes/admin/usuarios.js` | `/api`     | Middleware `adminAuth`                      |
| `backend/routes/reservaciones.js`  | `/api`     | Mixta (ver nota abajo)                      |
| `backend/routes/canchas.js`        | `/api`     | Mixta (lecturas públicas, escrituras admin) |

---

## Database (Docker — MySQL 8.0)

La instancia MySQL corre como `a_la_reja_mysql` dentro del stack Docker Compose. Solo es accesible desde `app_network` usando el hostname interno `mysql` en el puerto `3306`. El puerto `3306` está expuesto en `0.0.0.0` en el archivo Compose para administración remota, pero la postura de seguridad en producción depende de reglas de firewall a nivel VPS para bloquear el acceso externo.

Los archivos SQL de migración se montan en `/docker-entrypoint-initdb.d/` en el contenedor MySQL y se ejecutan automáticamente en el primer inicio.

| Archivo de migración               | Ruta en el contenedor                               |
| ---------------------------------- | --------------------------------------------------- |
| `migrations/001_create_tables.sql` | `/docker-entrypoint-initdb.d/001_create_tables.sql` |
| `migrations/002_seed_canchas.sql`  | `/docker-entrypoint-initdb.d/002_seed_canchas.sql`  |
| `migrations/003_add_telefono.sql`  | `/docker-entrypoint-initdb.d/003_add_telefono.sql`  |

El backend accede a MySQL via un pool de conexiones `mysql2/promise` configurado en `backend/config/db.js`.

---

## Comunicación entre Servicios

Puntos clave:

- El **frontend nunca consulta la base de datos directamente**.
- El mismo `JWT_SECRET` es usado por el backend (`jsonwebtoken`) y por el frontend `auth.ts` (`jose`) para firmar y verificar tokens; ambos entornos deben compartir el mismo valor de secreto.
- Las confirmaciones de email se envían asincrónicamente después de que un `INSERT` de reservación hace commit — la respuesta HTTP no espera a que el email se resuelva.

---

## Red de Docker Compose

- `DB_HOST` está configurado como `mysql` en el entorno Compose del backend, que se resuelve al contenedor `a_la_reja_mysql` vía DNS interno de Docker.
- El backend solo inicia después de que el healthcheck de MySQL pasa (`condition: service_healthy`).
- Los datos persistentes se almacenan en el volumen nombrado `mysql_data` en el host.

---

## Patrón de Bearer Token

Todas las llamadas API autenticadas desde el frontend usan el header `Authorization: Bearer <token>`. El ciclo de vida del token es:

1. **Emitido**: Ya sea por `auth.ts` directamente (path de admin via `jose SignJWT`) o por el backend Express en `POST /api/login` (via `jsonwebtoken`).
2. **Almacenado en sesión NextAuth**: Los callbacks JWT y session de `auth.ts` colocan el token en `session.accessToken`.
3. **Espejado a cookie del navegador**: `AuthContext` lee `session.accessToken` y lo escribe via `js-cookie` como `auth_token`.
4. **Adjuntado a peticiones**: `getAuthHeader()` en `AuthContext` retorna `{ Authorization: "Bearer <token>" }` para uso en llamadas `fetch`.
5. **Verificado**: `backend/middlewares/auth.js` llama a `jwt.verify(token, JWT_SECRET)` en cada ruta protegida.

Para el flujo completo de autenticación, ver [Authentication](Authentication.md).
