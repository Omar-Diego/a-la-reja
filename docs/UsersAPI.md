# Users API

Esta página documenta todos los endpoints HTTP relacionados a autenticación de usuario, registro, gestión de perfil self-service y administración de usuarios. Estas rutas están implementadas en `backend/routes/usuarios.js` y `backend/routes/admin/usuarios.js`.

Para las páginas del frontend que consumen estos endpoints, ver [User Profile](UserProfile.md) y [Admin Interface](AdminInterface.md). Para cómo los tokens JWT son verificados en requests entrantes, ver [Server Setup & Middleware](ServerSetup&Middleware.md). Para el schema de la base de datos para la tabla `USUARIOS`, ver [Schema](Schema.md).

---

## Resumen de Endpoints

> Archivo de rutas: `backend/routes/usuarios.js`
> Archivo de rutas admin: `backend/routes/admin/usuarios.js`

| Método   | Ruta                        | Auth Requerida   | Rol               |
| -------- | --------------------------- | ---------------- | ----------------- |
| `POST`   | `/api/login`                | No               | Public            |
| `POST`   | `/api/usuarios`             | No               | Public (registro) |
| `GET`    | `/api/usuarios/me`          | Sí (`auth`)      | Self              |
| `PUT`    | `/api/usuarios/me`          | Sí (`auth`)      | Self              |
| `GET`    | `/api/usuarios/me/stats`    | Sí (`auth`)      | Self              |
| `GET`    | `/api/usuarios/me/activity` | Sí (`auth`)      | Self              |
| `GET`    | `/api/usuarios`             | Sí (`adminAuth`) | Admin             |
| `GET`    | `/api/usuarios/:id`         | Sí (`adminAuth`) | Admin             |
| `PUT`    | `/api/usuarios/:id`         | Sí (`adminAuth`) | Admin             |
| `DELETE` | `/api/usuarios/:id`         | Sí (`adminAuth`) | Admin             |

**Fuentes:** `backend/routes/usuarios.js` #47-585, `backend/routes/admin/usuarios.js` #28-230

---

## POST /api/login

> **Handler:** `backend/routes/usuarios.js` #80-146

Autentica un usuario y retorna un JWT firmado.

### Cuerpo del Request

| Campo      | Tipo   | Requerido |
| ---------- | ------ | --------- |
| `email`    | string | Sí        |
| `password` | string | Sí        |

