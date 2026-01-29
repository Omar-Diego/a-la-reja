# Guía Profesional de Organización de Estilos con Tailwind CSS en Next.js

## Índice

1. [El Problema de la Legibilidad](#el-problema-de-la-legibilidad)
2. [Técnicas de Formateo de className](#técnicas-de-formateo-de-classname)
3. [Extracción de Componentes Reutilizables](#extracción-de-componentes-reutilizables)
4. [Organización de Clases en Grupos Semánticos](#organización-de-clases-en-grupos-semánticos)
5. [Separación de Lógica y Presentación](#separación-de-lógica-y-presentación)
6. [Arquitectura de Componentes Escalable](#arquitectura-de-componentes-escalable)
7. [Patrones de Diseño para Mantenibilidad](#patrones-de-diseño-para-mantenibilidad)
8. [Configuración de Herramientas](#configuración-de-herramientas)
9. [Ejemplos Completos Before/After](#ejemplos-completos-beforeafter)

---

## El Problema de la Legibilidad

### El Anti-Pattern: Una Línea de Clases

El problema más común al trabajar con Tailwind CSS es la tendencia a acumular todas las clases en una sola línea, lo que genera código imposible de mantener:

```tsx
// ❌ CÓDIGO PROBLEMÁTICO - Difícil de leer, mantener y debuggear
export default function UserCard({ user, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        <img 
          src={user.avatar} 
          alt={user.name} 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay" 
        />
        <div className="absolute top-4 right-4 flex space-x-2">
          <button 
            onClick={onEdit}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
            aria-label="Editar usuario"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={onDelete}
            className="p-2 bg-red-500/20 backdrop-blur-sm rounded-full hover:bg-red-500/30 transition-colors duration-200"
            aria-label="Eliminar usuario"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{user.email}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {user.roles.map(role => (
            <span key={role} className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              {role}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">Creado el {new Date(user.createdAt).toLocaleDateString()}</span>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Problemas con este enfoque:**

1. **Difícil de leer**: Las clases se mezclan y es imposible identificar qué hace cada propiedad
2. **Imposible de mantener**: Cambiar una clase requiere escanear toda la línea
3. **Debugging complicado**: Cuando algo no funciona, no sabes qué clase causò el problema
4. **Merge conflicts**: En Git, estos bloques generan conflictos constantes
5. **Sin reutilización**: Cada componente tiene sus estilos hardcodeados

---

## Técnicas de Formateo de className

### Técnica 1: Plantillas Literales con Sangría

La forma más simple y efectiva es usar plantillas literales con saltos de línea y sangría:

```tsx
// ✅ MEJORADO - Usando plantilla literal con sangría
export default function UserCard({ user, onEdit, onDelete }) {
  return (
    <div
      className={`
        bg-white
        rounded-xl
        shadow-lg
        overflow-hidden
        hover:shadow-xl
        transition-shadow
        duration-300
        border
        border-gray-100
      `}
    >
      <div
        className={`
          relative
          h-48
          bg-gradient-to-br
          from-blue-500
          to-purple-600
        `}
      >
        <img
          src={user.avatar}
          alt={user.name}
          className={`
            absolute
            inset-0
            w-full
            h-full
            object-cover
            mix-blend-overlay
          `}
        />
        {/* Resto del componente... */}
      </div>
    </div>
  );
}
```

**Ventajas:**
- Cada clase en su propia línea
- Git muestra cambios línea por línea
- Facilita el diffing

**Desventajas:**
- Puede ser verboso para pocos elementos

### Técnica 2: Array de Clases

```tsx
// ✅ USANDO ARRAY DE CLASES
export default function UserCard({ user, onEdit, onDelete }) {
  const cardClasses = [
    "bg-white",
    "rounded-xl",
    "shadow-lg",
    "overflow-hidden",
    "hover:shadow-xl",
    "transition-shadow",
    "duration-300",
    "border",
    "border-gray-100",
  ];

  const imageContainerClasses = [
    "relative",
    "h-48",
    "bg-gradient-to-br",
    "from-blue-500",
    "to-purple-600",
  ];

  return (
    <div className={cardClasses.join(" ")}>
      <div className={imageContainerClasses.join(" ")}>
        {/* Contenido */}
      </div>
    </div>
  );
}
```

**Ventajas:**
- Separación clara entre lógica y estilos
- Facilidad para agregar clases condicionalmente

**Desventajas:**
-join() genera un string largo al final
- Menos intuitivo para algunos desarrolladores

### Técnica 3: clsx o classnames (Biblioteca Recomendada)

```tsx
// ✅ USANDO clsx - MEJOR PRÁCTICA
import clsx from "clsx";

interface UserCardProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  variant?: "default" | "compact" | "featured";
  className?: string;
}

export default function UserCard({
  user,
  onEdit,
  onDelete,
  variant = "default",
  className,
}: UserCardProps) {
  const cardClasses = clsx(
    // Clases base
    "bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100",
    
    // Variantes
    {
      "hover:shadow-xl transition-shadow duration-300": variant === "default",
      "p-4": variant === "compact",
      "ring-2 ring-blue-500": variant === "featured",
    },
    
    // Clases condicionales
    user.isActive && "border-green-200 bg-green-50/30",
    
    // Clases externas
    className,
  );

  return <div className={cardClasses}>{/* Contenido */}</div>;
}
```

**Ventajas:**
- Sintaxis limpia y expresiva
- Soporte para condiciones
- Soporte para variantes
- Muy popular en la comunidad

**Instalación:**
```bash
npm install clsx
# o
yarn add clsx
```

### Técnica 4: tailwind-merge (Para Sobrescribir Clases)

```tsx
// ✅ USANDO tailwind-merge - IDEAL PARA COMPONENTES RECIBIENDO className
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const buttonClasses = twMerge(
    clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
    ),
    className, // Permite sobrescribir clases
  );

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
}
```

**Instalación:**
```bash
npm install tailwind-merge
```

**Casos de uso:**
- Componentes de UI que reciben className del padre
- Necesidad de sobrescribir estilos por defecto
- Componentes en libraries

---

## Extracción de Componentes Reutilizables

### Anti-Pattern: Duplicación de Estilos

```tsx
// ❌ ANTI-PATTERN - Duplicación everywhere
export default function UserCard({ user }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
      <p className="text-gray-600 mt-1">{user.email}</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Ver más
      </button>
    </div>
  );
}

export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
      <p className="text-gray-600 mt-1">{product.description}</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Comprar
      </button>
    </div>
  );
}

export default function ArticleCard({ article }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900">{article.title}</h3>
      <p className="text-gray-600 mt-1">{article.excerpt}</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Leer más
      </button>
    </div>
  );
}
```

### Solución: Componentes Base Reutilizables

```tsx
// ✅ EXTRACTED - Componentes base reutilizables

// src/components/ui/Card.tsx
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export default function Card({
  variant = "default",
  padding = "md",
  hover = false,
  className,
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    default: "bg-white border border-gray-100",
    elevated: "bg-white shadow-lg",
    outlined: "bg-white border-2 border-gray-200",
  };

  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const cardClasses = twMerge(
    clsx(
      "rounded-xl",
      variantClasses[variant],
      paddingClasses[padding],
      hover && "hover:shadow-xl transition-shadow duration-300 cursor-pointer",
    ),
    className,
  );

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
}

// src/components/ui/Title.tsx
interface TitleProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: "default" | "muted" | "accent";
  className?: string;
  children: React.ReactNode;
}

export default function Title({
  level = 2,
  variant = "default",
  className,
  children,
}: TitleProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const variantClasses = {
    default: "text-gray-900",
    muted: "text-gray-600",
    accent: "text-blue-600",
  };

  const levelClasses = {
    1: "text-4xl font-bold",
    2: "text-2xl font-bold",
    3: "text-xl font-semibold",
    4: "text-lg font-semibold",
    5: "text-base font-medium",
    6: "text-sm font-medium",
  };

  return (
    <Tag className={clsx(variantClasses[variant], levelClasses[level], className)}>
      {children}
    </Tag>
  );
}

// src/components/ui/Button.tsx
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    outline: "border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const buttonClasses = twMerge(
    clsx(
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      variantClasses[variant],
      sizeClasses[size],
    ),
    className,
  );

  return (
    <button className={buttonClasses} disabled={disabled || isLoading} {...props}>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// src/components/ui/Text.tsx
interface TextProps {
  variant?: "body" | "small" | "muted" | "accent";
  weight?: "normal" | "medium" | "semibold" | "bold";
  className?: string;
  children: React.ReactNode;
}

export default function Text({
  variant = "body",
  weight = "normal",
  className,
  children,
}: TextProps) {
  const variantClasses = {
    body: "text-gray-700",
    small: "text-sm text-gray-600",
    muted: "text-gray-500",
    accent: "text-blue-600",
  };

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  return (
    <p className={clsx(variantClasses[variant], weightClasses[weight], className)}>
      {children}
    </p>
  );
}
```

### Uso de Componentes Extraídos

```tsx
// ✅ COMPONENTES LIMPIOS Y REUTILIZABLES
import Card from "@/components/ui/Card";
import Title from "@/components/ui/Title";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";

interface User {
  name: string;
  email: string;
  isActive: boolean;
}

interface UserCardProps {
  user: User;
  onViewProfile: () => void;
}

export default function UserCard({ user, onViewProfile }: UserCardProps) {
  return (
    <Card variant="elevated" hover padding="md">
      <Title level={3}>{user.name}</Title>
      <Text variant="muted" className="mt-1">
        {user.email}
      </Text>
      <div className="mt-4">
        <Button variant="primary" size="sm" onClick={onViewProfile}>
          Ver perfil
        </Button>
      </div>
    </Card>
  );
}

interface Product {
  name: string;
  description: string;
  price: number;
}

interface ProductCardProps {
  product: Product;
  onBuy: () => void;
}

export default function ProductCard({ product, onBuy }: ProductCardProps) {
  return (
    <Card variant="outlined" hover padding="md">
      <Title level={3} variant="accent">
        {product.name}
      </Title>
      <Text variant="body" className="mt-2">
        {product.description}
      </Text>
      <Text weight="bold" className="mt-2">
        ${product.price}
      </Text>
      <div className="mt-4">
        <Button variant="primary" onClick={onBuy}>
          Comprar
        </Button>
      </div>
    </Card>
  );
}
```

---

## Organización de Clases en Grupos Semánticos

### Grupos Recomendados

Ordenar las clases en grupos lógicos facilita enormemente la lectura:

```tsx
// ✅ AGRUPACIÓN SEMÁNTICA DE CLASES

// src/components/ui/AdvancedCard.tsx
import clsx from "clsx";

interface AdvancedCardProps {
  children: React.ReactNode;
  className?: string;
  // ... otras props
}

export default function AdvancedCard({
  children,
  className,
}: AdvancedCardProps) {
  const cardClasses = clsx(
    // ┌─────────────────────────────────────────────────────────┐
    // │  1. LAYOUT                                              │
    // │     Posicionamiento, display, flex/grid, spacing       │
    // └─────────────────────────────────────────────────────────┘
    "flex",
    "flex-col",
    "items-center",
    "justify-center",
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  2. DIMENSIONES                                         │
    // │     width, height, max-width, min-height               │
    // └─────────────────────────────────────────────────────────┘
    "w-full",
    "max-w-sm",
    "min-h-[200px]",
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  3. COLORES Y FONDOS                                    │
    // │     background, text color, border color               │
    // └─────────────────────────────────────────────────────────┘
    "bg-white",
    "border",
    "border-gray-200",
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  4. TIPOGRAFÍA                                          │
    // │     font-size, font-weight, text-align                 │
    // └─────────────────────────────────────────────────────────┘
    "text-center",
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  5. BORDES Y RADIOS                                     │
    // │     border-width, border-radius, border-style          │
    // └─────────────────────────────────────────────────────────┘
    "rounded-2xl",
    "rounded-lg", // Multiples radios para bordes personalizados
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  6. SOMBRAS                                              │
    // │     box-shadow                                          │
    // └─────────────────────────────────────────────────────────┘
    "shadow-md",
    "hover:shadow-xl",
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  7. TRANSICIONES                                        │
    // │     transition, animation, transform                   │
    // └─────────────────────────────────────────────────────────┘
    "transition-all",
    "duration-300",
    "ease-in-out",
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  8. INTERACTIVIDAD                                      │
    // │     cursor, hover states, focus states                  │
    // └─────────────────────────────────────────────────────────┘
    "cursor-pointer",
    "hover:scale-[1.02]",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-blue-500",
    "focus:ring-offset-2",
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  9. OVERFLOW Y POSICIONAMIENTO                          │
    // │     overflow, position, z-index                        │
    // └─────────────────────────────────────────────────────────┘
    "overflow-hidden",
    "relative",
    "z-10",
    
    // ┌─────────────────────────────────────────────────────────┐
    // │  10. UTILIDADES                                        │
    // │      opacity, visibility, pointer-events               │
    // └─────────────────────────────────────────────────────────┘
    "opacity-100",
    
    // Clases externas
    className,
  );

  return <div className={cardClasses}>{children}</div>;
}
```

### Orden Simplificado (Más Práctico)

```tsx
// ✅ ORDEN SIMPLIFICADO - Más usado en producción

export default function UserProfile({ user }) {
  const containerClasses = clsx(
    // 1. Layout
    "flex flex-col items-center text-center",
    
    // 2. Dimensiones
    "w-full max-w-md",
    
    // 3. Apariencia
    "bg-white rounded-2xl shadow-lg border border-gray-100",
    
    // 4. Interacción
    "hover:shadow-xl transition-all duration-300 cursor-pointer",
    
    // 5. Props externas
    className,
  );

  const avatarClasses = clsx(
    // 1. Dimensiones
    "w-24 h-24",
    
    // 2. Apariencia
    "rounded-full object-cover ring-4 ring-blue-100",
    
    // 3. Layout
    "mb-4",
  );

  const nameClasses = clsx(
    // 1. Tipografía
    "text-xl font-bold text-gray-900",
    
    // 2. Layout
    "mb-1",
  );

  const bioClasses = clsx(
    // 1. Tipografía
    "text-sm text-gray-600",
    
    // 2. Layout
    "px-4",
  );

  return (
    <div className={containerClasses}>
      <img src={user.avatar} alt={user.name} className={avatarClasses} />
      <h3 className={nameClasses}>{user.name}</h3>
      <p className={bioClasses}>{user.bio}</p>
    </div>
  );
}
```

### Tabla de Referencia de Orden

| Orden | Categoría | Ejemplos |
|-------|-----------|----------|
| 1 | Layout | flex, grid, items-center, justify-between, gap-4 |
| 2 | Dimensiones | w-full, h-12, max-w-lg, min-h-screen |
| 3 | Apariencia | bg-white, text-gray-900, border, rounded-xl |
| 4 | Tipografía | text-lg, font-bold, text-center |
| 5 | Sombras | shadow-md, shadow-lg, hover:shadow-xl |
| 6 | Transiciones | transition-all, duration-300, ease-in-out |
| 7 | Interacción | cursor-pointer, hover:bg-gray-100, focus:ring |
| 8 | Posicionamiento | relative, absolute, z-10, top-0 |
| 9 | Overflow | overflow-hidden, overflow-auto |
| 10 | Utilidades | opacity-50, pointer-events-none |

---

## Separación de Lógica y Presentación

### Anti-Pattern: Todo en un Componente

```tsx
// ❌ ANTI-PATTERN - Lógica y presentación mezcladas
export default function UserList({ users, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filter, setFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = users
    .filter(user => {
      if (filter === "active") return user.isActive;
      if (filter === "inactive") return !user.isActive;
      return true;
    })
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  const toggleSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {filteredUsers.map(user => (
          <div key={user.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => toggleSelect(user.id)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <div>
                <h3 className="font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </span>
              <button onClick={() => onEdit(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => onDelete(user)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Solución: Patrón Presentational/Container

```tsx
// ✅ SEPARACIÓN COMPLETA - Presentational y Container Components

// ┌──────────────────────────────────────────────────────────────┐
// │  LÓGICA (Container Component)                                │
// │  Solo maneja estado, efectos, callbacks                      │
// └──────────────────────────────────────────────────────────────┘

// src/components/users/UserListContainer.tsx
"use client";

import { useState, useMemo } from "react";
import UserListView from "./UserListView";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

interface UserListContainerProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserListContainer({
  users,
  onEdit,
  onDelete,
}: UserListContainerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (filter === "active") return user.isActive;
        if (filter === "inactive") return !user.isActive;
        return true;
      })
      .filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [users, searchTerm, sortBy, filter]);

  const toggleSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  return (
    <UserListView
      users={filteredUsers}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      sortBy={sortBy}
      onSortChange={setSortBy}
      filter={filter}
      onFilterChange={setFilter}
      selectedUsers={selectedUsers}
      onToggleSelect={toggleSelect}
      onSelectAll={handleSelectAll}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

// ┌──────────────────────────────────────────────────────────────┐
// │  PRESENTACIÓN (Presentational Component)                     │
// │  Solo recibe datos y callbacks, no tiene estado interno     │
// └──────────────────────────────────────────────────────────────┘

// src/components/users/UserListView.tsx
import clsx from "clsx";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface UserListViewProps {
  users: User[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: "name" | "date";
  onSortChange: (value: "name" | "date") => void;
  filter: "all" | "active" | "inactive";
  onFilterChange: (value: "all" | "active" | "inactive") => void;
  selectedUsers: string[];
  onToggleSelect: (userId: string) => void;
  onSelectAll: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserListView({
  users,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  filter,
  onFilterChange,
  selectedUsers,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
}: UserListViewProps) {
  const headerClasses = clsx(
    "flex flex-col sm:flex-row",
    "justify-between items-start sm:items-center",
    "gap-4 p-6 border-b border-gray-100 bg-gray-50",
  );

  const controlsClasses = clsx(
    "flex flex-col sm:flex-row",
    "gap-3 w-full sm:w-auto",
  );

  const rowClasses = clsx(
    "p-4 hover:bg-gray-50",
    "flex items-center justify-between",
    "transition-colors cursor-pointer",
    "border-b border-gray-50 last:border-0",
  );

  return (
    <Card variant="elevated" padding="none">
      {/* Header con búsqueda y filtros */}
      <div className={headerClasses}>
        <h2 className="text-2xl font-bold text-gray-900">
          Usuarios ({users.length})
        </h2>
        <div className={controlsClasses}>
          <Input
            type="search"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as any)}
            options={[
              { value: "all", label: "Todos" },
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Inactivos" },
            ]}
          />
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="divide-y divide-gray-50">
        {users.map(user => (
          <div key={user.id} className={rowClasses}>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => onToggleSelect(user.id)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <div>
                <h3 className="font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  user.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                )}
              >
                {user.isActive ? "Activo" : "Inactivo"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
                Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(user)}>
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

### Beneficios de la Separación

| Aspecto | Antes (Mezclado) | Después (Separado) |
|---------|------------------|-------------------|
| **Testing** | Difícil, lógica y UI juntas | Fáciles, cada componente tiene una responsabilidad |
| **Reutilización** | Componente monolítico | Presentational reusable en cualquier contexto |
| **Mantenimiento** | Cambiar UI afecta lógica | Cambios independientes |
| **Lectura** | Difícil seguir lógica | Cada archivo tiene un propósito claro |
| **Estado** | Estado mezclado con UI | Estado centralizado y predecible |

---

## Arquitectura de Componentes Escalable

### Estructura de Directorios Recomendada

```
src/
├── components/
│   ├── ui/                    # Componentes de interfaz base (átomos)
│   │   ├── Button/
│   │   │   ├── index.tsx      # Componente
│   │   │   ├── types.ts       # Tipos específicos
│   │   │   └── README.md      # Documentación
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Dropdown/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Table/
│   │   ├── Pagination/
│   │   └── index.ts           # Barrel export
│   │
│   ├── layout/                # Componentes de estructura (moléculas)
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Sidebar/
│   │   ├── Container/
│   │   ├── Section/
│   │   └── Grid/
│   │
│   ├── forms/                 # Componentes de formulario (organismos)
│   │   ├── SearchForm/
│   │   ├── ContactForm/
│   │   ├── LoginForm/
│   │   └── RegistrationForm/
│   │
│   ├── sections/              # Secciones de página (templates)
│   │   ├── Hero/
│   │   ├── Features/
│   │   ├── Testimonials/
│   │   ├── Pricing/
│   │   ├── FAQ/
│   │   └── CTA/
│   │
│   ├── composite/             # Componentes compuestos (organismos complejos)
│   │   ├── UserCard/
│   │   ├── ProductCard/
│   │   ├── ArticleCard/
│   │   ├── DashboardWidget/
│   │   └── DataTable/
│   │
│   └── providers/             # Context providers
│       ├── ThemeProvider/
│       ├── AuthProvider/
│       └── ToastProvider/
│
├── hooks/                     # Custom hooks
│   ├── useMediaQuery/
│   ├── useLocalStorage/
│   ├── useDebounce/
│   ├── useToggle/
│   └── index.ts
│
├── lib/                       # Utilidades y helpers
│   ├── cn.ts                  # Función clsx + tailwind-merge
│   ├── formatting.ts          # Funciones de formato
│   ├── validation.ts          # Esquemas de validación
│   └── constants.ts           # Constantes compartidas
│
├── types/                     # Tipos globales
│   ├── common.ts              # Tipos comunes
│   ├── user.ts                # Tipos de usuario
│   └── api.ts                 # Tipos de API
│
└── styles/
    ├── globals.css            # Estilos globales
    └── utils.css              # Utilidades CSS personalizadas
```

### Componente de Utility (clsx + tailwind-merge)

```tsx
// src/lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma inteligente,
 * resolviendo conflictos automáticamente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Ejemplos de uso:
// cn("px-4 py-2", "bg-blue-500") → "px-4 py-2 bg-blue-500"
// cn("px-4 py-2", "px-8") → "px-8 py-2" (resuelve conflicto)
// cn("bg-red-500", condition && "bg-blue-500") → "bg-blue-500" (si condition es true)
```

### Archivo de Barrel Exports

```tsx
// src/components/ui/index.ts
export { default as Button } from "./Button";
export type { ButtonProps } from "./Button";

export { default as Input } from "./Input";
export type { InputProps } from "./Input";

export { default as Card } from "./Card";
export type { CardProps } from "./Card";

export { default as Modal } from "./Modal";
export type { ModalProps, ModalRef } from "./Modal";

export { default as Badge } from "./Badge";
export type { BadgeProps } from "./Badge";

export { default as Avatar } from "./Avatar";
export type { AvatarProps } from "./Avatar";

// src/components/index.ts
export * from "./ui";
export * from "./layout";
export * from "./forms";
export * from "./sections";
```

---

## Patrones de Diseño para Mantenibilidad

### Patrón 1: Compound Components

```tsx
// ✅ PATRÓN COMPOUND - Componentes relacionados

// src/components/ui/Tabs/index.tsx
"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Context para compartir estado
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

// Componente principal
interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

export default function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Sub-componente: List
interface TabsListProps {
  children: ReactNode;
  className?: string;
}

Tabs.List = function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn(
      "flex space-x-1 bg-gray-100 p-1 rounded-lg",
      className
    )}>
      {children}
    </div>
  );
};

// Sub-componente: Trigger
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

Tabs.Trigger = function TabsTrigger({ 
  value, 
  children, 
  className 
}: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs.Trigger must be used within Tabs");
  
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-md transition-all",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        isActive
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:text-gray-900",
        className
      )}
    >
      {children}
    </button>
  );
};

// Sub-componente: Content
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

Tabs.Content = function TabsContent({ 
  value, 
  children, 
  className 
}: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs.Content must be used within Tabs");
  
  const { activeTab } = context;
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div className={cn("mt-4", className)}>
      {children}
    </div>
  );
};

// Uso
// <Tabs defaultValue="tab1">
//   <Tabs.List>
//     <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
//     <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
//   </Tabs.List>
//   <Tabs.Content value="tab1">Contenido 1</Tabs.Content>
//   <Tabs.Content value="tab2">Contenido 2</Tabs.Content>
// </Tabs>
```

### Patrón 2: Render Props

```tsx
// ✅ PATRÓN RENDER PROPS - Flexibilidad máxima

// src/components/ui/DataList/index.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DataListProps<T> {
  items: T[];
  isLoading: boolean;
  error: Error | null;
  emptyMessage?: string;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export default function DataList<T>({
  items,
  isLoading,
  error,
  emptyMessage = "No hay elementos",
  renderItem,
  keyExtractor,
  className,
}: DataListProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "p-4 bg-red-50 border border-red-200 rounded-lg text-red-700",
        className
      )}>
        Error al cargar datos: {error.message}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn(
        "p-8 text-center text-gray-500",
        className
      )}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// Uso
