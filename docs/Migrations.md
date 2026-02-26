# Migrations

Esta página documenta la secuencia completa de migraciones de base de datos para A La Reja: qué cambia cada migración, por qué se hizo el cambio y cómo se aplican las migraciones. Cubre solo la evolución del schema a lo largo del tiempo; para el schema en estado final ver [Schema](Schema.md), y para cómo se inicializa el contenedor MySQL via Docker Compose ver [Docker Setup](DockerSetup.md).

---

## Descripción General

Las migraciones son archivos SQL almacenados en el directorio `migrations/`. Están numerados secuencialmente y se aplican en orden. El contenedor MySQL 8.0 ejecuta automáticamente cualquier archivo `.sql` colocado en `/docker-entrypoint-initdb.d/` en la primera inicialización — la configuración Docker Compose monta los archivos de migración en ese directorio, por lo que una base de datos nueva se inicializa completamente sin intervención manual.

Para cambios que deben aplicarse a una base de datos ya en ejecución (e.g., producción), existen scripts runner independientes junto a los archivos SQL.

### Resumen de la Secuencia de Migraciones

| #   | Archivo                                       | Descripción                                                                                          |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 001 | `001_create_tables.sql`                       | Crear las tablas iniciales `USUARIOS`, `CANCHAS`, `RESERVACIONES`                                    |
| 002 | `002_seed_canchas.sql`                        | Seed de datos iniciales de canchas en `CANCHAS`                                                      |
| 003 | `003_add_telefono.sql`                        | Agregar columna `telefono` a `USUARIOS` via stored procedure                                         |
| 004 | `004_allow_null_usuario_in_reservaciones.sql` | Hacer `USUARIOS_idUsuario` nullable para preservar historial de reservaciones al eliminar un usuario |
| 005 | `005_add_monto_to_reservaciones.sql`          | Agregar columna `monto DECIMAL(10,2)` a `RESERVACIONES`                                              |

**Fuentes:** `migrations/001_create_tables.sql` #1-31, `migrations/004_allow_null_usuario_in_reservaciones.sql` #1-11, `migrations/005_add_monto_to_reservaciones.sql` #1-6

---

## 001 — Creación Inicial de Tablas

**File:** `migrations/001_create_tables.sql`

