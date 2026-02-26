# Court Reservation Flow

Esta página documenta el flujo de reservación de extremo a extremo: desde la selección de cancha, pasando por la elección de horario, hasta la confirmación final. Cubre los tres pasos del frontend en rutas secuenciales, los helpers de utilidad que aplican restricciones de reserva en el lado del cliente, el handoff via `sessionStorage` entre páginas, y la llamada `POST /api/reservaciones` que persiste la reservación.

Para detalles del endpoint backend, incluyendo el lock de concurrencia `SELECT FOR UPDATE`, ver [Reservations API](ReservaitonsAPI.md). Para control de acceso a rutas y requisitos de autenticación, ver [Route Protection](RouteProtection.md).

---

## Resumen del Flujo

El proceso de reservación se divide en tres pasos secuenciales, cada uno en una URL distinta bajo la ruta dinámica `/reservar/[cancha]`.

| Paso | URL                            | Descripción                        |
| ---- | ------------------------------ | ---------------------------------- |
| 1    | `/reservar/[cancha]`           | Selección de cancha                |
| 2    | `/reservar/[cancha]`           | Selección de horario (time slot)   |
| 3    | `/reservar/[cancha]/confirmar` | Confirmación y envío de la reserva |

**Fuentes:** `app/reservar/[cancha]/confirmar/page.tsx` #42-58, #84-121

---

## Pasos 1 y 2: Selección de Cancha y Elección de Horario

Los primeros dos pasos viven en `/reservar/[cancha]`, renderizados por el componente de página para ese segmento dinámico. El segmento de URL `[cancha]` es un string slug (ej. `pista-1`, `pista-2`, `pista-central`).

### Mapeo de Slug a ID

El frontend usa un mapeo estático de slug-a-ID definido en `app/lib/types.ts`. Este mapeo debe mantenerse en sincronía con los IDs de canchas sembrados en la base de datos.

| Slug            | `idCancha` | Nombre de Cancha |
| --------------- | ---------- | ---------------- |
| `pista-1`       | `1`        | Pista 1          |
| `pista-2`       | `2`        | Pista 2          |
| `pista-central` | `3`        | Pista Central    |

