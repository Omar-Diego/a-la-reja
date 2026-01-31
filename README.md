# 🏟️ A La Reja - Sistema de Reservación de Canchas de Pádel

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Express](https://img.shields.io/badge/Express-5.2.1-grey?style=for-the-badge&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-5.0.0--beta.30-000000?style=for-the-badge)

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)

**Estado del Proyecto:** 🚀 En Producción  
**Versión:** 0.1.0

</div>

---

## 📋 Descripción

**A La Reja** es una aplicación web completa para la gestión y reservación de canchas de pádel. Permite a los usuarios consultar disponibilidad, realizar reservas de canchas en horarios específicos, gestionar sus reservaciones y visualizar el historial de partidos jugados.

El sistema está construido con una arquitectura **full-stack** que incluye:

- **Frontend:** Next.js 16 con TypeScript, React 19 y Tailwind CSS v4
- **Backend:** Express.js con API REST
- **Base de Datos:** MySQL 8.0 con pool de conexiones
- **Autenticación:** NextAuth.js v5 (Auth.js) + JWT
- **Despliegue:** Docker Compose para backend + Vercel para frontend

---

## ✨ Características Principales

### 👥 Gestión de Usuarios

- **Registro de usuarios** con validación de datos y encriptación de contraseñas (bcryptjs)
- **Inicio de sesión** con tokens JWT
- **Gestión de perfil** con actualización de datos personales
- **Sistema de autenticación seguro** mediante NextAuth.js
- **Persistencia de sesiones** con cookies seguras

### 🏸 Reservación de Canchas

- **Catálogo de canchas** con información de ubicación y precios por hora
- **Calendario interactivo** para selección de fechas
- **Selección de horarios** disponibles en tiempo real
- **Validación de disponibilidad** para evitar conflictos
- **Confirmación de reservas** con resumen de detalles
- **Historial de reservaciones** (próximas y completadas)

### 🔒 Seguridad

- **Autenticación JWT** con tokens firmados criptográficamente
- **Protección de rutas** mediante middleware de autenticación
- **Encriptación de contraseñas** con bcrypt (10 rondas de salt)
- **Prevención de inyección SQL** mediante consultas parametrizadas
- **Validación de entrada** en todos los endpoints
- **Transacciones de base de datos** para prevenir race conditions

### 🛡️ Prevención de Conflictos

- **Bloqueo de filas** (FOR UPDATE) durante transacciones
- **Validación de horarios** para evitar reservas duplicadas
- **Validación de fechas pasadas** en el frontend
- **Bloqueo de horarios ya reservados** en tiempo real

### 📱 Experiencia Desktop Exclusiva

- **Bloqueo de dispositivos móviles** mediante CSS media queries (max-width: 768px)
- **Componente MobileBlocker** que muestra mensaje personalizado en móviles
- **Interfaz optimizada** exclusivamente para pantallas de escritorio
- Los usuarios en móviles ven un mensaje instructivo: "Mejor experiencia en PC"
- El contenido principal está oculto en dispositivos móviles
- Ver: [`app/components/ui/MobileBlocker.tsx`](app/components/ui/MobileBlocker.tsx)

---

## 🏗️ Arquitectura del Proyecto

```
a_la_reja/
├── app/                          # Frontend (Next.js 16)
│   ├── api/                      # API routes de Next.js
│   │   └── auth/                 # NextAuth.js handlers
│   │       └── [...nextauth]/    # Configuración de autenticación
│   ├── components/               # Componentes reutilizables
│   │   ├── layout/               # Componentes de layout (Header, Footer, etc.)
│   │   ├── landing/              # Componentes de página principal
│   │   ├── providers/            # Context providers (SessionProvider)
│   │   └── ui/                   # Componentes UI (Button, Cards, Badge, **MobileBlocker**)
│   ├── context/                  # React Context (AuthContext)
│   ├── dashboard/                # Página del dashboard
│   ├── login/                    # Página de inicio de sesión
│   ├── register/                 # Página de registro
│   ├── reservar/                 # Flujo de reservación
│   │   ├── [cancha]/             # Selección de fecha y hora
│   │   └── [cancha]/confirmar/   # Confirmación de reserva
│   ├── mis_reservas/             # Historial de reservaciones
│   ├── perfil/                   # Perfil del usuario
│   ├── lib/                      # Utilidades y tipos (types.ts, constants.ts)
│   └── layout.tsx                # Layout raíz con **MobileBlocker** integrado
│
├── backend/                      # Backend (Express.js)
│   ├── config/                   # Configuración (db.js - pool de conexiones)
│   ├── middlewares/              # Middlewares (auth.js)
│   ├── routes/                   # Rutas de la API
│   │   ├── usuarios.js           # Endpoints de usuarios y autenticación
│   │   ├── canchas.js            # Endpoints de canchas
│   │   └── reservaciones.js      # Endpoints de reservaciones
│   ├── Dockerfile                # Imagen Docker del backend
│   ├── index.js                  # Punto de entrada del servidor
│   └── package.json              # Dependencias del backend
│
├── migrations/                   # Scripts de base de datos
│   ├── 001_create_tables.sql     # Creación de tablas
│   ├── 002_seed_canchas.sql      # Datos iniciales de canchas
│   └── 003_add_telefono.sql      # Migración de teléfono
│
├── types/                        # Tipos TypeScript (next-auth.d.ts)
├── docker-compose.yml            # Orquestación Docker (MySQL + Backend)
├── next.config.ts                # Configuración de Next.js
├── tailwind.config.mjs           # Configuración de Tailwind CSS
├── tsconfig.json                 # Configuración de TypeScript
├── auth.ts                       # Configuración de NextAuth.js
└── package.json                  # Dependencias del frontend
```

