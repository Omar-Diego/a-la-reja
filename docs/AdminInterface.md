# Admin Interface

Esta página documenta la sección de administración del frontend de **A La Reja**: el `AdminDashboardPage`, el componente de layout `AdminNavBar`, y las tres sub-páginas de gestión de reservaciones, usuarios y canchas. El control de acceso es manejado por `middleware.ts`; para más detalles sobre cómo se emite el JWT de admin y cómo el rol llega a la sesión, ver [Authentication](Authentication.md) y [NextAuth Configuration](NextAuthConfiguration.md). Para los endpoints del backend que consumen las páginas de admin, ver [Backend API](BackendAPI.md).

---

## Estructura de Rutas

Todas las rutas de admin viven bajo el prefijo `/admin`. `middleware.ts` aplica dos reglas para este prefijo (`middleware.ts` #24-59):

| Estado del visitante            | Resultado                              |
| ------------------------------- | -------------------------------------- |
| No autenticado                  | Redirige a `/login?callbackUrl=<path>` |
| Autenticado, `role !== "admin"` | Redirige a `/dashboard`                |
| Autenticado, `role === "admin"` | Permite el acceso                      |

Un admin autenticado que visita `/` o cualquier ruta protegida normal (e.g. `/dashboard`) también es redirigido de vuelta a `/admin` (`middleware.ts` #33-39).

**Admin route map:**

> **Fuentes:** `middleware.ts` #4-60, `app/components/layout/AdminNavBar.tsx` #14-23

---

## AdminNavBar

`AdminNavBar` está definido en `app/components/layout/AdminNavBar.tsx` y se renderiza como un header sticky superior compartido en todas las páginas `/admin/*`.

### Elementos de Navegación

El array `navItems` (`app/components/layout/AdminNavBar.tsx` #14-23) define los cuatro links:

| `href`                 | Label         | Icon             |
| ---------------------- | ------------- | ---------------- |
| `/admin`               | Inicio        | `grid_view`      |
| `/admin/reservaciones` | Reservaciones | `calendar_month` |
| `/admin/usuarios`      | Usuarios      | `group`          |
| `/admin/canchas`       | Canchas       | `sports_tennis`  |

### Lógica de Estado Activo

El resaltado activo usa `usePathname()`. Un link se marca como activo si:

- `pathname === item.href` (coincidencia exacta), o
- `item.href !== "/admin"` y `pathname.startsWith(item.href)` (coincidencia por prefijo para sub-rutas)

El link raíz `/admin` usa solo coincidencia exacta para evitar estar perpetuamente activo (`app/components/layout/AdminNavBar.tsx` #47-49).

### Menú de Usuario y Cierre de Sesión

Un dropdown disparado al hacer clic en el ícono de persona expone la función `logout()` de `useAuth()`. El nombre mostrado es `user?.nombre || "Admin"` (`app/components/layout/AdminNavBar.tsx` #82-103).

> **Fuentes:** `app/components/layout/AdminNavBar.tsx` #1-108

---

## AdminDashboardPage

`AdminDashboardPage` está definido en `app/admin/page.tsx`. Es un componente cliente (`"use client"`) que obtiene todos los datos al montarse y renderiza cuatro secciones de UI diferenciadas.

### Obtención de Datos

Al montarse (cuando el token está disponible), `fetchAdminData()` lanza tres peticiones paralelas usando `Promise.all` (`app/admin/page.tsx` #81-85):

| Petición                     | Endpoint                 | Propósito                            |
| ---------------------------- | ------------------------ | ------------------------------------ |
| `fetch(…/api/usuarios)`      | `GET /api/usuarios`      | Total de usuarios                    |
| `fetch(…/api/reservaciones)` | `GET /api/reservaciones` | Todas las reservaciones (sin filtro) |
| `fetch(…/api/canchas)`       | `GET /api/canchas`       | Conteo de canchas activas            |

Las tres peticiones incluyen `getAuthHeader()` de `useAuth()`, que provee el header `Authorization: Bearer <token>`. La llamada sin filtro a `GET /api/reservaciones` requiere un token de admin en el backend; ver **Reservations API**.

Los datos obtenidos alimentan todo el estado computado: `stats`, `allReservaciones`, `latestReservaciones`, y `reservacionesPorCancha`.

> **Fuentes:** `app/admin/page.tsx` #69-192

### Tarjetas de Estadísticas

Se renderizan seis stat cards usando valores derivados de los datos obtenidos (`app/admin/page.tsx` #398-458):

| Campo                 | Derivación                                                                       |
| --------------------- | -------------------------------------------------------------------------------- |
| `ingresosMes`         | Suma de `r.precio` para todas las reservaciones donde `r.fecha >= monthStartStr` |
| `reservacionesHoy`    | Conteo donde `r.fecha === today`                                                 |
| `reservacionesSemana` | Conteo donde `r.fecha >= weekStartStr` (domingo como inicio)                     |
| `totalUsuarios`       | `usuariosArray.length`                                                           |
| `totalReservaciones`  | `reservacionesArray.length`                                                      |
| `canchasActivas`      | `canchasArray.length`                                                            |

Todas las comparaciones de fecha usan comparación de strings ISO 8601 (el orden lexicográfico funciona porque las fechas tienen relleno de ceros `YYYY-MM-DD`).

> **Fuentes:** `app/admin/page.tsx` #124-168

### Calendario de Reservaciones

El calendario es una grilla mensual interactiva construida a partir del array memoizado `calendarDays` (`app/admin/page.tsx` #195-264).

**Lógica de construcción:**

1. Calcula el offset del día de la semana del primer día para rellenar con días del mes anterior.
2. Completa los días del mes actual; para cada uno, filtra `allReservaciones` por `r.fecha === dateStr`.
3. Rellena hasta 42 celdas (grilla de 6 × 7) con días del mes siguiente.

**Interacción:**

- Hacer clic en un día del mes actual establece el estado `selectedDate`.
- Hacer clic en el mismo día nuevamente lo limpia (`isSelected ? null : dayInfo.dateStr`).
- Un panel lateral aparece cuando `selectedDate` no es nulo, listando las reservaciones de ese día ordenadas por `hora_inicio` (`app/admin/page.tsx` #267-272).
- La navegación de mes es manejada por `handlePrevMonth` / `handleNextMonth` (`app/admin/page.tsx` #306-316).

**Indicadores de color:**

- Cada celda de día con reservaciones muestra hasta tres puntos de colores — uno por cancha única — usando `CANCHA_COLORS` (`app/admin/page.tsx` #34-45).
- También se muestra un badge con el conteo (`app/admin/page.tsx` #546-550).

#### Mapeo de CANCHA_COLORS

El helper `getCanchaColor(canchaName)` consulta este mapa y cae en gris como fallback (`app/admin/page.tsx` #43-45). Los mismos colores aparecen en la leyenda del calendario, los indicadores de puntos y el borde izquierdo del panel de fecha seleccionada.

> **Fuentes:** `app/admin/page.tsx` #34-45, `app/admin/page.tsx` #195-614

### Últimas Transacciones

Muestra el top 3 de las 5 `latestReservaciones` calculadas más recientemente. El ordenamiento coloca las reservaciones próximas (donde `r.fecha >= today`) antes que las pasadas, luego ordena por fecha descendente (`app/admin/page.tsx` #171-178).

Cada fila muestra:

- `reservacion.usuario` (nombre)
- `reservacion.cancha`
- Fecha formateada y `hora_inicio`
- `reservacion.precio` (el campo `monto` del backend, con alias `precio`)
- Badge **"Próxima"** / **"Completada"**

Un link **"Ver todas"** navega a `/admin/reservaciones` (`app/admin/page.tsx` #624-629).

> **Fuentes:** `app/admin/page.tsx` #619-683

### Estadísticas por Cancha

Renderiza un gráfico de barras horizontal construido a partir del array `reservacionesPorCancha`. El ancho de cada barra es `(item.total / maxTotal) * 100%`, usando el máximo entre todas las canchas como referencia del 100% (`app/admin/page.tsx` #700-726).

> **Fuentes:** `app/admin/page.tsx` #685-728

### Resumen de Componentes y Estado

> **Fuentes:** `app/admin/page.tsx` #47-733, `app/components/layout/AdminNavBar.tsx` #1-108

---

## Sub-páginas

`AdminNavBar` enlaza a tres sub-páginas de gestión. Sus puntos de entrada son:

| Ruta                   | Propósito                                           |
| ---------------------- | --------------------------------------------------- |
| `/admin/reservaciones` | Ver y gestionar todas las reservaciones del sistema |
| `/admin/usuarios`      | Ver, editar y eliminar usuarios registrados         |
| `/admin/canchas`       | Ver, crear, editar y eliminar canchas               |

Estas páginas usan el mismo patrón `getAuthHeader()` para autenticar peticiones al backend. Para los endpoints del backend que consumen, ver **Reservations API**, **Users API** y **Courts API**.