Las dos funciones helper `getCourtIdFromSlug(slug)` y `getSlugFromCourtId(id)` realizan esta traducción (`app/lib/types.ts` #23-39).

**Fuentes:** `app/lib/types.ts` #23-39, `migrations/002_seed_canchas.sql` #1-13

---

## Helpers de Restricciones del Time Slot

Estas funciones de `app/lib/types.ts` se usan en el time slot picker para deshabilitar slots no disponibles o inválidos en la UI.

### `isTimeSlotBooked(time, bookedSlots)` — `app/lib/types.ts` #118-129

Verifica si un slot propuesto de 1 hora comenzando en `time` se superpone con algún `BookedSlot` existente. Usa una verificación estándar de superposición de intervalos semi-abiertos:

```
slot overlaps si: slotStart < bookedEnd AND slotEnd > bookedStart
```

`slotEnd` siempre se calcula como `time + 1h` usando `calculateEndTime`, independientemente de la duración real elegida.

### `isDateInPast(date)` — `app/lib/types.ts` #131-135

Retorna `true` si el `Date` dado es anterior a hoy (normalizado a medianoche). Se usa para deshabilitar días del calendario en el pasado.

### `isTimeInPastForToday(time, date)` — `app/lib/types.ts` #148-155

Retorna `true` si la hora del slot seleccionado es igual o anterior a la hora actual, **pero solo cuando** `date` es hoy. Las fechas futuras nunca se consideran pasadas.

### `calculateEndTime(startTime, durationHours)` — `app/lib/types.ts` #107-116

Agrega `durationHours` (que puede ser un decimal como `1.5`) a un string `HH:MM` y retorna el resultado en formato `HH:MM`. Se usa tanto en el picker como en la página de confirmación.

**Fuentes:** `app/lib/types.ts` #107-155

---

## Traspaso via sessionStorage

Cuando el usuario confirma un time slot en el Paso 2, la página escribe un objeto `ReservationData` en `sessionStorage` bajo la clave `"reservationData"` y luego navega a la ruta de confirmación.

La forma del objeto almacenado es:

```typescript
interface ReservationData {
  fecha: string; // "YYYY-MM-DD"
  hora_inicio: string; // "HH:MM"
  canchaId: number;
  cancha: string; // slug, e.g. "pista-1"
  canchaName?: string; // display name
  precioPorHora?: number;
}
```

Esta interfaz está declarada en `ConfirmarReservaPage` (`app/reservar/[cancha]/confirmar/page.tsx` #12-19).

---

## Paso 3: `ConfirmarReservaPage`

**Archivo:** `app/reservar/[cancha]/confirmar/page.tsx`

`ConfirmarReservaPage` es el paso final. Realiza lo siguiente:

1. Lee `reservationData` desde `sessionStorage`
2. Permite al usuario seleccionar una duración
3. Calcula el precio total y la hora de fin
4. Envía la reservación via `POST /api/reservaciones`

### Lectura y Guard de sessionStorage

Al montarse, un `useEffect` lee `sessionStorage.getItem("reservationData")` (`app/reservar/[cancha]/confirmar/page.tsx` #42-58). Si la clave está ausente (ej. el usuario navegó directamente a la URL), el componente redirige inmediatamente de vuelta a `/reservar/${cancha}` usando `router.push`.

### Cálculo de Duración y Precio

La página expone tres botones de duración: `1h`, `1.5h`, `2h`. La selección impulsa dos valores derivados (`app/reservar/[cancha]/confirmar/page.tsx` #68-71):

| Botón de duración | `durationHours` | Fórmula `precioTotal` |
| ----------------- | --------------- | --------------------- |
| `1h`              | `1`             | `precio × 1`          |
| `1.5h`            | `1.5`           | `precio × 1.5`        |
| `2h`              | `2`             | `precio × 2`          |

```
precioTotal = courtInfo.precio * durationHours
horaFin = calculateEndTime(reservationData.hora_inicio, durationHours)
```

El valor `precio` proviene de `precioPorHora` almacenado en `sessionStorage` (fallback a `25` si está ausente) (`app/reservar/[cancha]/confirmar/page.tsx` #49-54).

---

## Payload del Request

El body enviado a `POST /api/reservaciones` (`app/reservar/[cancha]/confirmar/page.tsx` #91-97):

| Campo         | Fuente                                               |
| ------------- | ---------------------------------------------------- |
| `fecha`       | `reservationData.fecha` desde `sessionStorage`       |
| `hora_inicio` | `reservationData.hora_inicio` desde `sessionStorage` |
| `hora_fin`    | `calculateEndTime(hora_inicio, durationHours)`       |
| `idCancha`    | `courtInfo.id` (desde `sessionStorage` `canchaId`)   |
| `monto`       | `precioTotal` (precio × duración)                    |

---

## Manejo de la Respuesta

| HTTP Status | Causa                                        | Acción Frontend                                                  |
| ----------- | -------------------------------------------- | ---------------------------------------------------------------- |
| `201`       | Reservación creada exitosamente              | Limpiar `sessionStorage`, navegar a `/mis_reservas?success=true` |
| `409`       | Slot tomado (race condition de concurrencia) | Mostrar error "ya está reservada en ese horario"                 |
| `400`       | Falla de validación                          | Mostrar `data.error` o mensaje genérico                          |
| `401`       | JWT expirado                                 | Indicar al usuario que re-inicie sesión                          |
| Otro        | Error inesperado del servidor                | Mostrar `data.error` o error genérico                            |

La respuesta `409` maneja específicamente el caso donde dos usuarios intentan reservar el mismo slot simultáneamente. El backend aplica esto con una transacción `SELECT FOR UPDATE` — ver **5.2** para detalles.

**Fuentes:** `app/reservar/[cancha]/confirmar/page.tsx` #100-120

---

## Referencia de Funciones de Utilidad

Todos los helpers relacionados con reservaciones están en `app/lib/types.ts`:

| Función                 | Usado por                            | Propósito                                         |
| ----------------------- | ------------------------------------ | ------------------------------------------------- |
| `getCourtIdFromSlug`    | Time slot picker                     | Convertir slug URL a `idCancha` de DB             |
| `getSlugFromCourtId`    | Dashboard, profile                   | Link de vuelta a URL de reservación               |
| `isTimeSlotBooked`      | Time slot picker                     | Deshabilitar slots ocupados en la grilla de UI    |
| `isDateInPast`          | Calendar picker                      | Deshabilitar días del calendario en el pasado     |
| `isTimeInPastForToday`  | Time slot picker                     | Deshabilitar slots pasados cuando la fecha es hoy |
| `calculateEndTime`      | Confirmation page, slot picker       | Derivar `hora_fin` desde inicio + duración        |
| `formatDateDisplay`     | Confirmation page, reservations list | Fecha legible en locale español                   |
| `parseDateString`       | Todas las funciones de fecha         | Normalizar strings datetime de MySQL              |
| `isReservationUpcoming` | Dashboard, My Reservations           | Categorizar reservaciones como próximas           |

**Fuentes:** `app/lib/types.ts` #1-156