### 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA DEL SISTEMA                        │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐         ┌────────────────┐         ┌────────────────┐
  │   Navegador  │◄──────►│  Frontend      │◄──────►│   Backend API   │
  │   (Usuario)  │  HTTPS  │  Next.js 16    │  HTTPS  │   Express.js   │
  └──────────────┘         └────────────────┘         └───────┬────────┘
                                                               │
                                                               │ TCP
                                                               ▼
                                                 ┌────────────────────────┐
                                                 │    Base de Datos       │
                                                 │    MySQL 8.0           │
                                                 │    (Pool de Conexiones)│
                                                 └────────────────────────┘
```

### 🔐 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTENTICACIÓN                            │
└─────────────────────────────────────────────────────────────────────┘

  1. Usuario envía credenciales
     POST /api/login { email, password }
                        │
                        ▼
  2. Backend verifica credenciales (bcrypt)
                        │
                        ▼
  3. Backend genera JWT token (1 hora de validez)
     Returns: { token, user }
                        │
                        ▼
  4. Frontend almacena token (Cookies + SessionStorage)
                        │
                        ▼
  5. Frontend incluye token en headers
     Authorization: Bearer <token>
                        │
                        ▼
  6. Middleware auth.js verifica token JWT
                        │
                        ▼
  7. Acceso a rutas protegidas
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend

| Tecnología   | Versión    | Propósito            |
| ------------ | ---------- | -------------------- |
| Next.js      | 16.1.6     | Framework web React  |
| React        | 19.2.3     | Biblioteca de UI     |
| TypeScript   | 5.0        | Tipado estático      |
| Tailwind CSS | 4.x        | Framework de estilos |
| NextAuth.js  | 5.0.0-beta | Autenticación        |
| js-cookie    | 3.0.5      | Gestión de cookies   |

### Backend

| Tecnología   | Versión | Propósito                   |
| ------------ | ------- | --------------------------- |
| Node.js      | 20+     | Entorno de ejecución        |
| Express      | 5.2.1   | Framework web API REST      |
| MySQL2       | 3.16.2  | Driver de base de datos     |
| bcryptjs     | 3.0.3   | Encriptación de contraseñas |
| jsonwebtoken | 9.0.3   | Tokens JWT                  |
| cors         | 2.8.6   | Control de acceso HTTP      |
| dotenv       | 17.2.3  | Variables de entorno        |

### Infraestructura

| Tecnología     | Propósito                 |
| -------------- | ------------------------- |
| Docker         | Contenedorización         |
| Docker Compose | Orquestación de servicios |
| MySQL 8.0      | Base de datos relacional  |
| Vercel         | Despliegue del frontend   |

---

## 📦 Tipos de Datos Principales

### Court (Cancha)

```typescript
interface Court {
  idCancha: number;
  nombre: string;
  ubicacion: string;
  precio_por_hora: number;
}
```

### Reservation (Reservación)

```typescript
interface Reservation {
  idReservacion: number;
  fecha: string; // Formato: YYYY-MM-DD
  hora_inicio: string; // Formato: HH:MM:SS
  hora_fin: string; // Formato: HH:MM:SS
  cancha: string;
  ubicacion?: string;
}
```

### User (Usuario)

```typescript
interface User {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
}
```

### BookedSlot (Horario Ocupado)

```typescript
interface BookedSlot {
  idReservacion: number;
  hora_inicio: string;
  hora_fin: string;
}
```

---

## 📱 Bloqueo de Dispositivos Móviles

La aplicación incluye un sistema de bloqueo mediante CSS media queries para restringir el acceso desde dispositivos móviles:

### Implementación

**Componente:** [`app/components/ui/MobileBlocker.tsx`](app/components/ui/MobileBlocker.tsx)

**CSS:** [`app/globals.css`](app/globals.css:19-27)

```css
/* Mobile blocker - mostrar mensaje en móvil, ocultar contenido */
.mobile-blocker {
  display: none;
}

