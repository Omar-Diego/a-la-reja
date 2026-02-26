# Application Shell

Esta página describe la estructura raíz del frontend Next.js: el componente `RootLayout`, las propiedades CSS globales, el componente `MobileBlocker`, y el orden de anidamiento de providers. Este es el código que envuelve cada página de la aplicación.

Para detalles sobre control de acceso a nivel de rutas, ver [Route Protection](RouteProtection.md). Para detalles sobre qué hacen `AuthProvider` y `SessionProvider` internamente, ver [Frontend Auth Context](FrontendAuthContext.md) y [NextAuth Configuration](NextAuthConfiguration.md).

---

## Descripción General

El **application shell** es la capa más externa del App Router de Next.js. Está definido en un único archivo de layout raíz y es responsable de:

- Cargar Google Fonts (`Barlow Condensed`, `Roboto`, `Material Symbols`)
- Definir propiedades CSS personalizadas globales (paleta de colores, familias de fuentes)
- Envolver cada página con tres providers anidados en un orden fijo
- Aplicar un bloqueo móvil solo con CSS que oculta todo el contenido a anchos de viewport ≤ 768px

---

## Root Layout (`RootLayout`)

`RootLayout` es el export por defecto de `app/layout.tsx` (líneas 27–52). Es el layout raíz del App Router de Next.js, renderizado en cada solicitud de página.

**Responsabilidades de `RootLayout`:**

- Aplica clases de variables CSS de fuentes al elemento `<html>`
- Establece `lang="es"` en el elemento `<html>`
- Carga la fuente de íconos **Material Symbols Outlined** via un tag `<link>` en `<head>`
- Envuelve `children` en el stack de providers
- Exporta metadata (título `"A La Reja"`, descripción `"Tu plataforma deportiva"`)

**Orden de anidamiento de providers (árbol de componentes):**

```
SessionProvider
  └── AuthProvider
        └── MobileBlocker
              └── {children}
```

> **El orden de anidamiento es significativo:**
>
> - `SessionProvider` debe ser el más externo para que `AuthProvider` pueda llamar `useSession()`.
> - `AuthProvider` debe estar sobre `MobileBlocker` para que el estado de auth esté disponible.
> - `MobileBlocker` envuelve `children` al final para poder mostrar u ocultar condicionalmente la página.

**Fuentes:** `app/layout.tsx` #1-52

---

## CSS Global (`globals.css`)

`app/globals.css` (líneas 1–27) es importado al inicio de `app/layout.tsx` y es la única hoja de estilos global. Usa la sintaxis `@import "tailwindcss"` de Tailwind v4 y un bloque `@theme` para definir design tokens.

### Tokens de Color

| CSS Custom Property | Value     | Tailwind Utility Class           |
| ------------------- | --------- | -------------------------------- |
| `--color-primary`   | `#ccff00` | `bg-primary`, `text-primary`     |
| `--color-secondary` | `#0f172a` | `bg-secondary`, `text-secondary` |

Estos tokens se usan en toda la librería de componentes (ej. `MobileBlocker` usa `bg-secondary` y `bg-primary` directamente en clases Tailwind).

### Variables de Fuentes

| CSS Custom Property | Maps To                        | Propósito         |
| ------------------- | ------------------------------ | ----------------- |
| `--font-barlow`     | `var(--font-barlow-condensed)` | Headings, display |
| `--font-roboto`     | `var(--font-roboto)`           | Body copy         |

Las variables CSS subyacentes `--font-barlow-condensed` y `--font-roboto` son inyectadas en `<html>` por `next/font/google` en build time (`app/layout.tsx` #8-20).

### CSS del Mobile Blocker

El archivo también define dos clases de utilidad usadas por `MobileBlocker`:

```css
/* Default */
.mobile-blocker {
  display: none;
}
.desktop-content {
  display: block;
}

/* ≤ 768px */
@media (max-width: 768px) {
  .mobile-blocker {
    display: block;
  }
  .desktop-content {
    display: none;
  }
}
```

> Este es un toggle de visibilidad **puramente CSS** — no hay detección de viewport por JavaScript.

**Fuentes:** `app/globals.css` #1-27

---

## Font Loading

Dos Google Fonts se cargan en `app/layout.tsx` usando el paquete `next/font/google`, que maneja optimización y auto-hosting automáticamente:

| Variable          | Font Family      | Weights            | CSS Variable              |
| ----------------- | ---------------- | ------------------ | ------------------------- |
| `barlowCondensed` | Barlow Condensed | 400, 500, 600, 700 | `--font-barlow-condensed` |
| `roboto`          | Roboto           | 400, 500, 700      | `--font-roboto`           |

Ambas usan `display: "swap"` y apuntan al subset `latin`. Las variables se aplican a `<html>` como nombres de clase Tailwind (`app/layout.tsx` #33-35).

Adicionalmente, **Material Symbols Outlined** se carga como un stylesheet `<link>` estándar en `<head>` (`app/layout.tsx` #37-42). Esto provee la clase `material-symbols-outlined` usada en los componentes.

**Fuentes:** `app/layout.tsx` #8-20, #37-42

---

## Componente MobileBlocker

`app/components/ui/MobileBlocker.tsx` (líneas 1–60) es un componente cliente (`"use client"`) que renderiza dos elementos hermanos. El **CSS** (no JavaScript) determina cuál es visible.

### Tarjeta de Mensaje Móvil

Cuando se ve a ≤ 768px, `.mobile-blocker` muestra una tarjeta centrada con:

| Elemento     | Contenido                                                          |
| ------------ | ------------------------------------------------------------------ |
| Brand header | Ícono `sports_baseball` + texto `"A LA REJA"` sobre `bg-secondary` |
| Icon         | Material Symbol `desktop_windows`                                  |
| Heading      | `"Mejor experiencia en PC"`                                        |
| Body         | Texto indicando al usuario que acceda desde PC                     |
| Footer note  | Ícono `computer` + `"Accede desde tu PC o laptop"`                 |

La tarjeta usa un gradiente de fondo sobre `Hero.jpg` (`app/components/ui/MobileBlocker.tsx` #15).

### Contenido de Escritorio

En viewports mayores a 768px, `div.desktop-content` es visible y `div.mobile-blocker` está oculto. El prop `children` — la página Next.js activa — se renderiza dentro de `div.desktop-content` (`app/components/ui/MobileBlocker.tsx` #57).

**Fuentes:** `app/components/ui/MobileBlocker.tsx` #1-60, `app/globals.css` #10-27

---

## Next.js Configuration (`next.config.ts`)

`next.config.ts` (líneas 1–22) define la configuración de build de Next.js. La única configuración activa es la lista de patrones remotos permitidos para el componente `next/image`:

| Hostname              | Path Pattern | Uso                           |
| --------------------- | ------------ | ----------------------------- |
| `ui-avatars.com`      | `/api/**`    | Avatares de usuario generados |
| `images.unsplash.com` | `/**`        | Imágenes de canchas           |

No hay configuración webpack personalizada, exposición de variables de entorno, ni reglas de redirección.

**Fuentes:** `next.config.ts` #1-22

---

## Secuencia de Inicialización del Shell

> **Figura:** Secuencia de arranque del shell desde la solicitud HTTP hasta la página renderizada.
