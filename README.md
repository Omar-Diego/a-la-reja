# Aplicación de Reservación de Canchas de Pádel

API REST para la gestión de reservas de canchas de pádel. Permite a los usuarios registrarse, iniciar sesión, consultar disponibilidad de canchas y realizar reservaciones.

## Descripción

Esta API proporciona endpoints para:
- Autenticación de usuarios (registro e inicio de sesión)
- Gestión de canchas disponibles
- Creación, consulta, modificación y cancelación de reservaciones
- Validación de horarios para evitar conflictos

## Características Principales

- **Autenticación Segura**: Sistema de login con tokens JWT
- **Gestión de Usuarios**: Registro y autenticación de usuarios con encriptación de contraseñas
- **Catálogo de Canchas**: Consulta de canchas disponibles con precios por hora
- **Sistema de Reservas**: Creación de reservaciones con validación de disponibilidad
- **Validación de Horarios**: Evita conflictos de horarios en las reservaciones
- **Gestión Completa de Reservas**: Los usuarios pueden crear, ver, editar y cancelar sus reservaciones

## Tecnologías Usadas

| Tecnología | Propósito |
|------------|-----------|
| [Node.js](https://nodejs.org/) | Entorno de ejecución JavaScript |
| [Express](https://expressjs.com/) | Framework web para API REST |
| [MySQL](https://www.mysql.com/) | Base de datos relacional |
| [MySQL2](https://www.npmjs.com/package/mysql2) | Driver de MySQL para Node.js |
| [JWT](https://jwt.io/) | Autenticación basada en tokens |
| [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Encriptación de contraseñas |
| [dotenv](https://www.npmjs.com/package/dotenv) | Variables de entorno |
| [cors](https://www.npmjs.com/package/cors) | Manejo de CORS |

## Estructura del Proyecto

```
proyecto/
├── .env                 # Variables de entorno
├── .gitignore           # Archivos ignorados por Git
├── index.js             # Punto de entrada de la aplicación
├── package.json         # Dependencias y scripts del proyecto
├── config/
│   └── db.js            # Configuración de conexión a MySQL
├── middlewares/
│   └── auth.js          # Middleware de autenticación JWT
└── routes/
    ├── usuarios.js      # Rutas de usuarios y login
    ├── canchas.js       # Rutas de gestión de canchas
    └── reservaciones.js # Rutas de gestión de reservaciones
```

## Descripción de Carpetas y Archivos

### Archivos del Raíz

| Archivo | Descripción |
|---------|-------------|
| `.env` | Archivo de configuración con variables de entorno (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET) |
| `.gitignore` | Define qué archivos/directorios ignorar en Git |
| `index.js` | Archivo principal que configura Express y carga las rutas |
| `package.json` | Metadatos del proyecto y lista de dependencias |

### Directorio `config/`

| Archivo | Descripción |
|---------|-------------|
| `db.js` | Configuración de la conexión a MySQL usando mysql2 |

### Directorio `middlewares/`

| Archivo | Descripción |
|---------|-------------|
| `auth.js` | Middleware que verifica tokens JWT en las solicitudes protegidas |

### Directorio `routes/`

| Archivo | Descripción |
|---------|-------------|
| `usuarios.js` | Endpoints para registro de usuarios y login |
| `canchas.js` | Endpoints para consultar canchas disponibles |
| `reservaciones.js` | Endpoints CRUD para gestión de reservaciones |

## Prerrequisitos

- **Node.js** (versión 14 o superior)
- **MySQL** (versión 8.0 o superior)
- **npm** (incluido con Node.js)

### Base de Datos

La aplicación requiere una base de datos MySQL llamada `padel_db` con las siguientes tablas:

```sql
CREATE TABLE USUARIOS (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE CANCHAS (
    idCancha INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    precio_por_hora DECIMAL(10,2) NOT NULL
);

CREATE TABLE RESERVACIONES (
    idReservacion INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    USUARIOS_idUsuario INT,
    CANCHAS_idCancha INT,
    FOREIGN KEY (USUARIOS_idUsuario) REFERENCES USUARIOS(idUsuario),
    FOREIGN KEY (CANCHAS_idCancha) REFERENCES CANCHAS(idCancha)
);
```

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd dfs-borrador-avance-proyecto-final
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=padel_db
DB_PORT=3306

# Clave Secreta para JWT
JWT_SECRET=clave_super_secreta
```

### 4. Crear la Base de Datos

Ejecutar el script SQL para crear las tablas necesarias en MySQL.

### 5. Iniciar el Servidor

```bash
node index.js
```

El servidor se iniciará en el puerto **3000**.

## Endpoints

### 🔐 Autenticación

| Método | Endpoint | Descripción | Requiere Token |
|--------|----------|-------------|----------------|
| POST | `/api/login` | Iniciar sesión | No |
| POST | `/api/usuarios` | Registrar nuevo usuario | No |

#### POST `/api/login`

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/usuarios`

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "message": "Usuario creado",
  "id": 1
}
```

---

### 🏟️ Canchas

| Método | Endpoint | Descripción | Requiere Token |
|--------|----------|-------------|----------------|
| GET | `/api/canchas` | Listar todas las canchas | No |

#### GET `/api/canchas`

**Respuesta:**
```json
[
  {
    "nombre": "Cancha 1",
    "ubicacion": "Calle Principal 123",
    "precio_por_hora": 50.00
  },
  {
    "nombre": "Cancha 2",
    "ubicacion": "Avenida Central 456",
    "precio_por_hora": 60.00
  }
]
```

---

### 📅 Reservaciones

| Método | Endpoint | Descripción | Requiere Token |
|--------|----------|-------------|----------------|
| POST | `/api/reservaciones` | Crear nueva reservación | Sí |
| GET | `/api/reservaciones` | Listar todas las reservaciones | No |
| GET | `/api/reservaciones?fecha=YYYY-MM-DD&canchaId=1` | Ver disponibilidad | No |
| GET | `/api/reservaciones/usuario` | Mis reservaciones | Sí |
| PUT | `/api/reservaciones/:idReservacion` | Editar reservación | Sí |
| DELETE | `/api/reservaciones/:idReservacion` | Cancelar reservación | Sí |

#### POST `/api/reservaciones`

**Body:**
```json
{
  "fecha": "2026-02-15",
  "hora_inicio": "10:00:00",
  "hora_fin": "11:00:00",
  "idCancha": 1
}
```

**Encabezados:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "Reservación creada",
  "idReservacion": 1
}
```

#### GET `/api/reservaciones?fecha=2026-02-15&canchaId=1`

Consulta la disponibilidad de una cancha en una fecha específica.

**Respuesta:**
```json
[
  {
    "idReservacion": 1,
    "hora_inicio": "10:00:00",
    "hora_fin": "11:00:00"
  }
]
```

#### PUT `/api/reservaciones/:idReservacion`

**Body:**
```json
{
  "fecha": "2026-02-16",
  "hora_inicio": "14:00:00",
  "hora_fin": "15:00:00",
  "idCancha": 2
}
```

**Encabezados:**
```
Authorization: Bearer <token>
```

#### DELETE `/api/reservaciones/:idReservacion`

**Encabezados:**
```
Authorization: Bearer <token>
```

## 🔒 Autenticación

Para endpoints protegidos, incluir el token JWT en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📄 Licencia

ISC

## Autores

Omar Sebastian Diego Cortes
Paola Fuentes Bustamante
Fernando David Rodriguez Ortega
