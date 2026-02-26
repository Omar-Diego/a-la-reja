# User Dashboard & My Reservations

Esta página documenta las dos páginas principales post-login para usuarios regulares: `DashboardPage` (`/dashboard`) y `MisReservasPage` (`/mis_reservas`). También cubre los tipos de utilidad compartidos y las funciones en `app/lib/types.ts` de las que ambas páginas dependen.

Para el flujo de booking al que los usuarios navegan desde estas páginas, ver [Court Reservation Flow](CourtReservationFlow.md). Para la página de perfil de usuario, ver [User Profile](UserProfile.md). Para la protección de rutas que asegura que estas páginas solo son accesibles a usuarios autenticados, ver [Route Protection](RouteProtection.md).

---

## Tipos y Utilidades Compartidos (`app/lib/types.ts`)

Ambas páginas comparten una interfaz `Reservation` común y un conjunto de funciones de utilidad puras definidas en `app/lib/types.ts`.

### Interfaz Reservation

`app/lib/types.ts` #8-15

| Campo           | Tipo                  | Descripción                                |
| --------------- | --------------------- | ------------------------------------------ |
| `idReservacion` | `number`              | Clave primaria de la tabla `RESERVACIONES` |
| `fecha`         | `string`              | String de fecha ISO (YYYY-MM-DD)           |
| `hora_inicio`   | `string`              | Hora de inicio (HH:MM:SS de MySQL)         |
| `hora_fin`      | `string`              | Hora de fin (HH:MM:SS de MySQL)            |
| `cancha`        | `string`              | Nombre de cancha (unido de `CANCHAS`)      |
| `ubicacion`     | `string \| undefined` | Ubicación opcional de la cancha            |

### Funciones de Utilidad de Fechas

`app/lib/types.ts` #41-105

| Función             | Firma                                 | Retorna                | Notas                                                            |
| ------------------- | ------------------------------------- | ---------------------- | ---------------------------------------------------------------- |
| `parseDateString`   | `(dateStr: string \| Date) => string` | YYYY-MM-DD string      | Quita el componente de tiempo de strings ISO o datetime de MySQL |
| `formatDateDisplay` | `(dateStr: string \| Date) => string` | String de locale largo | Locale `es-ES`; ejemplo: "lunes, 3 de junio de 2024"             |
| `formatShortDate`   | `(dateStr: string \| Date) => string` | String de locale corto | Locale `es-ES`; ejemplo: "lun, 3 jun"                            |
| `formatDateToISO`   | `(date: Date) => string`              | YYYY-MM-DD string      | Seguro con timezone local; evita problemas de offset UTC         |

Tanto `formatDateDisplay` como `formatShortDate` adjuntan `T12:00:00` al string de fecha normalizado antes de construir un objeto `Date`. Esto previene errores off-by-one de días causados por la interpretación de medianoche UTC.

### Predicado de Estado de Reservación

`app/lib/types.ts` #137-146

`isReservationUpcoming(fecha)` es el predicado clave usado por ambas páginas para particionar reservaciones. Compara la fecha de la reservación (a las 23:59:59) contra el inicio del día de hoy, por lo que una reservación del día actual aún se cuenta como upcoming.

**Fuentes:** `app/lib/types.ts` #1-156

---

## Página del Dashboard (`/dashboard`)

`DashboardPage` es la página de aterrizaje después de que un usuario regular inicia sesión. Hace dos llamadas API independientes al montarse y renderiza los resultados lado a lado.

### Obtención de Datos

`app/dashboard/page.tsx` #41-84

- `GET /api/reservaciones/usuario` requiere un token Bearer. Si `getAuthHeader()` no retorna una clave `Authorization`, el fetch se omite.
- `GET /api/canchas/top` es un endpoint público; retorna las 3 mejores canchas por conteo total de reservaciones (ver **Courts API**).
- Las reservaciones próximas se filtran con `isReservationUpcoming()` y luego se limitan a 3 entradas via `.slice(0, 3)`.

### Interfaz Court Local

`app/dashboard/page.tsx` #14-20

`DashboardPage` define su propia interfaz `Court` local que agrega un campo `totalReservaciones` sobre el `Court` base de `app/lib/types.ts`. Esta es la forma retornada por `/api/canchas/top`.

### `generateSlug` Function

`app/dashboard/page.tsx` #23-30

Cada tarjeta de cancha top enlaza a `/reservar/<slug>`. El slug se genera desde el nombre de la cancha lowercasingando, quitando diacríticos (normalización NFD) y reemplazando espacios y caracteres no-alfanuméricos con guiones. Esto refleja la búsqueda de canchas basada en slug usada en el flujo de booking.

### Accesos Directos de Navegación

`app/dashboard/page.tsx` #109-148

La sección hero renderiza tres tarjetas de acceso rápido:

| Tarjeta      | `href`          | Variante                            |
| ------------ | --------------- | ----------------------------------- |
| Reservar     | `/reservar`     | Primary (fondo resaltado)           |
| Mis Reservas | `/mis_reservas` | Secondary (blanco, hover a primary) |
| Perfil       | `/perfil`       | Secondary (blanco, hover a primary) |

### Layout

El área de contenido usa un layout de dos columnas en breakpoints `lg`:

