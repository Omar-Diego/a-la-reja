# Courts API

Esta página documenta todos los endpoints bajo `/api/canchas`, implementados en `backend/routes/canchas.js`. Estas rutas manejan la lectura, creación, actualización y eliminación de canchas de pádel (`CANCHAS`) en la base de datos.

Para documentación sobre las reservaciones que referencian estas canchas, ver [Reservations API](ReservaitonsAPI.md). Para el esquema de la tabla `CANCHAS`, ver [Schema](Schema.md). Para cómo se aplica la autenticación de admin en los endpoints de escritura, ver [Backend API](BackendAPI.md).

---

## Resumen de Endpoints

| Método   | Path                         | Auth requerida | Descripción                                    |
| -------- | ---------------------------- | -------------- | ---------------------------------------------- |
| `GET`    | `/api/canchas`               | Ninguna        | Listar todas las canchas                       |
| `GET`    | `/api/canchas/stats`         | `adminAuth`    | Conteos de reservaciones e ingresos por cancha |
| `GET`    | `/api/canchas/top`           | Ninguna        | Top 3 canchas por conteo de reservaciones      |
| `GET`    | `/api/canchas/by-slug/:slug` | Ninguna        | Buscar cancha por nombre normalizado           |
| `GET`    | `/api/canchas/:idCancha`     | Ninguna        | Cancha individual por ID                       |
| `POST`   | `/api/canchas`               | `adminAuth`    | Crear una nueva cancha                         |
| `PUT`    | `/api/canchas/:idCancha`     | `adminAuth`    | Actualizar uno o más campos de una cancha      |
| `DELETE` | `/api/canchas/:idCancha`     | `adminAuth`    | Eliminar cancha y todas sus reservaciones      |

**Fuentes:** `backend/routes/canchas.js` #1-396

---

## `GET /api/canchas`

**Público.** Retorna todas las canchas ordenadas alfabéticamente por nombre.

- **Campos de respuesta:** `idCancha`, `nombre`, `ubicacion`, `precio_por_hora`
- No se aceptan query parameters. Se retornan todas las filas de la tabla `CANCHAS`.

**Fuentes:** `backend/routes/canchas.js` #42-58

---

## `GET /api/canchas/stats`

**Solo admin** (requiere middleware `adminAuth`).

Retorna cada cancha con métricas agregadas de reservaciones, calculadas via un `LEFT JOIN` contra `RESERVACIONES`.

| Campo                | Fuente                         |
| -------------------- | ------------------------------ |
| `idCancha`           | `CANCHAS.idCancha`             |
| `nombre`             | `CANCHAS.nombre`               |
| `ubicacion`          | `CANCHAS.ubicacion`            |
| `precio_por_hora`    | `CANCHAS.precio_por_hora`      |
| `totalReservaciones` | `COUNT(r.idReservacion)`       |
| `ingresos`           | `COUNT(...) * precio_por_hora` |

> **Nota:** `ingresos` es un valor derivado que multiplica el conteo de reservaciones por el precio por hora actual. No usa el `monto` almacenado por reservación, por lo que puede divergir del ingreso real si los precios han cambiado.

**Fuentes:** `backend/routes/canchas.js` #68-85

---

## `GET /api/canchas/top`

**Público.** Retorna las 3 canchas con más reservaciones, ordenadas por `totalReservaciones DESC`, con `nombre ASC` como desempate.

- **Campos de respuesta:** `idCancha`, `nombre`, `ubicacion`, `precio_por_hora`, `totalReservaciones`

Este endpoint es usado por el dashboard de usuario para mostrar canchas populares. Ver **4.3** para cómo el frontend consume estos datos.

**Fuentes:** `backend/routes/canchas.js` #95-111

---

## `GET /api/canchas/by-slug/:slug`

**Público.** Busca una sola cancha usando un slug derivado del nombre de la cancha. Retorna el primer match, o `404` si no se encuentra ninguno.

### Estrategia de Coincidencia por Slug

La query usa tres estrategias de matching paralelas contra la columna `CANCHAS.nombre`:

El `searchName` se construye dividiendo el slug en `-`, luego capitalizando cada palabra y uniéndolas con espacios. Por ejemplo, `pista-central` se convierte en `Pista Central`.

