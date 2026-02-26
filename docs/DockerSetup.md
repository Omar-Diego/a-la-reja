# Docker Setup

Esta página describe la configuración de Docker Compose que ejecuta los servicios backend de A La Reja en un VPS: una base de datos MySQL 8.0 y el API Express.js. Cubre las definiciones de servicios en `docker-compose.yml`, el `Dockerfile` del backend, networking entre servicios, health checks, y el mecanismo de inicialización de la base de datos.

Para definiciones de variables de entorno referenciadas por el archivo Compose, ver [Environment Variables & Configuration](EnvironmentVariables&Configuration.md). Para los archivos SQL de migración montados en el contenedor de base de datos, ver [Migrations](Migrations.md). Para qué hace el backend Express, ver [Backend API](BackendAPI.md).

---

## Resumen del Stack

**Fuentes:** `docker-compose.yml` #1-79

---

## Servicio MySQL

El servicio `mysql` está definido en `docker-compose.yml` #7-42:

| Propiedad             | Valor                           |
| --------------------- | ------------------------------- |
| Nombre del contenedor | `a_la_reja_mysql`               |
| Imagen                | `mysql:8.0`                     |
| Política de reinicio  | `unless-stopped`                |
| Puerto en host        | `0.0.0.0:3306 → container 3306` |
| Datos persistentes    | `mysql_data → /var/lib/mysql`   |
| Red                   | `app_network`                   |

### Variables de Entorno

Todas las cuatro variables de entorno usan la sintaxis `${VAR:?error}`, que hace que Compose falle inmediatamente con un mensaje de error si alguna variable no está establecida.

| Compose Variable      | MySQL Environment Variable | Propósito                           |
| --------------------- | -------------------------- | ----------------------------------- |
| `MYSQL_ROOT_PASSWORD` | `MYSQL_ROOT_PASSWORD`      | Contraseña de la cuenta root        |
| `DB_NAME`             | `MYSQL_DATABASE`           | Base de datos creada en primer boot |
| `DB_USER`             | `MYSQL_USER`               | Cuenta de usuario de la aplicación  |
| `DB_PASSWORD`         | `MYSQL_PASSWORD`           | Contraseña del usuario de la app    |

**Fuentes:** `docker-compose.yml` #11-16

### Inicialización de la Base de Datos via Migration Mounts

Tres archivos SQL de migración se montan como **read-only** en `/docker-entrypoint-initdb.d/`. La imagen oficial de MySQL ejecuta todos los archivos `.sql` en ese directorio en orden lexicográfico en el **primer arranque** (es decir, cuando el volumen `mysql_data` está vacío).

| Host Path                            | Container Path                                      |
| ------------------------------------ | --------------------------------------------------- |
| `./migrations/001_create_tables.sql` | `/docker-entrypoint-initdb.d/001_create_tables.sql` |
| `./migrations/002_seed_canchas.sql`  | `/docker-entrypoint-initdb.d/002_seed_canchas.sql`  |
| `./migrations/003_add_telefono.sql`  | `/docker-entrypoint-initdb.d/003_add_telefono.sql`  |

> **Nota:** Las migraciones 004 y 005 **no están montadas** aquí y deben aplicarse manualmente. Ver **Migrations** para la secuencia completa.

**Fuentes:** `docker-compose.yml` #21-24

### Health Check de MySQL

```yaml
test: mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD}
interval: 10s
timeout: 5s
retries: 5
start_period: 30s
```

El `start_period: 30s` le da a MySQL tiempo para inicializar el directorio de datos y ejecutar los init scripts antes de que las fallas del health check cuenten contra el límite de reintentos.

**Fuentes:** `docker-compose.yml` #25-39

---

## Servicio Backend

El servicio `backend` está definido en `docker-compose.yml` #45-70:

| Propiedad             | Valor                   |
| --------------------- | ----------------------- |
| Nombre del contenedor | `a_la_reja_backend`     |
| Contexto de build     | `./backend`             |
| Dockerfile            | `./backend/Dockerfile`  |
| Política de reinicio  | `unless-stopped`        |
| Puerto en host        | `3001 → container 3001` |
| Red                   | `app_network`           |

### Orden de Dependencia y Arranque

```yaml
depends_on:
  mysql:
    condition: service_healthy
```

La condición `service_healthy` significa que Docker Compose **no iniciará** el contenedor backend hasta que `mysqladmin ping` tenga éxito dentro del contenedor `mysql`.

**Fuentes:** `docker-compose.yml` #66-68

### Variables de Entorno del Backend en Tiempo de Ejecución

| Variable         | Valor en Compose                                        |
| ---------------- | ------------------------------------------------------- |
| `NODE_ENV`       | `production` (hardcoded)                                |
| `PORT`           | `3001` (hardcoded)                                      |
| `DB_HOST`        | `mysql` (service name — resolves via `app_network` DNS) |
| `DB_PORT`        | `3306` (hardcoded)                                      |
| `DB_USER`        | `${DB_USER}`                                            |
| `DB_PASSWORD`    | `${DB_PASSWORD}`                                        |
| `DB_NAME`        | `${DB_NAME}`                                            |
| `JWT_SECRET`     | `${JWT_SECRET}`                                         |
| `FRONTEND_URL`   | `${FRONTEND_URL}`                                       |
| `RESEND_API_KEY` | `${RESEND_API_KEY}`                                     |
| `FROM_EMAIL`     | `${FROM_EMAIL}`                                         |
| `DB_SSL`         | `"false"` (hardcoded)                                   |

> `DB_HOST` se establece en `mysql` (el nombre del servicio), no en `localhost`. El DNS de red interna de Docker resuelve nombres de servicio a IPs de contenedor automáticamente.

**Fuentes:** `docker-compose.yml` #51-63

---

## Dockerfile del Backend

La imagen backend se construye desde `backend/Dockerfile` (líneas 1–37).

### Decisiones Clave de Diseño

- **`dumb-init` como PID 1:** Alpine Linux no incluye un proceso init propio. Sin uno, `node` corre como PID 1 y no reenvía correctamente las señales Unix (ej. `SIGTERM`). `dumb-init` se instala en `backend/Dockerfile` #8 y se usa como `ENTRYPOINT` en #34 envolviendo `node index.js`.

- **Usuario no-root `nodejs`:** Un grupo y usuario dedicados del sistema (`nodejs`, UID/GID `1001`) se crean en `backend/Dockerfile` #11-12. El código fuente se copia con `--chown=nodejs:nodejs` en #21 y el contenedor cambia a este usuario en #24.

- **Solo dependencias de producción:** `npm ci --only=production` en `backend/Dockerfile` #18 instala solo dependencias, no `devDependencies`, y `npm cache clean --force` elimina el cache de npm para reducir el tamaño de la imagen.

- **`.dockerignore`:** El archivo `backend/.dockerignore` #1-12 excluye `node_modules`, `.env`, `.git`, y archivos de documentación del contexto de build.

**Fuentes:** `backend/Dockerfile` #1-37, `backend/.dockerignore` #1-12

### Health Check del Contenedor

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1
```

Usa `wget` (disponible en Alpine) para hacer poll al endpoint `/health`. Después de 3 fallas consecutivas el contenedor se marca como `unhealthy`.

**Fuentes:** `backend/Dockerfile` #30-31

---

## Red y Volúmenes

### `app_network`

Una única red bridge llamada `app_network` está declarada en `docker-compose.yml` #76-78 y se adjunta a ambos servicios. El DNS interno de Docker resuelve nombres de servicio (`mysql`, `backend`) a sus IPs de contenedor dentro de esta red.

> El puerto `3306` de MySQL está expuesto al host en `0.0.0.0:3306` para acceso de administración remota. Los comentarios en el archivo Compose notan que **no debería estar expuesto a internet público** en producción.

### `mysql_data` Volume

Un volumen nombrado `mysql_data` con driver `local` está declarado en `docker-compose.yml` #72-74. Se monta en `/var/lib/mysql` dentro del contenedor MySQL y persiste archivos de base de datos a través de reinicios y recreaciones de contenedores. **Eliminar este volumen resetea la base de datos** a un estado limpio y dispara la re-ejecución de los init scripts en el próximo arranque.

**Fuentes:** `docker-compose.yml` #17-21, #72-78
