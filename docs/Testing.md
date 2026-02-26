# Testing con Jest

Esta página documenta las pruebas automatizadas implementadas con Jest en el proyecto, incluyendo la configuración del entorno de pruebas, los tipos de pruebas realizadas y los casos de prueba cubiertos. Para información sobre la arquitectura general del sistema, ver [Architecture](Architecture.md).

---

## Configuración de Jest

El backend utiliza Jest como framework de pruebas. La configuración se encuentra en [`backend/jest.config.js`](backend/jest.config.js):

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true
};
```

### Dependencias de Testing

Las dependencias de desarrollo para testing están declaradas en [`backend/package.json`](backend/package.json):

| Paquete | Versión | Propósito |
| ------- | -------- | --------- |
| `jest` | `^30.2.0` | Framework de testing |
| `supertest` | `^7.2.2` | Testing de endpoints HTTP |
| `@types/jest` | `^30.0.0` | Tipos TypeScript para Jest |
| `@types/supertest` | `^7.2.0` | Tipos para supertest |

### Scripts de Testing

Los scripts disponibles en [`backend/package.json`](backend/package.json) son:

| Script | Descripción |
| ------ | ----------- |
| `npm test` | Ejecuta todas las pruebas |
| `npm run test:watch` | Ejecuta pruebas en modo watch |
| `npm run test:coverage` | Ejecuta pruebas con cobertura de código |

---

## Estructura de Pruebas

Las pruebas se encuentran organizadas en el directorio [`backend/__tests__/`](backend/__tests__/):

```
backend/__tests__/
├── integration/           # Pruebas de integración
│   ├── auth.routes.test.js
│   ├── canchas.routes.test.js
│   └── reservaciones.routes.test.js
├── mocks/                 # Mocks reutilizables
│   └── db.mock.js
└── unit/                 # Pruebas unitarias
    ├── auth.middleware.test.js
    └── dbErrorHandler.middleware.test.js