// <DataList<User>
//   items={users}
//   isLoading={isLoading}
//   error={error}
//   keyExtractor={(user) => user.id}
//   renderItem={(user) => <UserCard user={user} />}
// />
```

### Patrón 3: HOC (Higher Order Component)

```tsx
// ✅ PATRÓN HOC - Lógica reutilizable

// src/hocs/withLoading.tsx
import { ComponentType } from "react";

interface WithLoadingProps {
  isLoading: boolean;
  loadingFallback?: React.ReactNode;
}

export function withLoading<P extends object>(
  Component: ComponentType<P>,
  loadingFallback: React.ReactNode = <div className="animate-pulse h-4 bg-gray-200 rounded" />
) {
  return function WithLoadingComponent({
    isLoading,
    loadingFallback: fallback,
    ...props
  }: P & WithLoadingProps) {
    if (isLoading) {
      return <>{fallback ?? loadingFallback}</>;
    }
    return <Component {...props as P} />;
  };
}

// Uso
// const LoadingUserCard = withLoading(UserCard, <UserCardSkeleton />);
// <LoadingUserCard isLoading={isLoading} user={user} />
```

### Patrón 4: Custom Hooks para Lógica de Estilos

```tsx
// ✅ HOOKS PARA LÓGICA DE ESTILOS

