# A La Reja - Sistema de Reservación de Canchas de Pádel

<div align="center">

[![Ver Aplicación en Producción](https://img.shields.io/badge/Ver_Aplicación_en_Producción-10b981?style=for-the-badge&logo=rocket)](https://a-la-reja.vercel.app/)

**Demo en vivo:** [**https://a-la-reja.vercel.app/**](https://a-la-reja.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Express](https://img.shields.io/badge/Express-5.2.1-grey?style=for-the-badge&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-5.0.0--beta.30-000000?style=for-the-badge)

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)

**Estado del Proyecto:** En Producción

</div>

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](docs/Architecture.md)
- [Autenticación](docs/Authentication.md)
  - [Configuración de NextAuth](docs/NextAuthConfiguration.md)
  - [Contexto de Autenticación del Frontend](docs/FrontendAuthContext.md)
  - [Protección de Rutas](docs/RouteProtection.md)
- [Frontend](docs/Frontend.md)
  - [Application Shell](docs/ApplicationShell.md)
  - [Página de Inicio](docs/LandingPage.md)
  - [Dashboard y Mis Reservas](docs/UserDashboard&MyReservations.md)
  - [Flujo de Reservación de Canchas](docs/CourtReservationFlow.md)
  - [Perfil de Usuario](docs/UserProfile.md)
  - [Interfaz de Administración](docs/AdminInterface.md)
- [API del Backend](docs/BackendAPI.md)
  - [Configuración del Servidor y Middleware](docs/ServerSetup&Middleware.md)
  - [API de Reservaciones](docs/ReservaitonsAPI.md)
  - [API de Usuarios](docs/UsersAPI.md)
  - [API de Canchas](docs/CourtsAPI.md)
  - [Notificaciones por Correo](docs/EmailNotifications.md)
- [Base de Datos](docs/Database.md)
  - [Esquema](docs/Schema.md)
  - [Migraciones](docs/Migrations.md)
  - [Pool de Conexiones](docs/ConnectionPool.md)
- [Despliegue y Configuración](docs/Deployment&Configuration.md)
  - [Configuración de Docker](docs/DockerSetup.md)
  - [Variables de Entorno y Configuración](docs/EnvironmentVariables&Configuration.md)
- [Pruebas](docs/Testing.md)


## Descripción General

Esta sección presenta A La Reja a alto nivel: qué hace, su arquitectura de tres capas y sus características técnicas principales. Para una cobertura más detallada de cada subsistema, consulta las páginas relacionadas enlazadas a lo largo del documento, en particular [Arquitectura](docs/Architecture.md), [Autenticación](docs/Authentication.md), [Frontend](docs/Frontend.md), [API del Backend](docs/BackendAPI.md), [Base de Datos](docs/Database.md) y [Despliegue y Configuración](docs/Deployment&Configuration.md).

## ¿Qué es A La Reja?

A La Reja es una aplicación web full-stack para reservar canchas de pádel. Los usuarios registrados pueden explorar las canchas disponibles, seleccionar horarios y crear o cancelar reservaciones. Una cuenta de administrador ofrece una interfaz de gestión separada con visibilidad global sobre reservaciones, usuarios y canchas.

**URL de Producción:** https://a-la-reja.vercel.app/

**Estado actual:** En producción con gestión completa de usuarios, autenticación y CRUD de reservaciones. El procesamiento de pagos aún no está implementado.

**Restricción de plataforma:** La aplicación es exclusiva para escritorio. Los dispositivos con ancho de ventana menor o igual a 768px son bloqueados mediante media queries CSS implementadas en `MobileBlocker`. Consulta [Application Shell](docs/ApplicationShell.md) para más detalles.

## Stack Tecnológico

### Frontend

| Dependencia  | Versión       | Rol                           |
| ------------ | ------------- | ----------------------------- |
| Next.js      | 16.1.6        | App Router, SSR, enrutamiento |
| React        | 19.2.3        | Renderizado de UI             |
| TypeScript   | 5.0           | Seguridad de tipos            |
| Tailwind CSS | 4.x           | Estilos                       |
| NextAuth.js  | 5.0.0-beta.30 | Gestión de sesiones           |
| js-cookie    | 3.0.5         | Almacenamiento de tokens      |

### Backend

| Dependencia  | Versión | Rol                                 |
| ------------ | ------- | ----------------------------------- |
| Express.js   | 5.2.1   | Servidor HTTP de la API             |
| mysql2       | 3.16.2  | Driver MySQL + pool de conexiones   |
| jsonwebtoken | 9.0.3   | Emisión de JWT                      |
| bcryptjs     | 3.0.3   | Hashing de contraseñas              |
| helmet       | latest  | Cabeceras de seguridad              |
| cors         | 2.8.6   | Control de acceso de origen cruzado |

### Infraestructura

| Componente     | Versión  | Host                     | Rol                                    |
| -------------- | -------- | ------------------------ | -------------------------------------- |
| MySQL          | 8.0      | Contenedor Docker en VPS | Base de datos relacional               |
| Docker Compose | latest   | VPS                      | Orquesta el backend y la base de datos |
| Vercel         | platform | Cloud                    | Hosting del frontend + CDN             |

## Arquitectura de Tres Capas

El frontend se despliega en Vercel de forma independiente al backend. El backend y la base de datos corren juntos en Docker Compose sobre un VPS y se comunican a través de una red interna de Docker (`app_network`). Todas las llamadas HTTP del frontend al backend llevan un JWT `Bearer` en el encabezado `Authorization`, ensamblado por `getAuthHeader()` en `AuthContext`.

## Características Principales

### Autenticación de Doble Vía

La autenticación tiene dos rutas completamente separadas gestionadas por `auth.ts`:

| Vía             | Quién                                    | Fuente de credenciales                                |
| --------------- | ---------------------------------------- | ----------------------------------------------------- |
| Administrador   | Un único administrador predefinido       | Variables de entorno `ADMIN_EMAIL` + `ADMIN_PASSWORD` |
| Usuario regular | Usuarios registrados en la base de datos | Tabla `USUARIOS` (hash bcrypt)                        |

En ambos casos el token termina en el campo `accesToken` de la sesión de NextAuth y es reflejado en una cookie del navegador por `AuthContext`. Consulta [Autenticación](docs/Authentication.md) para un recorrido completo.

## Reservaciones con Control de Concurrencia

El endpoint de creación de reservaciones (`POST /api/reservaciones` en `backend/routes/reservaciones.js`) utiliza una transacción de base de datos con bloqueo a nivel de fila para evitar reservaciones dobles:

- La cláusula `SELECT ... FOR UPDATE` bloquea las filas coincidentes hasta que la transacción se complete, por lo que las solicitudes concurrentes no pueden pasar ambas la verificación de conflicto para el mismo horario. Consulta [API de Reservaciones](docs/ReservaitonsAPI.md) para más detalles.

## Bloqueo en Dispositivos Móviles

La aplicación es exclusivamente para escritorio. El mecanismo tiene tres partes:

| Parte                    | Archivo                             | Mecanismo                                                              |
| ------------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| Componente MobileBlocker | app/components/ui/MobileBlocker.tsx | Muestra un mensaje de acceso bloqueado con la marca del proyecto       |
| Media query CSS          | app/globals.css líneas 19–27        | En max-width: 768px, oculta .desktop-content y muestra .mobile-blocker |
| Integración en el layout | app/layout.tsx línea 46             | Envuelve todos los hijos de la página en MobileBlocker                 |

Ambas ramas del DOM siempre se renderizan; el CSS controla la visibilidad. Consulta [Application Shell](docs/ApplicationShell.md) para más detalles.

## Interfaz de Administración

El grupo de rutas `/admin` es accesible únicamente para sesiones con `role: "admin"`. Proporciona:

- Dashboard (`/admin`) — estadísticas del sitio, calendario de reservaciones con código de colores, transacciones recientes.
- Reservaciones (`/admin/reservaciones`) — gestión completa de la lista de reservaciones.
- Usuarios (`/admin/usuarios`) — CRUD de usuarios.
- Canchas (`/admin/canchas`) — CRUD de canchas.

`middleware.ts` redirige cualquier sesión sin rol de administrador que intente acceder a `/admin/*` hacia `/dashboard`. Consulta [Interfaz de Administración](docs/AdminInterface.md) y [Protección de Rutas](docs/RouteProtection.md).
