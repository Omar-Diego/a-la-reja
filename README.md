# 🎾 A La Reja - Sistema de Reservación de Canchas de Pádel

<div align="center">

[![🚀 Ver Aplicación en Producción](https://img.shields.io/badge/🚀-Ver_Aplicación_en_Producción-10b981?style=for-the-badge&logo=rocket)](https://a-la-reja.vercel.app/)

**🌐 Live Demo:** [**https://a-la-reja.vercel.app/**](https://a-la-reja.vercel.app/)

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

</div>

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Primeros pasos](#primeros-pasos)
- [Arquitectura del sistema](#arquitectura-del-sistema)
  - [Arquitectura de seguridad](#arquitectura-de-seguridad)
  - [Arquitectura de despliegue](#arquitectura-de-despliegue)
- [Aplicación Frontend](#aplicacion-frontend)
  - [Autenticación (Frontend)](#autenticacion-frontend)
  - [Sistema de bloqueo móvil](#sistema-de-bloqueo-movil)
  - [Componentes UI y sistema de diseño](#componentes-ui-y-sistema-de-diseno)
  - [Páginas y flujos de usuario](#paginas-y-flujos-de-usuario)
  - [Interfaz de administración](#interfaz-de-administracion)
- [API Backend](#api-backend)
  - [Autenticación y gestión de usuarios](#autenticacion-y-gestion-de-usuarios)
  - [Sistema de reservaciones y control de concurrencia](#sistema-de-reservaciones-y-control-de-concurrencia)
  - [API de canchas](#api-de-canchas)
  - [Notificaciones por email](#notificaciones-por-email)
  - [Referencia de endpoints API](#referencia-de-endpoints-api)
  - [Manejo de errores y logging](#manejo-de-errores-y-logging)
- [Base de datos](#base-de-datos)
  - [Esquema y relaciones](#esquema-y-relaciones)
  - [Pool de conexiones y configuración](#pool-de-conexiones-y-configuracion)
  - [Migraciones de base de datos](#migraciones-de-base-de-datos)
- [Despliegue y operaciones](#despliegue-y-operaciones)
  - [Configuración de Docker](#configuracion-de-docker)
  - [Variables de entorno](#variables-de-entorno)
  - [Guía de despliegue a producción](#guia-de-despliegue-a-produccion)

## Descripción

Este documento proporciona una introducción de alto nivel a **A La Reja**, un sistema de reserva de canchas de pádel exclusivo para escritorio. Cubre el propósito del proyecto, la funcionalidad principal, el stack tecnológico y la arquitectura del sistema. Esta descripción general está destinada a desarrolladores que necesitan comprender cómo funciona el sistema a nivel conceptual antes de sumergirse en subsistemas específicos.

## ¿Qué es A La Reja?

A La Reja es una aplicación web full-stack que permite a los usuarios consultar, reservar y gestionar reservaciones de canchas de pádel. El sistema implementa una arquitectura en tres capas con **Next.js 16** (frontend), **Express.js** (API backend) y **MySQL 8.0** (base de datos). La aplicación está diseñada explícitamente para uso en escritorio; los dispositivos móviles se bloquean en puntos de interrupción de ancho ≤768px mediante media queries de CSS.

**Estado actual:** La aplicación está desplegada en producción en https://a-la-reja.vercel.app/ con funcionalidad completa para gestión de usuarios, autenticación y operaciones CRUD sobre reservaciones. El procesamiento de pagos aún no está implementado.

## Características Principales

### Gestión de Usuarios y Autenticación

El sistema implementa dos rutas de inicio de sesión separadas gestionadas completamente por `auth.ts` (el proveedor de credenciales de NextAuth.js):

| Ruta            | Quién                          | Fuente de Credenciales                            | Emisor de Token                                        |
| --------------- | ------------------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| Admin           | Administrador único codificado | Variables de entorno ADMIN_EMAIL + ADMIN_PASSWORD | NextAuth mismo vía jose (HS256, JWT_SECRET)            |
| Usuario regular | Usuarios de base de datos      | Tabla USUARIOS (hash bcrypt)                      | Express POST /api/login → jsonwebtoken (JWT de 1 hora) |

La verificación de credenciales de administrador utiliza `timingSafeStringEqual()` para prevenir ataques de temporización. Los usuarios regulares son autenticados por Express, que emite su propio JWT; ese token se almacena entonces en el campo `accessToken` de la sesión de NextAuth.

#### Componentes Clave:

- NextAuth config: [auth.ts](auth.ts)
- Frontend context (cookie storage, `getAuthHeader`): [app/context/AuthContext.tsx](app/context/AuthContext.tsx)
- Session provider: [app/components/providers/SessionProvider.tsx](app/components/providers/SessionProvider.tsx)
- Route guard (role-based redirect): [middleware.ts](middleware.ts)
- Backend JWT verification: [backend/middlewares/auth.js](backend/middlewares/auth.js)
- Login/registration endpoints: [backend/routes/usuarios.js](backend/routes/usuarios.js)

### Sistema de Reservaciones con control de concurrencia

El sistema de reservaciones previene la doble reserva mediante transacciones de base de datos con bloqueo a nivel de fila.

<div align="center">

```mermaid
flowchart TD
  Start["POST /api/reservaciones<br/>{fecha, hora_inicio,<br/>hora_fin, idCancha}"]
  Start --> Auth["middleware auth.js<br/>jwt.verify(token,<br/>JWT_SECRET)"]
  Auth --> Validation["Validación de entrada<br/>dateRegex, timeRegex<br/>comprobaciones"]
  Validation --> GetConn["pool.getConnection()"]
  GetConn --> BeginTx["connection.beginTransaction()"]
  BeginTx --> SelectLock["SELECT ... FOR UPDATE<br/>Bloquea filas solapadas"]
  SelectLock --> CheckOverlap{"¿Se encontraron solapamientos?"}
  CheckOverlap -->|Sí| Rollback["connection.rollback()<br/>Devuelve 409 Conflict"]
  CheckOverlap -->|No| Insert["INSERT INTO<br/>RESERVACIONES"]
  Insert --> Commit["connection.commit()<br/>Devuelve 201 Created"]
  Rollback --> Release["connection.release()"]
  Commit --> Release
```

</div>

### Logica de detección de superposición:

```mysql
SELECT idReservacion
FROM RESERVACIONES
WHERE fecha = ?
  AND CANCHAS_idCancha = ?
  AND (hora_inicio < ? AND hora_fin > ?)
LIMIT 1 FOR UPDATE;
```

Esto asegura que incluso las solicitudes simultaneas no puedan reservar dos veces el mismo horario. La clausula `FOR UPDATE` bloquea las filas seleccionadas hasta que la transaccion se completa.

### Mobile Blocking System

La aplicación implementa un acceso único para dispositivos de escritorio a través de un filtro CSS:

| Componente            | Propósito                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| MobileBlocker         | Muestra un mensaje bloqueado con marca en móvil [app/components/ui/MobileBlocker.tsx](app/components/ui/MobileBlocker.tsx) |
| Consulta CSS media    | @media (max-width: 768px) alterna .mobile-blocker / .desktop-content [app/globals.css](app/globals.css) (líneas 19-27)     |
| Integración en Layout | Envuelve todos los hijos de página [app/layout.tsx](app/layout.tsx) (línea 46)                                             |

A ≤768px ambas ramas del DOM siempre se renderizan; el CSS controla la visibilidad. El contenido se oculta y se muestra el mensaje bloqueado; en escritorio (>768px) ocurre lo contrario.

### Interfaz de Administrador

Una zona de administración separada es accesible solo después de iniciar sesión con las credenciales de administrador. Proporciona:

- Panel con estadísticas del sitio, un calendario interactivo por cancha con código de colores y las transacciones más recientes.
- Subpáginas para gestionar reservaciones (`/admin/reservaciones`), usuarios (`/admin/usuarios`) y canchas (`/admin/canchas`).
- Navegación mediante el componente AdminNavBar con resaltado de la ruta activa.
- Las rutas de administrador están protegidas por `middleware.ts`, que redirige las sesiones no administradoras a `/dashboard`.

## Stack Tecnológico

### Dependencias Frontend

<div align="center">

```mermaid
flowchart LR
  Next["Next.js 16.1.6 App Router<br/>+ SSR"]
  React["React 19.2.3<br/>UI Library"]
  TS["TypeScript 5.0<br/>Type Safety"]
  Tailwind["Tailwind CSS 4.x<br/>Styling"]
  NextAuth["NextAuth.js 5.0.0-beta.30<br/>Session Management"]
  JsCookie["js-cookie 3.0.5<br/>Token Storage"]

  Next --> React
  Next --> TS
  Next --> Tailwind
  Next --> NextAuth
  NextAuth --> JsCookie
```

</div>

### Dependencias Backend

<div align="center">

```mermaid
flowchart LR
  Node["Node.js 20+ Runtime"]
  Express["Express.js 5.2.1<br/>Servidor API"]
  mysql["mysql2 3.16.2<br/>Driver DB + Pool"]
  jwt["jsonwebtoken 9.0.3<br/>Generación de tokens"]
  bcrypt["bcryptjs 3.0.3<br/>Hash de contraseñas"]
  cors["cors 2.8.6<br/>Control de acceso"]
  helmet["helmet<br/>Encabezados de seguridad"]

  Node --> Express
  Express --> mysql
  Express --> jwt
  Express --> bcrypt
  Express --> cors
  Express --> helmet
```

</div>

### Componentes de la Infraestructura

| Componente     | Versión    | Despliegue        | Propósito                                   |
| -------------- | ---------- | ----------------- | ------------------------------------------- |
| Docker         | Última     | VPS               | Contenerización del backend                 |
| Docker Compose | Última     | VPS               | Orquestación de servicios (mysql + backend) |
| MySQL          | 8.0        | Contenedor Docker | Base de datos relacional                    |
| Vercel         | Plataforma | Nube              | Hosting del frontend con CDN                |

## Arquitectura del sistema

<div align="center">

```mermaid
flowchart LR
  %% Cliente
  Client["Navegador del cliente<br/>Escritorio (solo >768px)"]

  %% Vercel Platform (Frontend)
  subgraph VERCEL [Vercel Platform]
    NextConf["next.config.ts<br/>Next.js App"]
    Layout["app/layout.tsx<br/>RootLayout + SessionProvider"]
    AuthTs["auth.ts<br/>NextAuth.js — configuración"]
    Context["app/context/AuthContext.tsx<br/>AuthProvider<br/>fetch(NEXT_PUBLIC_API_URL) - Authorization: Bearer (token)"]
    Pages["app/*/page.tsx<br/>Rutas / Pages"]
    UIComps["app/components/**/*.tsx<br/>Componentes UI"]
    MobileBlocker["app/components/ui/MobileBlocker.tsx<br/>Filtro CSS (bloqueo <=768px)"]
  end

  %% VPS Docker Compose (Backend + DB)
  subgraph VPS [VPS Docker Compose]
    Backend["backend/index.js<br/>Express Server (puerto 3001)"]
    Middleware["backend/middlewares/auth.js<br/>Verificación JWT"]
    Routes["backend/routes/*.js<br/>usuarios, canchas, reservaciones"]
    DBConf["backend/config/db.js<br/>Connection Pool"]
    Migrations["migrations/*.sql<br/>Esquema + Seed data (on first start)"]
    MySQL["MySQL 8.0<br/>Contenedor Docker puerto 3306"]
    InternalDNS["mysql:3306 — DNS interno Docker"]
  end

  %% Conexiones principales
  Client -->|"HTTPS"| NextConf
  NextConf --> Layout
  Layout --> AuthTs
  Layout --> Context
  Layout --> Pages
  Pages --> UIComps

  Context -->|"fetch(NEXT_PUBLIC_API_URL)"| Backend
  Backend --> Middleware
  Middleware --> Routes
  Routes --> DBConf
  DBConf --> InternalDNS
  InternalDNS --> MySQL
  Migrations --> MySQL

  %% Bloqueo móvil
  Client -->|"Bloqueado si <=768px"| MobileBlocker
  MobileBlocker -->|"Control por CSS (visibilidad)"| UIComps
```

</div>
