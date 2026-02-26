# Frontend Auth Context

`AuthContext` es la capa del lado del cliente que se ubica entre la sesión NextAuth y el resto del árbol de componentes React. Lee el JWT que NextAuth almacena en su sesión gestionada por el servidor, lo espeja en una cookie del navegador para disponibilidad del lado del cliente, y provee una interfaz uniforme (`getAuthHeader`, `updateUser`, etc.) para llamadas API autenticadas.

Esta página cubre la implementación en `app/context/AuthContext.tsx`. Para la fuente upstream del token — cómo se emiten los JWTs de admin vs. usuario y se almacenan en la sesión NextAuth — ver [NextAuth Configuration](NextAuthConfiguration.md). Para el guard de acceso a nivel de ruta que corre antes de que cualquier componente se monte, ver [Route Protection](RouteProtection.md).

---

## Responsabilidades

`AuthContext` tiene cuatro trabajos distintos:

| Responsabilidad                                     | Mecanismo                                                 |
| --------------------------------------------------- | --------------------------------------------------------- |
| Sincronizar estado de usuario desde sesión NextAuth | `useSession()` → `setUser()` / `setToken()`               |
| Persistir el JWT para uso del lado del cliente      | `Cookies.set("auth_token", ...)` via `js-cookie`          |
| Proveer headers de fetch autenticados               | `getAuthHeader()` → `{ Authorization: "Bearer <token>" }` |
| Permitir actualizaciones de perfil en-lugar         | `updateUser(partial)` mergea en el estado user            |

---

## Forma del Contexto

La interfaz `AuthContextType` (`app/context/AuthContext.tsx` #29-39) define lo que recibe cada consumer:

| Campo             | Tipo                               | Descripción                                                          |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `user`            | `User \| null`                     | Poblado desde `session.user` después de autenticación                |
| `token`           | `string \| null`                   | El string JWT crudo                                                  |
| `isAuthenticated` | `boolean`                          | `true` solo cuando tanto `user` como `token` son no-nulos            |
| `isLoading`       | `boolean`                          | `true` mientras NextAuth resuelve la sesión (`status === "loading"`) |
| `isAdmin`         | `boolean`                          | `true` cuando `user.role === "admin"`                                |
| `login`           | `(token, user) => void`            | Login imperativo (establece estado + cookie)                         |
| `logout`          | `() => Promise<void>`              | Limpia estado, cookie, y llama a `nextAuthSignOut`                   |
| `getAuthHeader`   | `() => Record<string, string>`     | Retorna el objeto del header `Authorization`                         |
| `updateUser`      | `(partial: Partial<User>) => void` | Mergea datos parciales en el usuario actual                          |

La interfaz `User` (`app/context/AuthContext.tsx` #21-27) contiene: `id`, `nombre`, `email`, `telefono`, y `role` (`"admin" | "user"`).

---

## Flujo de Datos: Sesión → Cookie → Llamada API

**Fuentes:** `app/context/AuthContext.tsx` #48-76

---

## Sincronización de Sesión

`AuthProvider` usa dos hooks `useEffect`:

**Primary sync** (`app/context/AuthContext.tsx` #48-69): Observa `session` y `status`. Cuando `status === "authenticated"`, construye un objeto `User` desde `session.user`, establece el token desde `session.accessToken`, y escribe el token en la cookie `"auth_token"`. Cuando `status === "unauthenticated"`, limpia el usuario, el token y elimina la cookie.

**Cookie bootstrap** (`app/context/AuthContext.tsx` #71-76): Un efecto secundario lee `Cookies.get(TOKEN_COOKIE_NAME)` en caso de que una cookie ya esté presente pero el estado token sea nulo. Esto maneja casos edge como un componente que se monta antes de que el efecto primario se ejecute.

---

## Cookie Configuration

La cookie se establece con las siguientes opciones (`app/context/AuthContext.tsx` #15-19):

| Opción        | Valor                | Notas                                                           |
| ------------- | -------------------- | --------------------------------------------------------------- |
| Nombre cookie | `auth_token`         | Constante `TOKEN_COOKIE_NAME`                                   |
| `expires`     | 7 días               | Duración de la cookie, independiente de la expiración del JWT   |
| `secure`      | `true` en producción | Solo se establece sobre HTTPS                                   |
| `sameSite`    | `"strict"`           | Protección CSRF; la cookie no se envía en peticiones cross-site |

> **Nota:** El JWT en sí lleva una expiración de 1 hora (claim `exp` establecido por el backend o por `jose` para tokens admin). La duración de 7 días de la cookie significa que la cookie persiste más tiempo que la validez del JWT. La sesión NextAuth gestiona la validez real de la sesión; la cookie es una conveniencia del lado del cliente para acceso sincrónico al token.

---

## Funciones en Detalle

### `getAuthHeader()`

`app/context/AuthContext.tsx` #98-103

Retorna `{ Authorization: "Bearer <token>" }` si hay un token presente, o un objeto vacío `{}` si no. Este es el patrón estándar usado en cada llamada `fetch` autenticada en todo el frontend. Los componentes consumer lo extienden en la opción `headers`:

```javascript
const headers = getAuthHeader();
fetch(`${API_URL}/api/...`, {
  headers: { ...headers, "Content-Type": "application/json" },
});
```

### `updateUser(userData)`

`app/context/AuthContext.tsx` #91-96

Toma un `Partial<User>` y lo mergea en el estado user existente usando `setUser` funcional. Esto es usado por `PerfilPage` después de una llamada exitosa `PUT /api/usuarios/me` para actualizar `nombre` y `telefono` en la UI sin forzar una recarga de sesión. (`app/perfil/page.tsx` #141-144)

### `login(token, user)`

`app/context/AuthContext.tsx` #78-82

Establece directamente el estado de `token` y `user` y escribe la cookie. Es un escape hatch imperativo; en el flujo de auth normal, la sincronización de sesión via `useSession()` maneja la población del estado y esta función no se llama.

### `logout()`

`app/context/AuthContext.tsx` #84-89

1. Limpia el estado de `user` y `token`.
2. Llama a `Cookies.remove(TOKEN_COOKIE_NAME)`.
3. Llama a `nextAuthSignOut({ callbackUrl: "/login" })` para terminar la sesión NextAuth y redirigir.

---

## Integración con el Árbol de Providers

`AuthProvider` se monta dentro del application shell como hijo del `SessionProvider` de NextAuth. Este orden es requerido porque `AuthProvider` llama a `useSession()` internamente, que depende de que `SessionProvider` esté presente en el árbol. Ver **Application Shell** para el orden exacto de wrapping.

El hook `useAuth` (`app/context/AuthContext.tsx` #122-128) lanza un error si se llama fuera de `AuthProvider`, lo que hace que los árboles de componentes mal configurados fallen ruidosamente durante el desarrollo.
