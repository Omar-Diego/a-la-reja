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

### ¿Qué es A La Reja?

A La Reja es una aplicación web full-stack que permite a los usuarios consultar, reservar y gestionar reservaciones de canchas de pádel. El sistema implementa una arquitectura en tres capas con **Next.js 16** (frontend), **Express.js** (API backend) y **MySQL 8.0** (base de datos). La aplicación está diseñada explícitamente para uso en escritorio; los dispositivos móviles se bloquean en puntos de interrupción de ancho ≤768px mediante media queries de CSS.

**Estado actual:** La aplicación está desplegada en producción en https://a-la-reja.vercel.app/ con funcionalidad completa para gestión de usuarios, autenticación y operaciones CRUD sobre reservaciones. El procesamiento de pagos aún no está implementado.

## Características Principales

### Gestión de Usuarios y Autenticación

El sistema implementa dos rutas de inicio de sesión separadas gestionadas completamente por `auth.ts` (el proveedor de credenciales de NextAuth.js):

```mermaid
table
    Ruta | Quién | Fuente de Credenciales | Emisor de Token
    Admin | Administrador único codificado | Variables de entorno ADMIN_EMAIL + ADMIN_PASSWORD | NextAuth mismo vía jose (HS256, JWT_SECRET)
    Usuario regular | Usuarios de base de datos | Tabla USUARIOS (hash bcrypt) | Express POST /api/login → jsonwebtoken (JWT de 1 hora)
```