// src/hooks/useBreakpoint.ts
import { useState, useEffect } from "react";

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("lg");

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint("sm");
      else if (width < 768) setBreakpoint("md");
      else if (width < 1024) setBreakpoint("lg");
      else if (width < 1280) setBreakpoint("xl");
      else setBreakpoint("2xl");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}

// src/hooks/useHover.ts
import { useState, useRef, useCallback } from "react";

export function useHover<T extends HTMLElement>() {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<T>(null);

  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  return {
    ref,
    isHovered,
    bind: {
      onMouseEnter,
      onMouseLeave,
    },
  };
}

// Uso
// const { isHovered, bind } = useHover<HTMLDivElement>();
// <div {...bind} className={isHovered ? "bg-blue-500" : "bg-gray-500"} />
```

---

## Configuración de Herramientas

### ESLint con Reglas de Tailwind

```javascript
// .eslintrc.cjs o eslint.config.mjs
module.exports = {
  plugins: ["tailwindcss"],
  rules: {
    // Forzar orden de clases
    "tailwindcss/classnames-order": "warn",
    
    // Prevenir clases duplicadas
    "tailwindcss/no-custom-classname": "warn",
    
    // Forzar uso de clases existentes
    "tailwindcss/no-arbitrary": "warn",
  },
  settings: {
    tailwindcss: {
      // Configuración del proyecto
      config: "tailwind.config.ts",
    },
  },
};
```

### Prettier con Plugin de Tailwind

```bash
# Instalación
npm install -D prettier @tailwindcss/prettier
```

```javascript
// prettier.config.mjs
export default {
  plugins: ["@tailwindcss/prettier"],
  tailwindConfig: "./tailwind.config.ts",
  tailwindFunctions: ["clsx", "cn", "tw"],
};
```

### VSCode Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["tw\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "tailwindCSS.includeLanguages": {
    "typescriptreact": "tailwindcss",
    "javascriptreact": "tailwindcss"
  }
}
```

