# Database

Esta página provee un overview de la capa de base de datos MySQL 8.0 usada por A La Reja: las tres tablas principales, sus relaciones, cómo se inicializa el esquema y evoluciona a través de migraciones, y cómo el backend accede a la base de datos via un pool de conexiones.

Para documentación de esquema a nivel de columna, ver [Schema](Schema.md). Para la secuencia completa de migración y scripts de backfill, ver [Migrations](Migrations.md). Para configuración del pool de conexiones y manejo de errores, ver [Connection Pool](ConnectionPool.md). Para cómo las rutas del backend API usan el pool, ver [Backend API](BackendAPI.md).

---

## Rol en el Sistema

La base de datos es una instancia MySQL 8.0 llamada `a_la_reja`, corriendo en un contenedor Docker (`a_la_reja_mysql`) en el puerto `3306`. **Solo es accesible desde el backend Express** sobre la red interna Docker (`app_network`). Ningún otro servicio se conecta directamente a ella.

**Resumen del schema:**

| Tabla           | Clave Primaria  | Propósito                                                   |
| --------------- | --------------- | ----------------------------------------------------------- |
| `USUARIOS`      | `idUsuario`     | Cuentas de usuario registradas                              |
| `CANCHAS`       | `idCancha`      | Canchas de pádel disponibles para reservar                  |
| `RESERVACIONES` | `idReservacion` | Reservaciones de slots de tiempo ligando usuarios a canchas |

---

## Relaciones entre Entidades

La clave foránea `USUARIOS_idUsuario` es **nullable**. Esto permite que los registros de reservación se retengan después de que se elimina una cuenta de usuario — la columna se establece en `NULL` en lugar de hacer un delete en cascada. `CANCHAS_idCancha` es una clave foránea requerida; la eliminación de canchas es manejada transaccionalmente por el backend (eliminando primero las reservaciones asociadas).

**Fuentes:** `migrations/001_create_tables.sql` #1-31

---

## Secuencia de Migraciones

Los cambios de schema se aplican via archivos SQL numerados montados en el directorio `/docker-entrypoint-initdb.d/` del contenedor MySQL, que MySQL ejecuta en orden alfabético en la primera inicialización.

| Migration | Archivo                                       | Descripción                                          |
| --------- | --------------------------------------------- | ---------------------------------------------------- |
| **001**   | `001_create_tables.sql`                       | Crear `USUARIOS`, `CANCHAS`, `RESERVACIONES`         |
| **002**   | `002_seed_canchas.sql`                        | Insertar los tres registros de canchas iniciales     |
| **003**   | `003_add_telefono.sql`                        | Agregar columna `telefono` a `USUARIOS`              |
| **004**   | `004_allow_null_usuario_in_reservaciones.sql` | Permitir `NULL` en `USUARIOS_idUsuario`              |
| **005**   | `005_add_monto_to_reservaciones.sql`          | Agregar `monto DECIMAL` a `RESERVACIONES` + backfill |

El script `run_migration.js` en el directorio `migrations/` es una utilidad standalone que conecta directamente y reproduce `001_create_tables.sql`. **No es parte del flujo normal de arranque de Docker** y está pensado para uso manual.

**Fuentes:** `migrations/001_create_tables.sql` #1-31, `migrations/002_seed_canchas.sql` #1-13, `migrations/run_migration.js` #1-49

---

## Connection Pool

El backend expone el acceso a la base de datos a través de un único pool `mysql2/promise` creado en `backend/config/db.js`. Todos los route handlers importan `pool` de este módulo y llaman directamente a `pool.query()` o `pool.getConnection()`.

**Valores clave de configuración del pool:**

| Opción               | Valor                   | Propósito                                            |
| -------------------- | ----------------------- | ---------------------------------------------------- |
| `connectionLimit`    | `10` (default)          | Máximo de conexiones simultáneas                     |
| `queueLimit`         | `0` (default)           | Solicitudes de conexión en cola ilimitadas           |
| `waitForConnections` | `true`                  | Bloquear en lugar de error cuando el pool está lleno |
| `connectTimeout`     | `10000 ms`              | Falla rápida en host inaccesible                     |
| `multipleStatements` | `false`                 | Prevenir inyección SQL via sentencias múltiples      |
| `ssl`                | Condicional en `DB_SSL` | Encriptar la conexión DB en producción               |
| `charset`            | `utf8mb4`               | Soporte completo de Unicode                          |

Todas las credenciales de base de datos se leen desde variables de entorno (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`). Ver **Environment Variables & Configuration** para la referencia completa de variables.

**Fuentes:** `backend/config/db.js` #30-71

---

## Manejo de Errores

Los errores de base de datos que se propagan fuera de los route handlers son capturados por el middleware `dbErrorHandler` en `backend/middlewares/dbErrorHandler.js`. Este:

1. Detecta errores MySQL inspeccionando `error.code` y `error.errno`
2. Mapea códigos de error MySQL específicos a códigos de estado HTTP apropiados
3. Retorna un mensaje de error genérico y no leaky al cliente
4. Registra detalles completos del error server-side (`code`, `errno`, `SQL state`, `stack trace`). El SQL solo se registra cuando `NODE_ENV !== "production"`

El wrapper `asyncHandler` exportado del mismo archivo asegura que las promesas rechazadas no manejadas en los route handlers async sean reenviadas a `dbErrorHandler` via el mecanismo `next(err)` de Express.

**Fuentes:** `backend/middlewares/dbErrorHandler.js` #84-204, #306-314