- **Columna izquierda:** "PROXIMAS RESERVAS" — hasta 3 reservaciones próximas, cada tarjeta mostrando `hora_inicio` (recortada a 5 chars), nombre de cancha y `formatShortDate(fecha)`.
- **Columna derecha:** "CANCHAS MÁS POPULARES" — hasta 3 mejores canchas de `/api/canchas/top`, cada tarjeta mostrando una miniatura, nombre, `precio_por_hora` y un badge "Available". Cada cancha enlaza a su página de booking via `generateSlug`.

Se renderiza una UI de estado vacío cuando cualquiera de las listas retorna cero items.

**Fuentes:** `app/dashboard/page.tsx` #1-283, `app/lib/types.ts` #8-15, #88-105, #137-146

---

## Página Mis Reservas (`/mis_reservas`)

`MisReservasPage` provee una vista completa de todas las reservaciones del usuario autenticado, divididas en categorías próximas y pasadas, con la capacidad de cancelar las próximas.

### Estructura del Componente

`app/mis_reservas/page.tsx` #319-331

El export de página envuelve `MisReservasContent` en un boundary `Suspense`. Esto es requerido porque `MisReservasContent` llama a `useSearchParams()`, que suspende durante SSR.

```
MisReservasPage (export default)
└── Suspense (fallback: spinner)
    └── MisReservasContent (usa useSearchParams)
```

### Variables de Estado

`app/mis_reservas/page.tsx` #15-19

| Estado                | Tipo             | Propósito                                         |
| --------------------- | ---------------- | ------------------------------------------------- |
| `reservations`        | `Reservation[]`  | Lista completa de `/api/reservaciones/usuario`    |
| `reservationsLoading` | `boolean`        | Indicador de carga                                |
| `error`               | `string \| null` | Mensaje de error del fetch                        |
| `showSuccess`         | `boolean`        | Banner de éxito después de redirección            |
| `cancellingId`        | `number \| null` | ID de la reservación actualmente siendo eliminada |

### Banner de Éxito

`app/mis_reservas/page.tsx` #21-27

Al montarse, el componente lee el parámetro de query `success=true`. Este parámetro es establecido por `ConfirmarReservaPage` después de un booking exitoso (ver **Court Reservation Flow**). Si está presente, `showSuccess` se establece en `true`, la URL se limpia con `window.history.replaceState`, y el banner se auto-descarta después de 5 segundos.

### Categorización de Reservaciones

`app/mis_reservas/page.tsx` #104-109

Después del fetch, todas las reservaciones se particionan en un solo pase usando `isReservationUpcoming()`:

```javascript
upcomingReservations = reservations.filter((r) =>
  isReservationUpcoming(r.fecha),
);
pastReservations = reservations.filter((r) => !isReservationUpcoming(r.fecha));
```

Ambos arrays derivados se computan directamente del estado `reservations` — no hay un fetch separado para datos históricos.

### Flujo de Cancelación

`app/mis_reservas/page.tsx` #61-94

El botón de eliminar se reemplaza con un ícono de `sync` giratorio mientras `cancellingId` coincide con el `idReservacion` de la reservación. En caso de éxito, la reservación se elimina del estado local sin un re-fetch. El backend aplica la eliminación solo-propietario — ver **Reservations API** para la aplicación del lado del servidor.

### Diferencias de Visualización: Próximas vs. Pasadas

| Aspecto         | Próximas                                   | Pasadas (Historial)                 |
| --------------- | ------------------------------------------ | ----------------------------------- |
| Background icon | Caja con color secondary con `hora_inicio` | Caja gris con ícono `location_on`   |
| Date format     | `formatDateDisplay()` (formato largo)      | `formatShortDate()` (formato corto) |
| Status badge    | Badge verde "Confirmada"                   | Texto gris "Completada"             |
| Cancel button   | Mostrado                                   | No mostrado                         |
| Opacity         | 100%                                       | 70% (`opacity-70`)                  |

### Aviso de Política de Pago

`app/mis_reservas/page.tsx` #147-162

Se renderiza una caja informativa estática debajo del header. Indica que los cargos se procesan 24 horas antes del partido y que las cancelaciones con más de 24 horas de anticipación reciben un reembolso del 50%. **Este es un aviso solo de UI; no se ha implementado ningún procesamiento de pagos actualmente en el codebase** (la integración de pagos está pendiente).

---

## Endpoints de API Usados

| Página       | Método   | Endpoint                     | Auth Requerida | Propósito                                          |
| ------------ | -------- | ---------------------------- | -------------- | -------------------------------------------------- |
| Dashboard    | `GET`    | `/api/reservaciones/usuario` | Sí (Bearer)    | Obtener reservaciones del usuario actual           |
| Dashboard    | `GET`    | `/api/canchas/top`           | No             | Obtener top 3 canchas por conteo de reservaciones  |
| Mis Reservas | `GET`    | `/api/reservaciones/usuario` | Sí (Bearer)    | Obtener todas las reservaciones del usuario actual |
| Mis Reservas | `DELETE` | `/api/reservaciones/:id`     | Sí (Bearer)    | Cancelar una reservación específica                |

**Fuentes:** `app/mis_reservas/page.tsx` #1-331, `app/lib/types.ts` #8-15, #68-105, #137-146