```

---

## Pruebas Unitarias

Las pruebas unitarias verifican el comportamiento de componentes individuales del sistema.

### Middleware de Autenticación ([`auth.middleware.test.js`](backend/__tests__/unit/auth.middleware.test.js))

Este archivo contiene 185 líneas de pruebas para el middleware de autenticación JWT ubicado en [`backend/middlewares/auth.js`](backend/middlewares/auth.js).

#### Casos de Prueba Cubiertos

| Escenario | Descripción |
| --------- | ----------- |
| Sin header de autorización | Debe retornar 401 cuando no existe el header |
| Formato Bearer inválido | Debe retornar 401 para formatos incorrectos |
| Token vacío | Debe retornar 401 para tokens vacíos |
| Token inválido | Debe retornar 401 para tokens con formato incorrecto |
| Token expirado | Debe retornar 401 para tokens vencidos |
| Firma incorrecta | Debe retornar 401 para tokens con firma inválida |
| Token válido | Debe llamar a next() y agregar usuario a req |
| Payload con role admin | Debe manejar correctamente tokens con rol de administrador |

#### Ejemplo de Caso de Prueba

```javascript
it('debe retornar 401 si el token ha expirado', () => {
  const expiredToken = jwt.sign(
    { idUsuario: 1, nombre: 'Test User' },
    process.env.JWT_SECRET,
    { expiresIn: '-1s' }
  );
  mockReq.headers.authorization = `Bearer ${expiredToken}`;

  authMiddleware(mockReq, mockRes, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(401);
  expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token inválido' });
});
```

### Middleware de Manejo de Errores de Base de Datos ([`dbErrorHandler.middleware.test.js`](backend/__tests__/unit/dbErrorHandler.middleware.test.js))

Este archivo contiene 210 líneas de pruebas para el middleware de manejo de errores de MySQL ubicado en [`backend/middlewares/dbErrorHandler.js`](backend/middlewares/dbErrorHandler.js).

#### Casos de Prueba Cubiertos

| Tipo de Error | Código MySQL | Respuesta Esperada |
|--------------|--------------|-------------------|
| Entrada duplicada | ER_DUP_ENTRY (1062) | 409 Conflict |
| Clave foránea (insert) | ER_NO_REFERENCED_ROW_2 (1452) | 400 Bad Request |
| Clave foránea (delete) | ER_ROW_IS_REFERENCED_2 (1451) | 400 Bad Request |
| Campo nulo | ER_BAD_NULL_ERROR (1048) | 400 Bad Request |
| Conexión rechazada | ECONNREFUSED | 503 Service Unavailable |
| Timeout de conexión | ETIMEDOUT | 503 Service Unavailable |
| Deadlock | ER_LOCK_DEADLOCK (1213) | 503 Service Unavailable |
| Acceso denegado | ER_ACCESS_DENIED_ERROR (1045) | 503 Service Unavailable |
| Tabla no encontrada | errno 1146 | 500 Internal Server Error |

#### Función isDatabaseError

Las pruebas también verifican la función auxiliar `isDatabaseError()` que determina si un error es relacionado con la base de datos:

```javascript
it('debe retornar true para errores con código ER_', () => {
  const error = new Error('Duplicate entry');
  error.code = 'ER_DUP_ENTRY';
  expect(isDatabaseError(error)).toBe(true);
});
```

---

## Pruebas de Integración

Las pruebas de integración verifican el comportamiento de las rutas API completas, simulando solicitudes HTTP reales mediante supertest.

### Rutas de Autenticación ([`auth.routes.test.js`](backend/__tests__/integration/auth.routes.test.js))

Este archivo contiene 214 líneas de pruebas para las rutas de autenticación ubicadas en [`backend/routes/auth.js`](backend/routes/auth.js).

#### POST /api/login

| Escenario | Respuesta Esperada |
| --------- | ------------------ |
| Sin email | 400 Bad Request |
| Sin password | 400 Bad Request |
| Usuario inexistente | 401 Unauthorized |
| Contraseña incorrecta | 401 Unauthorized |
| Credenciales válidas | 200 OK con token |

#### POST /api/usuarios (Registro)

| Escenario | Respuesta Esperada |
| --------- | ------------------ |
| Campos faltantes | 400 Bad Request |
| Email inválido | 400 Bad Request |
| Contraseña muy corta | 400 Bad Request |
| Contraseña sin requisitos | 400 Bad Request |
| Usuario creado exitosamente | 201 Created |
| Email duplicado | 409 Conflict |

#### Verificación de Seguridad

Las pruebas incluyen verificación de seguridad contra inyección SQL:

```javascript
it('debe usar consultas parametrizadas para prevenir inyección SQL', async () => {
  await request(app)
    .post('/api/login')
    .send({ email: "'; DROP TABLE USUARIOS; --", password: 'password' });

  expect(mockPool.query).toHaveBeenCalledWith(
    expect.stringContaining('WHERE email = ?'),
    expect.arrayContaining(["'; DROP TABLE USUARIOS; --"])
  );
});
```

### Rutas de Canchas ([`canchas.routes.test.js`](backend/__tests__/integration/canchas.routes.test.js))

Este archivo contiene 154 líneas de pruebas para las rutas de gestión de canchas ubicadas en [`backend/routes/canchas.js`](backend/routes/canchas.js).

#### Endpoints Probados

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/canchas | Listar todas las canchas |
| GET | /api/canchas/top | Canchas más populares |
| GET | /api/canchas/:idCancha | Obtener una cancha |
| GET | /api/canchas/by-slug/:slug | Obtener por slug |
| GET | /api/canchas/stats | Estadísticas (requiere admin) |
| POST | /api/canchas | Crear cancha (requiere admin) |
| PUT | /api/canchas/:idCancha | Actualizar (requiere admin) |
| DELETE | /api/canchas/:idCancha | Eliminar (requiere admin) |

#### Casos de Prueba Cubiertos

- Retorno de lista vacía cuando no hay canchas
- Retorno de 404 para canchas inexistentes
- Validación de ID inválido (400 Bad Request)
- Verificación de autenticación para rutas protegidas

### Rutas de Reservaciones ([`reservaciones.routes.test.js`](backend/__tests__/integration/reservaciones.routes.test.js))

Este archivo contiene 233 líneas de pruebas para las rutas de reservaciones ubicadas en [`backend/routes/reservaciones.js`](backend/routes/reservaciones.js).

#### Endpoints Probados

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/reservaciones | Listar (público con filtros) |
| GET | /api/reservaciones/usuario | Mis reservaciones |
| GET | /api/reservaciones/:idReservacion | Obtener una |
| POST | /api/reservaciones | Crear reservación |
| PUT | /api/reservaciones/:idReservacion | Actualizar |
| DELETE | /api/reservaciones/:idReservacion | Cancelar |

#### Validaciones Probadas

| Escenario | Respuesta Esperada |
| --------- | ------------------ |
| Sin autenticación | 401 Unauthorized |
| Campos requeridos faltantes | 400 Bad Request |
| Monto inválido (negativo) | 400 Bad Request |
| Formato de fecha inválido | 400 Bad Request |
| Hora fin anterior a inicio | 400 Bad Request |
| ID inválido | 400 Bad Request |

---

## Mocks y Configuración de Pruebas

### Mock de Base de Datos

Las pruebas utilizan un mock del pool de conexiones de MySQL ubicado en [`backend/__tests__/mocks/db.mock.js`](backend/__tests__/mocks/db.mock.js):

```javascript
const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn(),
};

