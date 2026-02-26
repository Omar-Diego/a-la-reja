# Schema

Esta página documenta la estructura de la base de datos MySQL 8.0 de `a_la_reja`: sus tablas, columnas, tipos de datos, constraints y las relaciones entre ellas. También explica el diseño de foreign key nullable que preserva el historial financiero cuando se elimina una cuenta de usuario.

Para información sobre cómo han evolucionado las migraciones del schema a lo largo del tiempo, ver [Migrations](Migrations.md). Para la configuración del connection pool y el middleware `dbErrorHandler`, ver [Connection Pool](ConnectionPool.md).

---

## Tables at a Glance

La base de datos contiene tres tablas. `RESERVACIONES` es la tabla de hechos central y referencia tanto `USUARIOS` como `CANCHAS`.

| Tabla           | Clave Primaria  | Propósito                                                   |
| --------------- | --------------- | ----------------------------------------------------------- |
| `USUARIOS`      | `idUsuario`     | Cuentas de usuario registradas                              |
| `CANCHAS`       | `idCancha`      | Definiciones de canchas de padel                            |
| `RESERVACIONES` | `idReservacion` | Bookings de time-slot que enlazan un usuario con una cancha |

**Fuentes:** `migrations/001_create_tables.sql` #1-31, `migrations/004_allow_null_usuario_in_reservaciones.sql` #1-11

---

## Table Definitions

### USUARIOS

Almacena cuentas de usuario final registradas. Las contraseñas se almacenan como hashes bcrypt (10 salt rounds); ver **Users API** para la lógica de registro.

| Columna     | Tipo           | Restricciones      | Notas                                                   |
| ----------- | -------------- | ------------------ | ------------------------------------------------------- |
| `idUsuario` | `INT`          | AUTO_INCREMENT, PK | Clave surrogada                                         |
| `nombre`    | `VARCHAR(100)` | NOT NULL           | Nombre para mostrar                                     |
| `email`     | `VARCHAR(100)` | UNIQUE NOT NULL    | Credencial de login; unicidad enforced a nivel DB       |
| `password`  | `VARCHAR(255)` | NOT NULL           | Hash bcrypt                                             |
| `telefono`  | `VARCHAR(20)`  | NULL               | Agregado por migración 003; número de contacto opcional |

La constraint `UNIQUE` de email causa el error MySQL `ER_DUP_ENTRY` (errno 1062) en el registro duplicado, que `dbErrorHandler` mapea a HTTP 409. Ver `backend/middlewares/dbErrorHandler.js` #105-111.

**Fuentes:** `migrations/001_create_tables.sql` #6-11, `app/lib/types.ts` #1-6

---

### CANCHAS

Almacena las canchas de padel físicas disponibles para booking. Tres filas son seeded por la migración 002 con valores `idCancha` fijos de los que depende el mapeo slug-a-ID del frontend.

| Columna           | Tipo            | Restricciones      | Notas                                                     |
| ----------------- | --------------- | ------------------ | --------------------------------------------------------- |
| `idCancha`        | `INT`           | AUTO_INCREMENT, PK | Clave surrogada                                           |
| `nombre`          | `VARCHAR(100)`  | NOT NULL           | Nombre legible de la cancha                               |
| `ubicacion`       | `VARCHAR(255)`  | NOT NULL           | Descripción de la ubicación de la cancha                  |
| `precio_por_hora` | `DECIMAL(10,2)` | NOT NULL           | Tarifa por hora usada para calcular `monto` en el booking |

**Canchas seeded** (`migrations/002_seed_canchas.sql` #6-13):

| `idCancha` | `nombre`      | `precio_por_hora` |
| ---------- | ------------- | ----------------- |
| 1          | Pista 1       | 25.00             |
| 2          | Pista 2       | 20.00             |
| 3          | Pista Central | 30.00             |

Los helpers `getCourtIdFromSlug` / `getSlugFromCourtId` en `app/lib/types.ts` #23-39 hardcodean el mapeo `pista-1 → 1`, `pista-2 → 2`, `pista-central → 3`, por lo que los IDs seeded **deben permanecer estables**.

**Fuentes:** `migrations/001_create_tables.sql` #14-19, `migrations/002_seed_canchas.sql` #1-13, `app/lib/types.ts` #23-39

---

### RESERVACIONES

La tabla de hechos central. Cada fila representa un booking de un bloque de tiempo de una cancha por un usuario.

| Columna              | Tipo            | Restricciones                    | Notas                                                    |
| -------------------- | --------------- | -------------------------------- | -------------------------------------------------------- |
| `idReservacion`      | `INT`           | AUTO_INCREMENT, PK               | Clave surrogada                                          |
| `fecha`              | `DATE`          | NOT NULL                         | Fecha del booking (YYYY-MM-DD)                           |
| `hora_inicio`        | `TIME`          | NOT NULL                         | Hora de inicio del slot                                  |
| `hora_fin`           | `TIME`          | NOT NULL                         | Hora de fin del slot                                     |
| `monto`              | `DECIMAL(10,2)` | NULL (agregado migración 005)    | Cargo total; calculado como `precio_por_hora × duración` |
| `USUARIOS_idUsuario` | `INT`           | NULL, FK → `USUARIOS(idUsuario)` | Nullable por diseño — ver abajo                          |
| `CANCHAS_idCancha`   | `INT`           | FK → `CANCHAS(idCancha)`         | Requerido; referencia la cancha reservada                |

**Fuentes:** `migrations/001_create_tables.sql` #22-31, `migrations/004_allow_null_usuario_in_reservaciones.sql` #1-11

---

## Nullable FK: USUARIOS_idUsuario

La migración 004 cambió `USUARIOS_idUsuario` de `NOT NULL` a `NULL` (`migrations/004_allow_null_usuario_in_reservaciones.sql` #6-7):

```sql
ALTER TABLE RESERVACIONES
MODIFY COLUMN USUARIOS_idUsuario INT NULL;
```

**Motivación:** Cuando un admin elimina un usuario via el endpoint de delete transaccional (ver **Users API**), el backend primero establece `USUARIOS_idUsuario = NULL` en todas las reservaciones de ese usuario antes de eliminar la fila `USUARIOS`. Esto previene una violación de foreign key y retiene las filas de reservación — preservando el historial de ingresos y datos de utilización de canchas.

- **Antes de eliminación:** `RESERVACIONES.USUARIOS_idUsuario = 42` (el usuario existe)
- **Después de eliminar el usuario:** `RESERVACIONES.USUARIOS_idUsuario = NULL` (usuario eliminado, reservación conservada)

El FK `CANCHAS_idCancha` no tiene este tratamiento: el endpoint de eliminación de canchas usa una transacción que elimina primero las reservaciones asociadas, luego elimina la cancha.

---

## Flujo de Datos: Columnas del Schema → Tipos del Frontend

Las interfaces TypeScript `Court` y `Reservation` en `app/lib/types.ts` #1-21 reflejan directamente los nombres de columnas retornados por los queries de la API del backend.

**Fuentes:** `app/lib/types.ts` #1-21, `migrations/001_create_tables.sql` #14-31

---

## Nota de Concurrencia

La tabla `RESERVACIONES` es el objetivo del bloqueo `SELECT ... FOR UPDATE` durante el endpoint `POST` de reservaciones para prevenir el double-booking del mismo slot de cancha/fecha/hora. Las columnas `fecha`, `hora_inicio`, `hora_fin` y `CANCHAS_idCancha` son los campos chequeados en ese query de conflicto. Ver **Reservations API** para el flujo completo de transacción.
