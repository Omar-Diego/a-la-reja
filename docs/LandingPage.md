# Landing Page

Esta página documenta la landing page pública servida en la ruta `/`. Cubre los cuatro componentes que componen la página — `Header`, `Hero`, `TodoLoQueNecesitas` y `ListoParaJugar` — incluyendo su lógica de renderizado, contenido y enlazado entre componentes. Para el comportamiento de protección de rutas que mantiene esta ruta pública, ver [Route Protection](RouteProtection.md). Para la estructura completa del frontend y el wrapping de providers que rodea estos componentes, ver [Application Shell](ApplicationShell.md).

---

## Composición de Componentes

La landing page se ensambla de cuatro componentes renderizados en secuencia. `Header` es un componente de layout compartido; los otros tres son específicos de la landing.

**Fuentes:** `app/components/layout/Header.tsx` #1-62, `app/components/landing/Hero.tsx` #1-67, `app/components/landing/TodoLoQueNecesitas.tsx` #1-55, `app/components/landing/ListoParaJugar.tsx` #1-27

---

## Navegación por Anchor-Links

Dos componentes enlazan a `#todo-lo-que-necesitas` y un componente posee ese anchor. Este es el mecanismo principal de navegación dentro de la página en la landing.

| Origen del enlace                     | Archivo                                                | Atributo                        |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------- |
| Item "Reservar" en la nav de `Header` | `app/components/layout/Header.tsx` #26-31              | `href="#todo-lo-que-necesitas"` |
| Botón "CONOCE MAS" en `Hero`          | `app/components/landing/Hero.tsx` #33-35               | `href="#todo-lo-que-necesitas"` |
| Anchor target de la sección           | `app/components/landing/TodoLoQueNecesitas.tsx` #28-29 | `id="todo-lo-que-necesitas"`    |

---

## Header

`Header` es un componente `"use client"`. Usa `useSession` de `next-auth/react` para determinar qué controles renderizar en el lado derecho. El lado izquierdo (logo y nav links) siempre se renderiza independientemente del estado de auth.

### Lado Izquierdo (siempre visible)

| Elemento                         | Destino                         |
| -------------------------------- | ------------------------------- |
| Logo (ícono + texto "A LA REJA") | `href="/"`                      |
| Link nav "Inicio"                | `href="/"`                      |
| Link nav "Reservar"              | `href="#todo-lo-que-necesitas"` |

### Lado Derecho (según autenticación)

| Estado de carga / Estado de sesión | Salida renderizada                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `status === "loading"`             | Div placeholder con pulso animado                                                                                                     |
| session presente                   | Texto de saludo (`Hola, {name}`) + `<Button>` → `/dashboard` + `<Button variant="inverted">` llamando `signOut({ callbackUrl: "/" })` |
| Sin session                        | Un solo `<Button>` → `/login`                                                                                                         |

El texto de saludo prefiere `session.user?.name` y cae en la porción del email antes de `@` vía `app/components/layout/Header.tsx` #41.

El header tiene estilo `sticky top-0 z-50` para que permanezca visible durante el scroll. El fondo es un gradiente oscuro definido inline `app/components/layout/Header.tsx` #11.

**Fuentes:** `app/components/layout/Header.tsx` #1-62

---

## Sección Hero

`Hero` es un componente servidor (sin directiva `"use client"`). Ocupa como mínimo la altura completa del viewport menos los 80px del header (`min-h-[calc(100dvh-80px)]`), con una imagen de fondo a pantalla completa superpuesta por un gradiente oscuro.

### Contenido

| Elemento            | Detalle                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Badge               | "Reserva en segundos" con ícono de rayo                                                       |
| Headline (h1)       | "TU CANCHA," (blanco) / "TU JUEGO," (color primary) / "TU MOMENTO" (blanco) — Barlow Bold 7xl |
| Texto body          | Párrafo descriptivo de la plataforma                                                          |
| CTA "EMPEZAR AHORA" | `<Button>` → `/login`                                                                         |
| CTA "CONOCE MAS"    | `<Button variant="inverted">` → `#todo-lo-que-necesitas`                                      |

### Franja de Estadísticas

Tres estadísticas inline se muestran debajo de los CTAs:

| Estadística       | Valor |
| ----------------- | ----- |
| Jugadores Activos | 500 + |
| Canchas Premium   | 3     |
| Satisfacción      | 98%   |

Todos los valores estadísticos se renderizan en el color primary usando `text-primary` (`app/components/landing/Hero.tsx` #40-62).

**Fuentes:** `app/components/landing/Hero.tsx` #1-67

---

## Sección TodoLoQueNecesitas

`TodoLoQueNecesitas` es un componente servidor que renderiza la sección anchor `#todo-lo-que-necesitas`. Itera sobre un array estático `features` para renderizar un `FeatureCard` por entrada.

### Datos de las Tarjetas de Funcionalidades

Definido como una constante a nivel de módulo en `app/components/landing/TodoLoQueNecesitas.tsx` #3-24:

| Ícono (Material Symbols) | Título              | Descripción                                              |
| ------------------------ | ------------------- | -------------------------------------------------------- |
| `calendar_month`         | Reserva Instantánea | Encuentra disponibilidad y reserva tu cancha en segundos |
| `groups`                 | Partidos Abiertos   | Únete a partidos públicos y conoce nuevos jugadores      |
| `sync`                   | Gestión Flexible    | Modifica o cancela tus reservas hasta 24 horas antes     |
| `event_busy`             | Sin Doble Reserva   | Validación inteligente que evita conflictos de horario   |

Cada entrada se pasa como props (`icon`, `title`, `description`) al componente `FeatureCard` de `app/components/ui/cards`. Las cuatro tarjetas tienen layout en fila flex con `gap-8`.

El encabezado de sección "TODO LO QUE NECESITAS" usa `text-secondary` (el token CSS `--color-secondary`). El subtítulo usa un morado apagado (`text-[#857fa0]`).

**Fuentes:** `app/components/landing/TodoLoQueNecesitas.tsx` #1-55

---

## Sección ListoParaJugar

`ListoParaJugar` es un componente servidor que actúa como call-to-action de registro en la parte inferior de la landing page. Usa `bg-secondary` como fondo de ancho completo, diferenciándolo visualmente del resto de la página.

### Contenido

| Elemento     | Detalle                                                                              |
| ------------ | ------------------------------------------------------------------------------------ |
| Heading (h2) | "¿LISTO PARA JUGAR?" — Barlow Bold 5xl, blanco                                       |
| Texto body   | Copia de social proof sobre otros jugadores, blanco, Roboto                          |
| CTA button   | `<Button>` → `/register` con ícono de Material Symbol `arrow_forward` adjunto inline |

El CTA enlaza directamente a `/register`, sin pasar por el login. Este es el único enlace desde la landing page a la página de registro.

**Fuentes:** `app/components/landing/ListoParaJugar.tsx` #1-27