Crea las tres tablas core desde cero usando `CREATE TABLE IF NOT EXISTS`. (`migrations/001_create_tables.sql` #6-31)

**Decisiones clave en esta etapa:**

- `USUARIOS.email` es `UNIQUE NOT NULL` — enforza una cuenta por dirección de email.
- `CANCHAS.precio_por_hora` es `DECIMAL(10,2)` — precisión monetaria desde el principio.
- `RESERVACIONES.USUARIOS_idUsuario` se declara como `INT` con referencia de foreign key a `USUARIOS(idUsuario)`, pero aún no es nullable en este paso. Esto se cambió en migración 004.
- `RESERVACIONES` no tiene columna `monto` todavía. Se agregó en migración 005.

**Script runner:** `migrations/run_migration.js` se conecta usando credenciales hardcodeadas y ejecuta el archivo SQL. Luego imprime la lista de tablas resultante y descripciones de columnas para verificar el resultado. (`migrations/run_migration.js` #1-49)

> **Nota:** `run_migration.js` hardcodea una IP de host específica. Probablemente fue usado solo para el setup inicial de producción.

---

## 002 — Datos Iniciales de Canchas

**File:** `migrations/002_seed_canchas.sql`

Inserta el set inicial de canchas de padel en la tabla `CANCHAS`. Esto puebla la aplicación con canchas utilizables inmediatamente después de la creación del schema, para que el sistema no esté vacío en el primer boot.

No existe un script runner dedicado para esta migración; la inicialización Docker Compose la maneja automáticamente en secuencia.

---

## 003 — Add telefono to USUARIOS

**File:** `migrations/003_add_telefono.sql`

Agrega la columna `telefono` a la tabla `USUARIOS` usando un stored procedure. El patrón del stored procedure se usó para aplicar el `ALTER TABLE` solo si la columna no existe ya, haciendo la migración idempotente.

Esta columna se expone a través de los endpoints de edición de perfil (`PUT /api/usuarios/me`) y se muestra en `PerfilPage`. Ver **User Profile** y **Users API** para detalles de consumo.

---

## 004 — Allow NULL on USUARIOS_idUsuario

**File:** `migrations/004_allow_null_usuario_in_reservaciones.sql` (#1-11)

**Cambio:**

```sql
ALTER TABLE RESERVACIONES
MODIFY COLUMN USUARIOS_idUsuario INT NULL;
```

**Motivación:** Cuando se elimina una cuenta de usuario, el backend realiza una eliminación transaccional que primero establece `USUARIOS_idUsuario = NULL` en todas las reservaciones de ese usuario, luego elimina la fila del usuario. Sin esta migración, la constraint de foreign key bloquearía la eliminación o eliminaría en cascada todos los registros de reservaciones.

Hacer la columna nullable **preserva el historial de reservaciones** (y por lo tanto el historial de ingresos) incluso después de que el usuario asociado ya no exista. La interfaz de admin continúa mostrando estas reservaciones huérfanas correctamente.

Ver **Users API** para la implementación del delete transaccional, y **Schema** para la justificación del diseño del FK nullable.

---

## 005 — Add monto to RESERVACIONES

**File:** `migrations/005_add_monto_to_reservaciones.sql` (#1-6)

**Cambio:**

```sql
ALTER TABLE RESERVACIONES
ADD COLUMN monto DECIMAL(10,2) NOT NULL DEFAULT 0.00;
```

**Motivación:** Anteriormente, el costo total de una reservación no se almacenaba en la base de datos — tenía que recalcularse en cada lectura multiplicando `precio_por_hora` por la duración de la reservación. Esto causaba problemas si `precio_por_hora` se cambiaba después para una cancha, y hacía inexacto el reporte financiero para registros históricos.

Almacenar `monto` en el momento de escritura asegura que el monto refleje el precio al momento de la reservación.

Debido a que las filas existentes reciben `DEFAULT 0.00`, se requiere un paso de backfill separado después de aplicar esta migración a una base de datos que ya contiene datos.

### Script de Relleno (Backfill)

**File:** `backend/update_old_reservations.js` (#1-78)

El script de backfill se conecta directamente a la base de datos y ejecuta:

```sql
UPDATE RESERVACIONES r
JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
SET r.monto = c.precio_por_hora * (
  TIMESTAMPDIFF(MINUTE, r.hora_inicio, r.hora_fin) / 60
)
WHERE r.monto = 0
```

Calcula `monto` como `precio_por_hora × duración_en_horas` para cada reservación que tiene `monto = 0`. El script reporta cuántas filas se actualizaron e imprime una tabla de verificación de las últimas 10 reservaciones actualizadas.

> **Limitación:** El backfill usa el `precio_por_hora` actual de la cancha. Si el precio de una cancha fue cambiado antes de que corriera el backfill, los registros históricos reflejarán el nuevo precio, no el precio original de la reservación.

### Scripts de Ejecución para la Migración 005

| Script                            | Env source                                |
| --------------------------------- | ----------------------------------------- |
| `migrations/run_migration_005.js` | `backend/.env` (via path join)            |
| `backend/migrate_add_monto.js`    | `.env` en el directorio de trabajo actual |

Ambos scripts aplican el mismo archivo SQL, luego ejecutan `DESCRIBE RESERVACIONES` para confirmar que la columna fue agregada. (`migrations/run_migration_005.js` #1-46, `backend/migrate_add_monto.js` #1-49)

---

## Utilidad de Diagnóstico

**File:** `backend/check_constraints.js` (#1-47)

Un script standalone que consulta `INFORMATION_SCHEMA.KEY_COLUMN_USAGE` para imprimir todas las constraints de foreign key en la tabla `RESERVACIONES`, seguido del output completo de `SHOW CREATE TABLE RESERVACIONES`. Útil para verificar que la migración 004 aplicó correctamente el cambio de FK nullable y que no queda ninguna constraint `NOT NULL` obsoleta.

---

## Inventario de Archivos de Migración

**Fuentes:** `migrations/001_create_tables.sql` #1-31, `migrations/004_allow_null_usuario_in_reservaciones.sql` #1-11, `migrations/005_add_monto_to_reservaciones.sql` #1-6, `migrations/run_migration.js` #1-49, `migrations/run_migration_005.js` #1-46, `backend/migrate_add_monto.js` #1-49, `backend/update_old_reservations.js` #1-78, `backend/check_constraints.js` #1-47
