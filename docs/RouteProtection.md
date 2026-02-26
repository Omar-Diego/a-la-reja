# Route Protection

Esta página documenta `middleware.ts`, el Edge Middleware de Next.js que actúa como guard de rutas a nivel de aplicación para A La Reja. Controla qué páginas son accesibles basándose en si un usuario está autenticado y qué rol tiene.

Para cómo se establecen las sesiones y tokens en primer lugar, ver [Authentication](Authentication.md). Para cómo `auth.ts` emite JWTs y puebla la sesión, ver [NextAuth Configuration](NextAuthConfiguration.md). Para cómo el `AuthContext` del lado del cliente lee la sesión y la expone a los componentes, ver [Frontend Auth Context](FrontendAuthContext.md).

---

## Descripción General

`middleware.ts` corre en cada petición antes de que una página se renderice. Lee la sesión NextAuth activa via el helper `auth` y aplica lógica de redirección basada en:

- Si el usuario está autenticado (`isAuthenticated`)
- El rol del usuario de la sesión (`req.auth?.user?.role`)
- En qué categoría cae el path solicitado

El middleware está registrado con un patrón matcher que excluye los internals de Next.js y los assets estáticos para que solo intercepte rutas de páginas navegables.

**Fuentes:** `middleware.ts` #1-75

---

## Categorías de Rutas

Todas las rutas se clasifican en uno de tres arrays nombrados al inicio del archivo:

| Array             | Rutas cubiertas                                                         | Regla de acceso                                           |
| ----------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| `protectedRoutes` | `/dashboard`, `/reservaciones`, `/perfil`, `/reservar`, `/mis_reservas` | Cualquier usuario autenticado (en práctica solo no-admin) |
| `adminRoutes`     | `/admin`                                                                | Usuarios autenticados con `role === "admin"` solo         |
| `authRoutes`      | `/login`, `/register`                                                   | Solo usuarios no autenticados                             |

Los tres arrays usan coincidencia por prefijo: un path coincide si es igual al string listado exactamente o comienza con `{route}/`. Esto significa que `/reservar/cancha-1` coincide con `protectedRoutes` porque comienza con `/reservar/`.

**Fuentes:** `middleware.ts` #4-12, `middleware.ts` #20-30

---

## Matcher Configuration

El middleware solo corre en rutas que pasan el filtro `config.matcher`:

```
/((?!api|_next/static|_next/image|favicon.ico|images).*)
```

Este patrón de lookahead negativo excluye:

- `/api/*` — rutas API de Next.js
- `/_next/static/*` y `/_next/image/*` — assets en bundle
- `/favicon.ico` y `/images/*` — archivos estáticos

Todo lo demás, incluyendo todas las rutas de páginas de la aplicación, es interceptado.

**Fuentes:** `middleware.ts` #73-75

---

## Reglas de Redirección

### Tabla Resumen de Reglas

La tabla siguiente enumera cada caso de redirección distinto en orden de evaluación:

| Condición                                | Destino                          |
| ---------------------------------------- | -------------------------------- |
| `pathname === "/"` AND admin autenticado | `/admin`                         |
| `isProtectedRoute` AND admin autenticado | `/admin`                         |
| `isProtectedRoute` AND no autenticado    | `/login?callbackUrl=<pathname>`  |
| `isAdminRoute` AND no autenticado        | `/login?callbackUrl=<pathname>`  |
| `isAdminRoute` AND autenticado, no-admin | `/dashboard`                     |
| `isAuthRoute` AND admin autenticado      | `/admin`                         |
| `isAuthRoute` AND no-admin autenticado   | `/dashboard`                     |
| Todos los otros casos                    | `NextResponse.next()` (permitir) |

El parámetro de query `callbackUrl` se establece cuando se redirige a usuarios no autenticados a `/login`, para que puedan ser retornados a la página solicitada originalmente después de iniciar sesión.

**Fuentes:** `middleware.ts` #32-68

---

## Integración con NextAuth

El middleware importa `auth` de `@/auth` (`middleware.ts` #1) y envuelve el handler completo con él: `export default auth((req) => { ... })`. Este patrón es la integración de middleware NextAuth v5 — `auth` inyecta `req.auth` en el objeto request, que contiene la sesión decodificada (incluyendo `user.role` y `user.accessToken`) si una cookie de sesión válida está presente.

- `isAuthenticated` se computa como `!!req.auth` — truthy cuando existe una sesión (`middleware.ts` #16)
- `userRole` lee `req.auth?.user?.role`, que se puebla durante el callback JWT de NextAuth en `auth.ts` (`middleware.ts` #17)

Los usuarios regulares no reciben un string de rol explícito; solo las sesiones de admin llevan `role: "admin"`. Por lo tanto, el chequeo `userRole !== "admin"` identifica de manera confiable sesiones autenticadas de no-admin.

**Fuentes:** `middleware.ts` #1, `middleware.ts` #14-18

---

## Separación de Responsabilidades

La protección de rutas en `middleware.ts` es distinta de la autorización API del backend:

| Capa                    | Archivo                       | Mecanismo                                        | Alcance                |
| ----------------------- | ----------------------------- | ------------------------------------------------ | ---------------------- |
| Guard de rutas frontend | `middleware.ts`               | Cookie de sesión NextAuth, chequeo de rol        | Navegación de páginas  |
| Auth API backend        | `backend/middlewares/auth.js` | `jwt.verify()` en header `Authorization: Bearer` | Acceso a endpoints API |

El middleware solo controla si un navegador puede navegar a la URL de una página. Los endpoints API del backend aplican su propia verificación JWT independientemente. Un usuario que de alguna manera evite el middleware aún sería denegado datos por el backend. Para detalles del middleware de auth del backend, ver **Backend API**.