---

## Ejemplos Completos Before/After

### Ejemplo 1: Componente de Tarjeta

```tsx
// ❌ ANTES - Todo junto, difícil de mantener
export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">${product.price}</span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ DESPUÉS - Componentes extraídos, limpio y mantenible

// src/components/product/ProductCard.tsx
import Image from "next/image";
import { cn } from "@/lib/cn";
import Card from "@/components/ui/Card";
import Title from "@/components/ui/Title";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";

interface ProductCardProps {
  product: {
    name: string;
    description: string;
    price: number;
    image: string;
  };
  onAddToCart?: () => void;
  className?: string;
}

export default function ProductCard({
  product,
  onAddToCart,
  className,
}: ProductCardProps) {
  const imageContainerClasses = cn(
    "relative",
    "h-48",
    "bg-gradient-to-br from-blue-500 to-purple-600",
  );

  const priceClasses = cn(
    "text-2xl font-bold text-blue-600",
  );

  return (
    <Card
      variant="elevated"
      hover
      padding="none"
      className={className}
    >
      <div className={imageContainerClasses}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-6">
        <Title level={3}>{product.name}</Title>
        <Text variant="muted" className="mt-2">
          {product.description}
        </Text>
        <div className="flex justify-between items-center mt-4">
          <span className={priceClasses}>${product.price}</span>
          <Button variant="primary" onClick={onAddToCart}>
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

### Ejemplo 2: Formulario de Login

```tsx
// ❌ ANTES - Clases inline, difícil de mantener
export default function LoginForm() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inicia sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-6 6">
            O{" "}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              regístrate gratis
            </a>
          </p>
        </div>
        <form className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Recordarme
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ✅ DESPUÉS - Componentes reutilizables, código limpio

