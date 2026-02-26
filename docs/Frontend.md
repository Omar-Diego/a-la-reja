# Frontend

Esta página cubre la aplicación frontend Next.js: su tech stack, inventario de dependencias, estructura del App Router, jerarquía global de providers, sistema de estilos y configuración de Next.js. Para detalles de páginas específicas y flujos construidos sobre esta base, ver las páginas hijas:

- [Application Shell](ApplicationShell.md) → detalles del shell de aplicación
- [Landing Page](LandingPage.md) → componentes de la landing page
- [User Dashboard & My Reservations](UserDashboard&MyReservations.md) → dashboard de usuario y reservaciones
- [Court Reservation Flow](CourtReservationFlow.md) → flujo de reservación de canchas
- [User Profile](UserProfile.md) → perfil de usuario
- [Admin Interface](AdminInterface.md) → interfaz de administración

Para mecánicas de autenticación (config de NextAuth, AuthContext, route guards), ver [Authentication](Authentication.md).

---

## Stack Tecnológico

El frontend es una aplicación Next.js standalone deployada en Vercel. Se comunica con el backend Express sobre HTTPS usando Bearer JWTs; **no se conecta directamente a la base de datos**.

| Aspecto           | Tecnología                  | Versión         |
| ----------------- | --------------------------- | --------------- |
| Framework         | Next.js (App Router)        | `16.1.6`        |
| UI library        | React                       | `19.2.3`        |
| Auth              | NextAuth.js (beta)          | `5.0.0-beta.30` |
| Styling           | Tailwind CSS v4             | `^4`            |
| Cookie management | js-cookie                   | `^3.0.5`        |
| Language          | TypeScript                  | `^5`            |
| Linting           | ESLint + eslint-config-next | `^9 / 16.1.6`   |

> `mysql2` también aparece en `package.json` como dependencia de producción, usado por la capa del adaptador NextAuth dentro del proceso Next.js — no para queries directas de la aplicación, que siempre van a través del backend API.

**Fuentes:** `package.json` #1-30

---

## Estructura del App Router

El frontend usa el App Router de Next.js (directorio `app/`). Cada segmento de ruta es un directorio que contiene un `page.tsx` (y opcionalmente `layout.tsx`).

---

## Dependencias

### Dependencias de Producción

| Package               | Rol                                                                               |
| --------------------- | --------------------------------------------------------------------------------- |
| `next`                | Framework; App Router, SSR, optimización de imágenes                              |
| `react` / `react-dom` | Renderizado de UI                                                                 |
| `next-auth`           | Gestión de sesiones, Credentials provider                                         |
| `js-cookie`           | Lectura/escritura de cookies en `AuthContext` para almacenamiento JWT client-side |
| `mysql2`              | Adaptador MySQL usado internamente por NextAuth                                   |

### Dependencias de Desarrollo

| Package                                | Rol                                               |
| -------------------------------------- | ------------------------------------------------- |
| `tailwindcss` + `@tailwindcss/postcss` | CSS de utilidades; integración PostCSS para v4    |
| `typescript`                           | Tipado estático                                   |
| `eslint` + `eslint-config-next`        | Linting con reglas de Next.js                     |
| `@types/*`                             | Declaraciones de tipo para Node, React, js-cookie |

**Fuentes:** `package.json` #11-29

---

## Jerarquía Global de Providers

`RootLayout` en `app/layout.tsx` (líneas 27–52) envuelve cada página en tres providers anidados. El orden es significativo: `AuthProvider` depende de la sesión NextAuth, por lo que `SessionProvider` debe ser el wrapper más externo. `MobileBlocker` está más al interior para poder renderizar condicionalmente el contenido de la página.

```
SessionProvider (más externo)
  └── AuthProvider
        └── MobileBlocker
              └── {children}   ← página activa
```

**Fuentes:** `app/layout.tsx` #43-50

---

## Sistema de Estilos

El estilo es manejado por **Tailwind CSS v4**, configurado a través de un bloque `@theme` en el archivo CSS global en lugar de un `tailwind.config.js` separado.

### Tokens de Color

Definidos en `app/globals.css` (líneas 3–8) y consumidos en toda la app via clases de utilidad Tailwind como `bg-primary`, `text-secondary`, `bg-secondary/80`.

| CSS Variable        | Value     | Uso semántico                 |
| ------------------- | --------- | ----------------------------- |
| `--color-primary`   | `#ccff00` | Accent / CTA (amarillo-verde) |
| `--color-secondary` | `#0f172a` | Navy oscuro; fondos y texto   |

### Tipografía

Dos familias de Google Fonts se cargan en `RootLayout` (`app/layout.tsx` #8-20) usando `next/font/google` para optimización automática de fuentes (subsetting, `display: swap`).

| Fuente           | Variable                  | Pesos              | Alias Tailwind |
| ---------------- | ------------------------- | ------------------ | -------------- |
| Barlow Condensed | `--font-barlow-condensed` | 400, 500, 600, 700 | `font-barlow`  |
| Roboto           | `--font-roboto`           | 400, 500, 700      | `font-roboto`  |

**Material Symbols Outlined** (icon font) se carga via un tag `<link>` en `<head>` (`app/layout.tsx` #38-42), haciendo disponibles nombres de íconos como `sports_baseball` y `desktop_windows` como contenido de texto dentro de elementos `<span class="material-symbols-outlined">`.

**Fuentes:** `app/globals.css` #1-27, `app/layout.tsx` #8-20, #32-36

---

## Bloqueo en Móviles

La aplicación **bloquea explícitamente** los navegadores móviles usando un mecanismo solo CSS. **No hay JavaScript** involucrado en la lógica de bloqueo.

Dos clases CSS están definidas en `app/globals.css` (líneas 10–27):

| Clase              | Comportamiento default | Comportamiento ≤768px |
| ------------------ | ---------------------- | --------------------- |
| `.mobile-blocker`  | `display: none`        | `display: block`      |
| `.desktop-content` | `display: block`       | `display: none`       |

`MobileBlocker` (`app/components/ui/MobileBlocker.tsx` #1-60) renderiza ambos elementos simultáneamente:

- Un `div.mobile-blocker` con una tarjeta de marca con mensaje "usa un PC"
- Un `div.desktop-content` envolviendo `{children}`, que es la página actual

**Fuentes:** `app/globals.css` #10-27, `app/components/ui/MobileBlocker.tsx` #7-59

---

## Next.js Configuration

`next.config.ts` (líneas 1–22) contiene un único bloque de configuración: los hostnames remotos permitidos para el componente `next/image`:

| Hostname              | Path Pattern | Uso                           |
| --------------------- | ------------ | ----------------------------- |
| `ui-avatars.com`      | `/api/**`    | Avatares generados de usuario |
| `images.unsplash.com` | `/**`        | Imágenes de canchas           |

No hay configuración webpack personalizada, no hay redirects ni rewrites, y no hay override del output mode — la app usa el output de deployment de Vercel por defecto.

**Fuentes:** `next.config.ts` #1-22

---

## ESLint Configuration

El linting está configurado en `eslint.config.mjs` (líneas 1–18) usando el formato flat config. Extiende dos presets de `eslint-config-next`:

- **`core-web-vitals`** — incluye reglas de rendimiento de Core Web Vitals.
- **`typescript`** — reglas específicas de TypeScript.

Los directorios de output estándar de Next.js (`.next/`, `out/`, `build/`) son ignorados globalmente.
