# User Profile

Esta página documenta la ruta `/perfil` y su componente `PerfilPage`, cubriendo el fetching de datos, el flujo de edición de perfil inline, estadísticas de reservaciones y la visualización de actividad reciente. Para documentación de los endpoints del backend que proveen estos datos, ver [Users API](UsersAPI.md). Para cómo el token de auth se pone disponible para peticiones autenticadas, ver [Frontend Auth Context](FrontendAuthContext.md).

---

## Descripción General

`PerfilPage` (`app/perfil/page.tsx` #31-434) es un componente cliente protegido que sirve como página de auto-servicio de perfil del usuario. Al montarse, dispara tres peticiones autenticadas paralelas para poblar tres secciones distintas de la UI:

| Sección                       | Endpoint de API                 | Variable de estado |
| ----------------------------- | ------------------------------- | ------------------ |
| Info personal                 | `GET /api/usuarios/me`          | `profile`          |
| Estadísticas de reservaciones | `GET /api/usuarios/me/stats`    | `stats`            |
| Actividad reciente            | `GET /api/usuarios/me/activity` | `activity`         |

La autenticación se maneja completamente a través de `useAuth()` de `AuthContext`. La función `getAuthHeader()` retorna el header `Authorization: Bearer <token>`, que se adjunta a cada petición. Si no hay token presente, el fetching de datos se omite y `dataLoading` se establece en `false` inmediatamente.

**Fuentes:** `app/perfil/page.tsx` #47-104

---

## Estado Local

`PerfilPage` mantiene las siguientes variables `useState`:

| Variable       | Tipo                  | Propósito                                                  |
| -------------- | --------------------- | ---------------------------------------------------------- |
| `profile`      | `UserProfile \| null` | Datos de perfil obtenidos (fuente de verdad para display)  |
| `stats`        | `UserStats`           | Totales de reservaciones                                   |
| `activity`     | `ActivityItem[]`      | Reservaciones recientes para el feed de actividad          |
| `dataLoading`  | `boolean`             | Controla el spinner de carga                               |
| `isEditing`    | `boolean`             | Alterna entre modo vista y edición en la tarjeta de perfil |
| `editNombre`   | `string`              | Valor de input controlado para nombre durante edición      |
| `editTelefono` | `string`              | Valor de input controlado para teléfono durante edición    |
| `saving`       | `boolean`             | Deshabilita el botón guardar durante la petición PUT       |
| `saveError`    | `string \| null`      | Mensaje de error inline debajo del formulario              |
| `fetchError`   | `string \| null`      | Banner mostrado si el fetch inicial del perfil falla       |

**Fuentes:** `app/perfil/page.tsx` #34-46

---

## Definiciones de Tipos

Tres interfaces locales describen las formas de datos recibidos de la API:

- `UserProfile { idUsuario, nombre, email, telefono }`
- `UserStats { total, completed, upcoming }`
- `ActivityItem { idReservacion, fecha, hora_inicio, hora_fin, cancha, status }`

(`app/perfil/page.tsx` #9-29)

El campo `status` en `ActivityItem` es una unión discriminada `"upcoming" | "completed"`, usado para aplicar estilo condicional a los badges de estado en el feed de actividad.

---

## Flujo de Edición de Perfil

**Fuentes:** `app/perfil/page.tsx` #106-155

### Detalles del Comportamiento de Edición

**Entrando al modo edición (`handleEditClick`):** Copia el `profile.nombre` actual (fallback a `user.nombre` de la sesión) y `profile.telefono` en los inputs controlados. Limpia cualquier `saveError` previo.

**Cancelando (`handleCancelEdit`):** Establece `isEditing` en `false` y limpia `saveError`. No se hace ninguna llamada API.

**Guardando (`handleSaveProfile`):** Emite un `PUT /api/usuarios/me` con el body `{ nombre: editNombre.trim(), telefono: editTelefono.trim() || null }`. En caso de éxito, tanto el estado del componente local (`setProfile`) como el objeto `user` global de `AuthContext` (`updateUser`) se actualizan.

El campo de email siempre se renderiza como **solo lectura**. La UI renderiza el hint: `"El email no se puede modificar"` (`app/perfil/page.tsx` #300-302).

### Validación del Lado del Cliente

La página **no realiza validación client-side explícita** antes de enviar la petición PUT (sin chequeos de regex, sin enforcing de longitud). Se aplica trimming a ambos campos (`editNombre.trim()`, `editTelefono.trim()`), y un string de teléfono vacío se convierte a `null` antes de la submission. Los errores de validación del backend se exponen via `saveError`.

### Integración con AuthContext

Después de un guardado exitoso, `PerfilPage` llama a `updateUser()` del hook `useAuth()` (`app/perfil/page.tsx` #141-144). Esto parchea el objeto `User` en memoria dentro de `AuthProvider` sin invalidar el token de sesión, de modo que el nombre actualizado se refleja globalmente (e.g., en el header) sin requerir cerrar sesión.

```javascript
updateUser({ nombre: data.user.nombre, telefono: data.user.telefono });
```

La implementación de `updateUser` mergea un objeto `User` parcial en el estado existente usando un updater funcional (`app/context/AuthContext.tsx` #91-96).

---

## Sección de Estadísticas

La tarjeta de stats renderiza cuatro contadores numéricos poblados de `GET /api/usuarios/me/stats`:

| Etiqueta del contador | Campo fuente                                    |
| --------------------- | ----------------------------------------------- |
| Reservas Totales      | `stats.total`                                   |
| Completadas           | `stats.completed`                               |
| Proximas              | `stats.upcoming`                                |
| Partidos Jugados      | `stats.completed` (mismo valor que Completadas) |

El tile "Proximas" usa un fondo distinto (`bg-[#dcfce7]`) mientras los otros usan un fondo neutro, proporcionando énfasis visual en las reservaciones próximas.

**Fuentes:** `app/perfil/page.tsx` #346-378

---

## Sección de Actividad Reciente

Cada `ActivityItem` en el feed de actividad muestra:

- Nombre de cancha (`item.cancha`)
- Fecha formateada via `formatShortDate(item.fecha)` de `app/lib/types`
- Hora de inicio (`item.hora_inicio.substring(0, 5)` — quita segundos de HH:MM:SS)
- Badge de estado: `"Confirmada"` (fondo amarillo/primary) para upcoming, `"Completada"` (gris) para completed

Si el array `activity` está vacío, se muestra un placeholder con ícono `event_busy`.

**Fuentes:** `app/perfil/page.tsx` #392-428

---

## Avatar

La imagen de avatar se genera dinámicamente del servicio externo `ui-avatars.com` usando el `nombre` del usuario como seed (`app/perfil/page.tsx` #244-252). Se renderiza como una imagen circular de 80×80 píxeles via el componente `Image` de Next.js.

---

## Manejo de Errores

Existen dos estados de error distintos:

| Variable de estado | Cuándo se establece            | Dónde se muestra                                                 |
| ------------------ | ------------------------------ | ---------------------------------------------------------------- |
| `fetchError`       | El GET inicial de perfil falla | Banner de advertencia ámbar en la parte superior de la página    |
| `saveError`        | El PUT retorna non-2xx         | Banner rojo inline dentro del formulario de la tarjeta de perfil |

Una excepción a nivel de red (e.g., servidor inalcanzable) establece `fetchError` en un mensaje genérico en español `"Error de conexion al servidor"` (`app/perfil/page.tsx` #97) o `saveError` en `"Error de conexion. Intente de nuevo."` (`app/perfil/page.tsx` #151).

---

## Nota de Base de Datos

La columna `telefono` en la tabla `USUARIOS` fue agregada via `migrations/003_add_telefono.sql` (#1-24). Está definida como `VARCHAR(20) DEFAULT NULL`, razón por la que el tipo `UserProfile.telefono` es `string | null` y los inputs vacíos se convierten a `null` antes de la submission.

Para el schema completo, ver **Schema**. Para la secuencia de migraciones, ver **Migrations**.
