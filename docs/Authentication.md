# Authentication

Esta página describe la arquitectura general de autenticación: cómo funcionan los dos tracks de login, dónde se crean los JWTs, cómo se almacenan y cómo se adjuntan a las peticiones API. Para detalles de implementación de componentes específicos, ver:

- [NextAuth Configuration](NextAuthConfiguration.md) — el Credentials provider de `auth.ts`, callbacks JWT/session y emisión del token admin
- [Frontend Auth Context](FrontendAuthContext.md) — `AuthContext`, mirroring de cookies y `getAuthHeader()`
- [Route Protection](RouteProtection.md) — reglas de redirección de `middleware.ts` para rutas protegidas y de admin
- [Users API](UsersAPI.md) — endpoint `/api/login`, comparación con bcrypt y emisión del JWT del backend

---

## Descripción General

La autenticación en A La Reja usa dos tracks paralelos, ambos expuestos a través de un único Credentials provider de NextAuth.js. El factor diferenciador es el email enviado: si coincide con `ADMIN_EMAIL`, el login se maneja completamente dentro de Next.js; de lo contrario, se delega al backend Express.

| Propiedad                        | Track Admin                                           | Track Usuario regular                              |
| -------------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Fuente de credenciales           | Variables de entorno `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Tabla MySQL `USUARIOS` (hash bcrypt)               |
| Comparación de credenciales      | `timingSafeStringEqual()` en `auth.ts`                | `bcrypt.compare()` en `backend/routes/usuarios.js` |
| Emisor del token                 | `jose SignJWT` dentro de Next.js                      | `jsonwebtoken` dentro de Express `/api/login`      |
| Algoritmo del token              | HS256, firmado con `JWT_SECRET`                       | HS256, firmado con `JWT_SECRET`                    |
| Vida útil del token              | 1 hora                                                | 1 hora                                             |
| Claim `role`                     | `"admin"`                                             | `"user"`                                           |
| Claim `idUsuario`                | `"admin"` (string literal)                            | Clave primaria numérica de la DB                   |
| Backend contactado durante login | No                                                    | Sí — `POST /api/login`                             |

---

## Admin Authentication Path

El path de admin corre completamente dentro de Next.js y nunca contacta el backend durante el login.

1. El callback `authorize` en `auth.ts` (#47-71) lee `ADMIN_EMAIL` y `ADMIN_PASSWORD` de las variables de entorno en runtime.
2. Tanto el email como la contraseña enviados se comparan usando `timingSafeStringEqual()` (`auth.ts` #5-19), que realiza una comparación XOR byte a byte en tiempo constante para prevenir timing attacks. Esta función usa `TextEncoder` para ser compatible con el Edge Runtime de Next.js.
3. En caso de coincidencia, un JWT es emitido directamente por `auth.ts` usando `SignJWT` de `jose` (`auth.ts` #54-63). El payload contiene `{ idUsuario: "admin", nombre: "Administrador", email: ADMIN_EMAIL, role: "admin" }`, firmado con `JWT_SECRET` usando HS256 con expiración de 1 hora.
4. El objeto user retornado lleva `role: "admin"` y el `accessToken` auto-emitido.

Debido a que el token es emitido por el mismo `JWT_SECRET` usado por el backend Express, es válido para llamadas API al backend, aunque el backend no participó en el login.

---

## Flujo de Autenticación del Usuario Regular

1. El callback `authorize` en `auth.ts` (#73-106) hace una petición `POST` del lado del servidor a `${API_URL}/api/login` con `{ email, password }`.
2. El backend Express en `backend/routes/usuarios.js` consulta la tabla `USUARIOS`, llama a `bcrypt.compare()` contra el hash almacenado y, si es exitoso, emite un JWT via `jwt.sign()`.
3. El backend responde con `{ token, user }`. El `token` es un JWT firmado por el backend con TTL de 1 hora.
4. `auth.ts` retorna un objeto user que contiene `accessToken: data.token` y `role: "user"` a NextAuth.

El `/api/login` del backend está específicamente limitado por `authLimiter` (5 requests por 15 minutos) y usa respuestas de error anti-enumeración — ver **Users API** para detalles.

---

## Callbacks de NextAuth y Forma de la Sesión

Después de que `authorize` retorna un objeto user, dos callbacks propagan el token y el rol a la sesión visible por el cliente.

### `jwt` Callback (`auth.ts` #111-120)

```javascript
token.accessToken  ← user.accessToken  (el string JWT)
token.id           ← user.id
token.name         ← user.name
token.role         ← user.role  ("admin" | "user")
```

### `session` Callback (`auth.ts` #121-131)

```javascript
session.user.id         ← token.id
session.user.name       ← token.name
session.user.role       ← token.role
session.accessToken     ← token.accessToken
```

La estrategia de sesión es `"jwt"` (`auth.ts` #135-137), por lo que NextAuth almacena todos los datos de sesión en una cookie firmada encriptada con `AUTH_SECRET`. No se usa base de datos de sesiones del lado del servidor.

| Campo                       | Ubicación después del login                                        |
| --------------------------- | ------------------------------------------------------------------ |
| `session.accessToken`       | Cookie JWT de NextAuth (encriptada, `AUTH_SECRET`)                 |
| `Cookies.get("auth_token")` | Cookie plana del navegador, expiración de 7 días (via `js-cookie`) |
| `AuthContext.token`         | Estado de React en `AuthProvider`                                  |

---

## AuthContext — Distribución del Token

`AuthProvider` en `app/context/AuthContext.tsx` (#43-120) se suscribe a la sesión NextAuth via `useSession()` y realiza dos funciones:

1. **Cookie mirroring**: Cuando `status === "authenticated"`, lee `session.accessToken` y lo escribe en una cookie del navegador llamada `auth_token` usando `Cookies.set()` (`app/context/AuthContext.tsx` #62). Opciones de cookie: expiración de 7 días, `secure: true` en producción, `sameSite: "strict"`.

2. **`getAuthHeader()`** (`app/context/AuthContext.tsx` #98-103): Retorna `{ Authorization: "Bearer <token>" }` cuando hay un token presente, o `{}` en caso contrario. Todas las páginas que necesitan acceso API autenticado llaman esta función para construir sus headers de fetch.

Al cerrar sesión, `AuthProvider.logout()` (`app/context/AuthContext.tsx` #84-89) limpia tanto el estado de React como la cookie `auth_token` antes de llamar a `nextAuthSignOut()`.

El hook `useAuth` (`app/context/AuthContext.tsx` #122-128) es la forma estándar para que cualquier componente acceda al estado de auth. Lanza un error si se llama fuera de `AuthProvider`.

---

## Verificación del Token en el Backend

Todas las rutas Express protegidas pasan por `backend/middlewares/auth.js`, que llama a `jwt.verify(token, JWT_SECRET)`. Porque tanto el token auto-emitido del admin como el token de usuario emitido por el backend comparten el mismo `JWT_SECRET`, el middleware acepta tokens de cualquier path sin casos especiales.

Existen dos niveles de middleware en el backend:

| Middleware  | Propósito                                 | Aplicado a                               |
| ----------- | ----------------------------------------- | ---------------------------------------- |
| `auth`      | Verifica cualquier JWT válido             | Todas las rutas protegidas para usuarios |
| `adminAuth` | Verifica JWT y chequea `role === "admin"` | Rutas de gestión solo para admin         |