.desktop-content {
  display: block;
}

@media (max-width: 768px) {
  .mobile-blocker {
    display: block;
  }

  .desktop-content {
    display: none;
  }
}
```

### Comportamiento

- **En Desktop (> 768px):** Se muestra el contenido normal de la aplicación
- **En Móvil (≤ 768px):** Se muestra un mensaje instructivo: "Mejor experiencia en PC"
- El mensaje incluye un diseño atractivo con el logo de A La Reja y una explicación

### Integración

El `MobileBlocker` está integrado en el [`app/layout.tsx`](app/layout.tsx:46) y envuelve todo el contenido de la aplicación, proporcionando protección a nivel de raíz.

---

## ⚙️ Backend - Detalle Técnico

### Descripción General

El backend de **A La Reja** está construido con **Express.js** y proporciona una API RESTful completa para la gestión del sistema de reservaciones. El servidor está diseñado con enfoque en seguridad, rendimiento y escalabilidad.

### Características Técnicas del Backend

#### Pool de Conexiones a Base de Datos

El backend utiliza **mysql2/promise** con un pool de conexiones configurado en [`backend/config/db.js`](backend/config/db.js):

```javascript
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  connectionLimit: 10, // Máximo de conexiones en el pool
  queueLimit: 0, // Cola de conexiones ilimitada
  waitForConnections: true, // Esperar conexión disponible
  connectTimeout: 10000, // Timeout de 10 segundos
  multipleStatements: false, // Deshabilitado por seguridad
  timezone: "local",
  charset: "utf8mb4",
};
```

**Beneficios del pool de conexiones:**

- Reutilización de conexiones para mejor rendimiento
- Límite de conexiones para prevenir agotamiento de recursos
- Cola de conexiones para manejar picos de tráfico
- Manejo automático de conexiones caídas

#### Middleware de Autenticación JWT

El archivo [`backend/middlewares/auth.js`](backend/middlewares/auth.js) implementa verificación de tokens JWT:

```javascript
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};
```

**Características de seguridad:**

- Verificación de token en cada solicitud protegida
- Extracción de ID de usuario del token (no de la solicitud)
- Manejo de tokens expirados o inválidos

#### Manejo de Errores

El middleware [`backend/middlewares/dbErrorHandler.js`](backend/middlewares/dbErrorHandler.js) proporciona manejo asíncrono de errores:

```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### Estructura de Rutas del Backend

```
backend/
├── index.js                    # Punto de entrada + configuración Express
├── config/
│   └── db.js                  # Pool de conexiones MySQL
├── middlewares/
│   ├── auth.js                # Verificación JWT
│   └── dbErrorHandler.js      # Manejo de errores asíncronos
└── routes/
    ├── usuarios.js            # Endpoints de autenticación y usuarios
    ├── canchas.js             # Endpoints de gestión de canchas
    └── reservaciones.js       # Endpoints CRUD de reservaciones
```

### Configuración del Servidor Express

**Puerto y Entorno:**

- Puerto configurable vía `PORT` (default: 3001)
- Modo de entorno: `production` o `development`

**Middleware Principal:**

```javascript
// CORS configurado para permitir origen del frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Limitación de tamaño de cuerpo JSON (10kb)
app.use(express.json({ limit: "10kb" }));

// Logging en desarrollo
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}
```

### Transacciones y Prevención de Race Conditions

El endpoint de creación de reservaciones implementa **transacciones SQL** con bloqueo de filas:

```javascript
// Obtener conexión del pool
const connection = await pool.getConnection();

try {
  await connection.beginTransaction();

  // Consulta con FOR UPDATE (bloquea las filas)
  const validarSql = `
    SELECT idReservacion FROM RESERVACIONES
    WHERE fecha = ? AND CANCHAS_idCancha = ?
    AND (hora_inicio < ? AND hora_fin > ?)
    LIMIT 1 FOR UPDATE
  `;

  const [existentes] = await connection.query(validarSql, [
    fecha, idCancha, hora_fin, hora_inicio
  ]);

  if (existentes.length > 0) {
    await connection.rollback();
    return res.status(409).json({
      error: "La cancha ya esta reservada en ese horario",
    });
  }

  // Insertar reservación
  const insertSql = `INSERT INTO RESERVACIONES ...`;
  const [result] = await connection.query(insertSql, [...]);

  await connection.commit();
  res.status(201).json({ message: "Reservacion creada", idReservacion: result.insertId });
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

### Validaciones de Entrada

Todas las rutas implementan validación exhaustiva:

**Validación de fecha:**

```javascript
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(fecha)) {
  return res
    .status(400)
    .json({ error: "Formato de fecha invalido. Use YYYY-MM-DD" });
}
```

**Validación de hora:**

```javascript
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
if (!timeRegex.test(hora_inicio) || !timeRegex.test(hora_fin)) {
  return res
    .status(400)
    .json({ error: "Formato de hora invalido. Use HH:MM o HH:MM:SS" });
}
```

**Validación de lógica de negocio:**

```javascript
if (hora_inicio >= hora_fin) {
  return res
    .status(400)
    .json({ error: "La hora de fin debe ser posterior a la hora de inicio" });
}
```

### Salud del Servidor

Endpoint de verificación de salud:

```javascript
app.get("/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});
```

### Apagado Graceful

El servidor implementa manejo de señales para cierre limpio:

```javascript
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`[Server] Recibido ${signal}. Iniciando apagado...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });

    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** 20 o superior
- **Docker** y **Docker Compose**
- **npm** (incluido con Node.js)

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd a_la_reja
```

### 2. Configurar Variables de Entorno

#### Frontend (.env.local)

```env
# NextAuth Configuration
AUTH_SECRET=tu-auth-secret-generado-con-npx-auth-secret

# Backend API URL (VPS o servidor local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Backend (.env para Docker Compose)

```env
# Base de Datos
MYSQL_ROOT_PASSWORD=rootpassword
DB_USER=admin
DB_PASSWORD=root
DB_NAME=a_la_reja

# Seguridad
JWT_SECRET=tu-jwt-secret-muy-seguro

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Iniciar con Docker Compose (Backend + MySQL)

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 4. Instalar Dependencias del Frontend

```bash
# En la raíz del proyecto
npm install
```

### 5. Ejecutar en Desarrollo

```bash
# Frontend
npm run dev

# El servidor se ejecutará en http://localhost:3000
```

### 6. Construir para Producción

```bash
# Construir aplicación Next.js
npm run build

# Iniciar en producción
npm start
```

---

## 📡 Documentación de la API

### 🔐 Autenticación

#### POST `/api/login`

Inicia sesión de usuario y retorna un token JWT.

**Request:**

```json
{
  "email": "usuario@email.com",
  "password": "contraseña123"
}
```

**Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@email.com"
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "error": "Credenciales invalidas"
}
```

---

#### POST `/api/usuarios`

Registra un nuevo usuario en el sistema.

**Request:**

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "password": "contraseña123"
}
```

**Response (201 Created):**

```json
{
  "message": "Usuario creado exitosamente",
  "id": 1
}
```

**Response (400 Bad Request):**

```json
{
  "error": "La contrasena debe tener al menos 6 caracteres"
}
```

---

### 🏟️ Canchas

#### GET `/api/canchas`

Obtiene todas las canchas disponibles.

**Response (200 OK):**

```json
[
  {
    "idCancha": 1,
    "nombre": "Pista 1",
    "ubicacion": "Calle Principal 123",
    "precio_por_hora": 25.0
  },
  {
    "idCancha": 2,
    "nombre": "Pista 2",
    "ubicacion": "Avenida Central 456",
    "precio_por_hora": 20.0
  }
]
```

---

#### GET `/api/canchas/:idCancha`

Obtiene una cancha específica por ID.

**Response (200 OK):**

```json
{
  "idCancha": 1,
  "nombre": "Pista 1",
  "ubicacion": "Calle Principal 123",
  "precio_por_hora": 25.0
}
```

**Response (404 Not Found):**

```json
{
  "error": "Cancha no encontrada"
}
```

---

### 📅 Reservaciones

#### POST `/api/reservaciones`

Crea una nueva reservación.