**Fuentes:** `backend/routes/canchas.js` #122-156

---

## `GET /api/canchas/:idCancha`

**Público.** Retorna una sola cancha por su clave primaria numérica.

- Valida que `idCancha` parsea a un entero positivo; retorna `400` si no.
- Retorna `404` si no existe ninguna fila coincidente.
- **Campos de respuesta:** `idCancha`, `nombre`, `ubicacion`, `precio_por_hora`

**Fuentes:** `backend/routes/canchas.js` #171-205

---

## `POST /api/canchas`

**Solo admin.** Crea una nueva cancha.

**Cuerpo del request:**

| Campo             | Tipo     | Requerido | Notas                                   |
| ----------------- | -------- | --------- | --------------------------------------- |
| `nombre`          | `string` | Sí        | Trimmed antes del insert                |
| `ubicacion`       | `string` | Sí        | Trimmed antes del insert                |
| `precio_por_hora` | `number` | Sí        | Parseado con `parseFloat`; debe ser ≥ 0 |

**Respuesta exitosa (201):**

```json
{ "message": "Cancha creada exitosamente", "idCancha": <insertId> }
```

**Fuentes:** `backend/routes/canchas.js` #218-255

---

## `PUT /api/canchas/:idCancha`

**Solo admin.** Actualiza uno o más campos de una cancha existente. Los tres campos del body son opcionales; la cláusula `SET` del SQL se construye dinámicamente a partir de los campos presentes.

**Cuerpo del request (todos opcionales):**

| Campo             | Tipo     | Notas        |
| ----------------- | -------- | ------------ |
| `nombre`          | `string` | Trimmed      |
| `ubicacion`       | `string` | Trimmed      |
| `precio_por_hora` | `number` | Debe ser ≥ 0 |

- Retorna `400` si no se proveen campos.
- Retorna `404` si `affectedRows === 0`.
- Al tener éxito, re-fetches la fila actualizada y la retorna en la respuesta junto con el mensaje de éxito.

**Respuesta exitosa (200):**

```json
{ "message": "Cancha actualizada exitosamente", "cancha": { ... } }
```

**Fuentes:** `backend/routes/canchas.js` #269-336

---

## `DELETE /api/canchas/:idCancha`

**Solo admin.** Elimina permanentemente una cancha y todas sus reservaciones asociadas. Usa una transacción de base de datos explícita para garantizar atomicidad.

El paso de eliminación de reservaciones usa un `DELETE` en lugar de nullificar la clave foránea. Esto significa que los registros históricos de reservaciones se eliminan completamente cuando se borra una cancha. Esto difiere de la estrategia de eliminación de usuarios descrita en **5.3** y **6.1**, donde `USUARIOS_idUsuario` se nullifica para preservar la historia.

**Respuestas de error:**

- `400` — `idCancha` inválido
- `404` — cancha no encontrada
- `500` — cualquier error de base de datos no manejado dispara `rollback()` y re-lanza a `asyncHandler`

**Fuentes:** `backend/routes/canchas.js` #347-393

---

## Modelo de Autenticación

Todas las rutas en este módulo usan una de dos funciones middleware:

| Middleware  | Aplicado a                                                                                 | Comportamiento                             |
| ----------- | ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| _(ninguno)_ | `GET /canchas`, `GET /canchas/top`, `GET /canchas/by-slug/:slug`, `GET /canchas/:idCancha` | Sin token requerido; completamente público |
| `adminAuth` | `GET /canchas/stats`, `POST`, `PUT`, `DELETE`                                              | Requiere JWT válido con `role: "admin"`    |

**Fuentes:** `backend/routes/canchas.js` #27-28, #68-70, #218-221, #269-272, #347-350

---

## Manejo de Errores

Todos los route handlers están envueltos en `asyncHandler` de `backend/middlewares/dbErrorHandler.js`. Esto captura cualquier promesa rechazada no manejada y la reenvía al middleware de error centralizado, que mapea códigos de error MySQL a respuestas HTTP apropiadas. Ver **6.3** para detalles de `dbErrorHandler`.