### Respuesta (200 OK)

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "nombre": "Ana García",
    "email": "ana@example.com"
  }
}
```

### Diseño de Seguridad

- **Anti-enumeración:** Tanto "usuario no encontrado" como "contraseña incorrecta" retornan la misma respuesta 401 con el mensaje `"Credenciales invalidas"`. Esto previene que atacantes descubran qué emails están registrados. (`backend/routes/usuarios.js` #102-122)
- **Comparación de contraseña timing-safe:** Se usa `bcrypt.compare()` en lugar de una comparación de strings. (`backend/routes/usuarios.js` #115)
- **JWT payload:** `{ idUsuario, nombre, email }` firmado con `process.env.JWT_SECRET`, TTL de `1h`. (`backend/routes/usuarios.js` #126-134)
- **Prevención de SQL injection:** Query parametrizada `SELECT * FROM USUARIOS WHERE email = ?`. (`backend/routes/usuarios.js` #96-99)

---

## POST /api/usuarios (Registro)

> **Handler:** `backend/routes/usuarios.js` #165-222

Crea una nueva cuenta de usuario. Toda la validación se realiza server-side antes de hashear la contraseña.

### Cuerpo del Request

| Campo      | Tipo   | Requerido |
| ---------- | ------ | --------- |
| `nombre`   | string | Sí        |
| `email`    | string | Sí        |
| `password` | string | Sí        |

### Reglas de Validación

| Regla                         | Detalle                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todos los campos presentes    | `nombre`, `email`, `password` son todos requeridos                                                                                                  |
| Formato de email              | Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (`backend/routes/usuarios.js` #179)                                                                            |
| Longitud mínima de contraseña | Al menos 8 caracteres (`backend/routes/usuarios.js` #188-191)                                                                                       |
| Complejidad de contraseña     | Debe contener al menos una mayúscula, una minúscula y un dígito — regex `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/` (`backend/routes/usuarios.js` #194-199) |
| Email duplicado               | La restricción unique de MySQL dispara un error manejado por el middleware `dbErrorHandler`                                                         |

### Hashing de Contraseñas

Las contraseñas se hashean con `bcrypt.hash(password, 10)` — 10 salt rounds. La contraseña en texto plano nunca se almacena. (`backend/routes/usuarios.js` #204)

### Respuesta (201 Creado)

```json
{
  "message": "Usuario creado exitosamente",
  "id": 42
}
```

---

## Endpoints de Auto-Servicio (/api/usuarios/me)

Todos los cuatro endpoints `me` requieren un bearer token válido verificado por el middleware `auth`. El `idUsuario` del usuario se lee de `req.usuario.idUsuario`, que es establecido por el middleware después de decodificar el JWT.

### GET /api/usuarios/me

> **Handler:** `backend/routes/usuarios.js` #233-255

Retorna el perfil propio del usuario autenticado: `idUsuario`, `nombre`, `email`, `telefono`. La contraseña nunca se incluye.

### PUT /api/usuarios/me

> **Handler:** `backend/routes/usuarios.js` #268-336

Actualiza `nombre` y/o `telefono`. El email **no es editable** a través de este endpoint.

#### Validación

| Campo             | Regla                                                               |
| ----------------- | ------------------------------------------------------------------- |
| `nombre`          | Al menos 2 caracteres después de trimming                           |
| `telefono`        | Regex `/^[+]?[\d\s-]{8,20}$/`; string vacío se almacena como `NULL` |
| Al menos un campo | Debe proveer `nombre` o `telefono`                                  |

El `UPDATE` SQL se construye dinámicamente; solo los campos provistos se incluyen en la cláusula `SET`. (`backend/routes/usuarios.js` #300-315)

Después de la actualización, el handler re-fetcha la fila actualizada y la retorna en la respuesta. (`backend/routes/usuarios.js` #326-334)

### GET /api/usuarios/me/stats

> **Handler:** `backend/routes/usuarios.js` #347-379

Retorna tres conteos agregados derivados de la tabla `RESERVACIONES`, filtrados por `USUARIOS_idUsuario`.

| Campo       | Condición del query     |
| ----------- | ----------------------- |
| `total`     | Todas las reservaciones |
| `completed` | `fecha < CURDATE()`     |
| `upcoming`  | `fecha >= CURDATE()`    |

#### Respuesta de Ejemplo

```json
{
  "total": 15,
  "completed": 12,
  "upcoming": 3
}
```

### GET /api/usuarios/me/activity

> **Handler:** `backend/routes/usuarios.js` #390-414

Retorna las 5 reservaciones más recientes del usuario autenticado, ordenadas por `fecha DESC`, `hora_inicio DESC`. Cada fila se hace JOIN con `CANCHAS` para incluir el nombre de la cancha.

Cada item incluye un campo `status` computado:

| Valor         | Condición              |
| ------------- | ---------------------- |
| `"upcoming"`  | `r.fecha >= CURDATE()` |
| `"completed"` | `r.fecha < CURDATE()`  |

**Campos retornados:** `idReservacion`, `fecha` (formateada `YYYY-MM-DD`), `hora_inicio`, `hora_fin`, `cancha`, `status`.

**Fuentes:** `backend/routes/usuarios.js` #233-414

---

## Endpoints Admin CRUD (/api/usuarios/:id)

Todos los endpoints admin están protegidos por el middleware `adminAuth`. Estas rutas están implementadas en `backend/routes/admin/usuarios.js`.

### GET /api/usuarios

> **Handler:** `backend/routes/admin/usuarios.js` #28-43

Retorna todos los usuarios ordenados por `nombre ASC`. Cada fila incluye un conteo por subquery de reservaciones asociadas:

```sql
SELECT idUsuario, nombre, email, telefono,
  (SELECT COUNT(*) FROM RESERVACIONES WHERE USUARIOS_idUsuario = u.idUsuario) as totalReservaciones
FROM USUARIOS u
ORDER BY nombre ASC
```

### GET /api/usuarios/:id

> **Handler:** `backend/routes/admin/usuarios.js` #54-79

Retorna un único usuario por `idUsuario`. El ID es parseado y validado como un entero positivo antes de ejecutar la query. Retorna `404` si no se encuentra.

### PUT /api/usuarios/:id

> **Handler:** `backend/routes/admin/usuarios.js` #93-158

Edición admin de `nombre`, `email`, y/o `telefono`. A diferencia del `PUT /me` self-service, la versión admin también permite actualizar el campo `email`. El formato de email se valida con el mismo regex que el registro. El `UPDATE` SQL se construye dinámicamente.

### DELETE /api/usuarios/:id

> **Handler:** `backend/routes/admin/usuarios.js` #175-228

Elimina un usuario dentro de una transacción de base de datos. Críticamente, este handler **anula en lugar de eliminar** las reservaciones asociadas del usuario, preservando los datos históricos de booking e ingresos.

#### Respuesta

```json
{
  "message": "Usuario eliminado exitosamente",
  "reservacionesDesvinculadas": 5,
  "nota": "Las reservaciones del usuario se mantuvieron para preservar el historial de ingresos"
}
```

Este diseño depende de la columna FK nullable `USUARIOS_idUsuario` en `RESERVACIONES`. Para detalles, ver **Schema** y **Migrations**.

**Fuentes:** `backend/routes/admin/usuarios.js` #175-228

---

## Responsabilidades de los Módulos de Rutas

Dos archivos implementan estas rutas, con alcances distintos:
