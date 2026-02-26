# NextAuth Configuration

Esta página documenta la configuración de NextAuth.js definida en `auth.ts` — el punto de entrada para toda la lógica de autenticación en el frontend Next.js. Cubre el único provider `Credentials`, los dos paths de login divergentes dentro de `authorize()`, y los callbacks `jwt`/`session` que propagan el access token y el rol al cliente.

Para cómo el token de sesión resultante se espeja en una cookie del navegador y se pone a disposición de los componentes, ver [Frontend Auth Context](FrontendAuthContext.md). Para cómo se aplica el acceso a rutas autenticadas y no autenticadas, ver [Route Protection](RouteProtection.md).

---

## Descripción General

Toda la autenticación en el frontend se origina desde una única llamada a `NextAuth()` en `auth.ts` #25-139. La configuración usa:

- **Provider:** Solo `Credentials` — sin providers OAuth.
- **Estrategia de sesión:** `jwt` (stateless, sin almacén de sesiones del lado del servidor).
- **Secreto de firma:** Variable de entorno `AUTH_SECRET` (`auth.ts` #138).
- **Página de sign-in personalizada:** `/login` (`auth.ts` #133).

La función `authorize()` dentro del provider decide, en cada intento de login, si validar al usuario localmente (path de admin) o delegar al backend Express (path de usuario).

---

## Dos Paths de Login

La función `authorize()` implementa un fork basado en si el email enviado coincide con `ADMIN_EMAIL` del entorno.

**Punto de decisión:**

```javascript
credentials.email === process.env.ADMIN_EMAIL ?
→ path de admin (self-contained en Next.js)
→ path de usuario (delega al backend Express)
```

Ambos paths resuelven a la misma forma de retorno: `{ id, name, email, accessToken, role }`, que NextAuth luego almacena en el JWT.

### Path de Login Admin

| Detalle                  | Valor                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| Fuente de credenciales   | `process.env.ADMIN_EMAIL`, `process.env.ADMIN_PASSWORD`              |
| Método de comparación    | `timingSafeStringEqual()` — timing-safe, compatible con Edge Runtime |
| Librería de tokens       | `jose` (`SignJWT`)                                                   |
| Algoritmo                | `HS256`                                                              |
| Clave de firma del token | `process.env.JWT_SECRET` (codificado via `TextEncoder`)              |
| TTL del token            | 1 hora                                                               |
| Claims                   | `idUsuario: "admin"`, `nombre`, `email`, `role: "admin"`             |
| Contacto al backend      | Ninguno                                                              |

La función `timingSafeStringEqual()` (`auth.ts` #5-19) es una comparación byte a byte timing-safe usando `TextEncoder`. Retorna `false` inmediatamente si las longitudes en bytes difieren; de lo contrario hace XOR de todos los bytes y verifica que el resultado sea cero — previniendo timing oracle attacks sobre la contraseña admin.

### Path de Login de Usuario Regular

| Detalle            | Valor                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| Endpoint destino   | `${API_URL}/api/login` (`NEXT_PUBLIC_API_URL` o fallback hardcodeado) |
| Cuerpo del request | `{ email, password }`                                                 |
| Emisor del token   | Backend `Express` (via `jsonwebtoken`)                                |
| Rol asignado       | `"user"` (hardcodeado en `auth.ts`, no retornado por el backend)      |
| Si respuesta no-OK | Retorna `null` (login falla)                                          |
| Si error de red    | Captura la excepción, la registra, retorna `null`                     |

`API_URL` se establece en tiempo de carga del módulo desde `process.env.NEXT_PUBLIC_API_URL` con un fallback hardcodeado (`auth.ts` #22-23).

---

## Callbacks JWT y de Sesión

Después de que `authorize()` retorna un objeto user, NextAuth ejecuta dos callbacks en secuencia en cada petición que involucra la sesión.

### Callback `jwt`

> `auth.ts` #111-119

Se llama cada vez que el JWT es creado o refrescado. Cuando un objeto `user` está presente (es decir, en el primer sign-in), copia `accessToken`, `id`, `name` y `role` del `user` al token JWT. En peticiones subsecuentes, `user` es `undefined` y el token se pasa sin cambios.

### Callback `session`

Se llama cada vez que `useSession()` o `getServerSession()` es invocado. Copia campos del `token` JWT al objeto `session` que se expone al cliente:

| Campo de sesión       | Fuente                              |
| --------------------- | ----------------------------------- |
| `session.user.id`     | `token.id`                          |
| `session.user.name`   | `token.name`                        |
| `session.user.role`   | `token.role` (`"admin"` o `"user"`) |
| `session.accessToken` | `token.accessToken`                 |

---

## Augmentación de Tipos TypeScript

Los tipos en `types/next-auth.d.ts` #1-31 extienden las interfaces built-in de NextAuth para incluir los campos personalizados usados en toda la aplicación:

| Interfaz  | Campos agregados                                                               |
| --------- | ------------------------------------------------------------------------------ |
| `User`    | `accessToken: string`, `role: "admin" \| "user"`                               |
| `Session` | `accessToken: string`; `user.id`, `user.role`                                  |
| `JWT`     | `accessToken: string`, `id: string`, `name: string`, `role: "admin" \| "user"` |

Sin estas declaraciones, TypeScript no reconocería `session.accessToken` o `session.user.role` como propiedades válidas.

---

## Exports

`auth.ts` #25 desestructura y re-exporta cuatro valores nombrados de la llamada a `NextAuth()`:

| Export     | Uso                                                                                  |
| ---------- | ------------------------------------------------------------------------------------ |
| `handlers` | Montado en `app/api/auth/[...nextauth]/route.ts` para manejar rutas HTTP de NextAuth |
| `signIn`   | Acción de sign-in del lado del servidor                                              |
| `signOut`  | Acción de sign-out del lado del servidor                                             |
| `auth`     | Acceso a sesión del lado del servidor (RSC / middleware)                             |

La página de login (`app/login/page.tsx` #45) usa el `signIn("credentials", { email, password, redirect: false })` del lado del cliente desde `next-auth/react`, no el `signIn` exportado — el exportado es para server actions.

---

## Resumen de Configuración

| Opción                  | Valor                                                      |
| ----------------------- | ---------------------------------------------------------- |
| Provider                | `Credentials`                                              |
| Estrategia de sesión    | `jwt`                                                      |
| Secreto de firma        | `process.env.AUTH_SECRET`                                  |
| Página de sign-in       | `"/login"`                                                 |
| Emisor de token admin   | `jose` (`SignJWT`, `HS256`, firmado con `JWT_SECRET`)      |
| Emisor de token usuario | Backend Express (`jsonwebtoken`, firmado con `JWT_SECRET`) |
| TTL del token (admin)   | 1 hora (establecido en `SignJWT.setExpirationTime`)        |
| TTL del token (usuario) | Establecido por el backend (ver **Users API**)             |