**Headers:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "fecha": "2026-02-15",
  "hora_inicio": "10:00:00",
  "hora_fin": "11:00:00",
  "idCancha": 1
}
```

**Response (201 Created):**

```json
{
  "message": "Reservacion creada exitosamente",
  "idReservacion": 1
}
```

**Response (400 Bad Request):**

```json
{
  "error": "Formato de fecha invalido. Use YYYY-MM-DD"
}
```

**Response (409 Conflict):**

```json
{
  "error": "La cancha ya esta reservada en ese horario"
}
```

---

#### GET `/api/reservaciones?fecha=YYYY-MM-DD&canchaId=1`

Obtiene los horarios ocupados para una fecha y cancha específicas.

**Response (200 OK):**

```json
[
  {
    "idReservacion": 1,
    "hora_inicio": "10:00:00",
    "hora_fin": "11:00:00"
  }
]
```

---

#### GET `/api/reservaciones/usuario`

Obtiene las reservaciones del usuario autenticado.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
[
  {
    "idReservacion": 1,
    "fecha": "2026-02-15",
    "hora_inicio": "10:00:00",
    "hora_fin": "11:00:00",
    "cancha": "Pista 1",
    "ubicacion": "Calle Principal 123"
  }
]
```

---

#### DELETE `/api/reservaciones/:idReservacion`

Cancela una reservación existente.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Reservacion cancelada correctamente"
}
```

**Response (404 Not Found):**

```json
{
  "error": "Reservacion no encontrada o no pertenece al usuario"
}
```

---

#### PUT `/api/reservaciones/:idReservacion`

Modifica una reservación existente.

**Headers:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "fecha": "2026-02-16",
  "hora_inicio": "14:00:00",
  "hora_fin": "15:00:00",
  "idCancha": 2
}
```

**Response (200 OK):**

```json
{
  "message": "Reservacion modificada correctamente"
}
```

---

#### GET `/api/usuarios/me`

Obtiene el perfil del usuario autenticado.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "idUsuario": 1,
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "+52 55 1234 5678"
}
```

---

#### PUT `/api/usuarios/me`

Actualiza el perfil del usuario autenticado.

**Headers:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "nombre": "Juan Pérez Actualizado",
  "telefono": "+52 55 1234 5678"
}
```

**Response (200 OK):**

```json
{
  "message": "Perfil actualizado exitosamente",
  "user": {
    "idUsuario": 1,
    "nombre": "Juan Pérez Actualizado",
    "email": "juan@email.com",
    "telefono": "+52 55 1234 5678"
  }
}
```

---

## 📖 Guía de Uso

### Flujo de Reservación

1. **Registro/Login**
   - El usuario accede a `/register` o `/login`
   - Completa el formulario con sus datos
   - Recibe un token JWT almacenado en cookies

2. **Selección de Cancha**
   - Desde el dashboard, el usuario hace clic en "Reservar"
   - Visualiza las canchas disponibles con precios

3. **Selección de Fecha y Hora**
   - El usuario navega el calendario interactivo
   - Selecciona una fecha (fechas pasadas deshabilitadas)
   - El sistema muestra horarios disponibles en tiempo real
   - Horarios ya reservados aparecen marcados como ocupados

4. **Confirmación**
   - El usuario selecciona la duración (1h, 1.5h, 2h)
   - Puede añadir notas opcionales
   - Revisa el resumen de la reservación
   - Confirma la reserva

5. **Mis Reservas**
   - El usuario puede ver sus reservaciones próximas
   - Accede al historial de reservaciones completadas
   - Puede cancelar reservaciones futuras

---

## 🐳 Despliegue con Docker

### Construcción de Imágenes

```bash
# Construir imagen del backend
cd backend
docker build -t a-la-reja-backend .

# O usar docker-compose
docker-compose build
```

### Variables de Entorno en Producción

```env
# Backend (VPS)
MYSQL_ROOT_PASSWORD=password-seguro
DB_USER=admin
DB_PASSWORD=password-seguro
DB_NAME=a_la_reja
JWT_SECRET=clave-muy-segura-minimo-32-caracteres
FRONTEND_URL=https://a-la-reja.vercel.app
```

---

## 🤝 Contribuir

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y commitea (`git commit -m 'Add nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia ISC.

---

## 👥 Autores

- **Omar Sebastian Diego Cortes**
- **Paola Fuentes Bustamante**
- **Fernando David Rodriguez Ortega**

---

## 📞 Contacto

Para consultas o soporte, contacta a los autores directamente a través del repositorio.

---

<div align="center">

**¡Gracias por usar A La Reja! 🏟️**

</div>