jest.mock('../../config/db', () => ({
  pool: mockPool,
}));
```

### Variables de Entorno de Prueba

Las pruebas configuran las siguientes variables de entorno:

```javascript
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
```

### Middleware de Error

Las rutas de integración utilizan el middleware de manejo de errores de base de datos real:

```javascript
const dbErrorHandler = require('../../middlewares/dbErrorHandler');
app.use(dbErrorHandler);
```

---

## Ejecución de Pruebas

### Ejecutar Todas las Pruebas

```bash
cd backend
npm test
```

### Ejecutar en Modo Watch

```bash
npm run test:watch
```

### Ejecutar con Cobertura

```bash
npm run test:coverage
```

### Ejecutar Pruebas Específicas

```bash
# Solo pruebas unitarias
npm test -- --testPathPattern=unit

# Solo pruebas de integración
npm test -- --testPathPattern=integration

# Solo pruebas de auth
npm test -- --testPathPattern=auth
```

---

## Buenas Prácticas Utilizadas

1. **Separación de Concerns**: Las pruebas unitarias verifican componentes aislados, mientras que las pruebas de integración verifican la interacción entre múltiples componentes.

2. **Mocks de Dependencias Externas**: La base de datos y servicios externos (como email) son mockingados para permitir pruebas rápidas y confiables.

3. **Limpieza entre Pruebas**: Se utiliza `jest.clearAllMocks()` en `beforeEach` para garantizar el aislamiento entre pruebas.

4. **Verificación de Seguridad**: Las pruebas incluyen casos que verifican la protección contra inyección SQL mediante consultas parametrizadas.

5. **Cobertura de Casos Edge**: Se prueban escenarios como tokens expirados, formatos inválidos, y errores de base de datos específicos.

6. **Autenticación en Pruebas**: Las rutas protegidas son probadas tanto con como sin autenticación para verificar el comportamiento correcto.

---

## Cobertura de Pruebas

Las pruebas actuales cubren:

- **Middleware de autenticación**: 100% de los casos de validación de tokens
- **Middleware de manejo de errores DB**: 100% de los códigos de error MySQL conocidos
- **Rutas de autenticación**: Login y registro con todas las validaciones
- **Rutas de canchas**: CRUD completo con validaciones de autorización
- **Rutas de reservaciones**: Creación, lectura, actualización y cancelación

Para ampliar la cobertura, se recomienda agregar pruebas para:
- Rutas de perfil de usuario
- Rutas de administración de usuarios
- Casos de integración end-to-end más complejos