// src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Title from "@/components/ui/Title";
import Text from "@/components/ui/Text";
import { cn } from "@/lib/cn";

interface LoginFormProps {
  onLogin?: (email: string, password: string) => Promise<void>;
  className?: string;
}

export default function LoginForm({ onLogin, className }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onLogin?.(email, password);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const formClasses = cn(
    "mt-8 space-y-6",
  );

  const inputGroupClasses = cn(
    "rounded-md shadow-sm -space-y-px",
  );

  const footerClasses = cn(
    "flex items-center justify-between",
  );

  const submitContainerClasses = cn(
    "pt-4",
  );

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4",
      className
    )}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Title level={2}>Inicia sesión</Title>
          <Text variant="muted" className="mt-2">
            O{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-500">
              regístrate gratis
            </Link>
          </Text>
        </div>

        <Card variant="default" padding="lg">
          <form onSubmit={handleSubmit} className={formClasses}>
            <div className={inputGroupClasses}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                rounded="top"
              />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                rounded="bottom"
              />
            </div>

            <div className={footerClasses}>
              <Checkbox
                id="remember-me"
                label="Recordarme"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className={submitContainerClasses}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Iniciar sesión
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
```

### Ejemplo 3: Dashboard con Grid Responsivo

```tsx
// ❌ ANTES - Grid hardcodeado, difícil de adaptar
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">Dashboard</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Inicio
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Reports
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Dashboard
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">2,000</dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">$50,000</dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Conversions</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">500</dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ✅ DESPUÉS - Componentes modulares, grid flexible

// src/app/dashboard/page.tsx
import Header from "@/components/layout/Header";
import Container from "@/components/layout/Container";
import Card from "@/components/ui/Card";
import Title from "@/components/ui/Title";
import StatsGrid from "@/components/dashboard/StatsGrid";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-10">
        <Container>
          <div className="mb-8">
            <Title level={1}>Dashboard</Title>
          </div>
          
          <StatsGrid />
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

// src/components/dashboard/StatsGrid.tsx
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import { cn } from "@/lib/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

function StatCard({ title, value, change, trend = "neutral", icon }: StatCardProps) {
  const trendClasses = cn(
    "text-sm font-medium",
    {
      "text-green-600": trend === "up",
      "text-red-600": trend === "down",
      "text-gray-500": trend === "neutral",
    }
  );

  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="muted">{title}</Text>
          <Title level={3} className="mt-1">{value}</Title>
          {change && (
            <p className={trendClasses}>{change}</p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function StatsGrid() {
  const gridClasses = cn(
    "grid",
    "grid-cols-1 gap-4",
    "sm:grid-cols-2",
    "lg:grid-cols-3",
  );

  return (
    <div className={gridClasses}>
      <StatCard
        title="Total Users"
        value="2,000"
        change="+12% desde el mes pasado"
        trend="up"
        icon={<UsersIcon />}
      />
      <StatCard
        title="Revenue"
        value="$50,000"
        change="+8% desde el mes pasado"
        trend="up"
        icon={<CurrencyIcon />}
      />
      <StatCard
        title="Conversions"
        value="500"
        change="-3% desde el mes pasado"
        trend="down"
        icon={<ConversionIcon />}
      />
    </div>
  );
}

// Iconos como componentes
function UsersIcon() {
  return (
    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ConversionIcon() {
  return (
    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
```

---

## Resumen de Mejores Prácticas

### Checklist de Organización de Estilos

- [ ] **Usar clsx y tailwind-merge** para combinar clases inteligentemente
- [ ] **Extraer componentes de UI** cuando se repiten más de 2-3 veces
- [ ] **Ordenar clases en grupos semánticos** (Layout → Dimensiones → Apariencia → Interacción)
- [ ] **Separar lógica de presentación** usando el patrón Container/Presentational
- [ ] **Crear una función utility** (cn) para combinar clases
- [ ] **Usar variantes en componentes** en lugar de props booleanas
- [ ] **Configurar Prettier** con el plugin de Tailwind
- [ ] **Crear sistema de diseño** con tokens personalizados en tailwind.config.ts
- [ ] **Documentar componentes** complejos
- [ ] **Usar TypeScript** para tipado de props

### Regla de Oro

> **"Si un elemento tiene más de 4-5 clases de Tailwind, considera extraerlo a un componente."**

Esta simple regla previene la mayoría de los problemas de mantenibilidad y mejora significativamente la legibilidad del código.

---

*Esta guía proporciona las técnicas y patrones utilizados por equipos profesionales para mantener código Tailwind CSS limpio, escalable y mantenible a largo plazo.*