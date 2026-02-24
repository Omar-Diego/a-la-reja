# 🔐 Configuración del Usuario Administrador

## Problema: "Credenciales invalidas" en Producción

Si recibes el error "Credenciales invalidas. Por favor verifica tu email y contraseña" al intentar iniciar sesión como administrador en producción, significa que las variables de entorno del administrador no están configuradas correctamente.

## Solución

El usuario administrador **NO está en la base de datos**. Es un usuario hardcoded que se valida usando variables de entorno.

### 1. Variables de Entorno Requeridas

En tu servidor de producción, necesitas configurar estas variables de entorno:

```bash
ADMIN_EMAIL=tu-email@ejemplo.com
ADMIN_PASSWORD=tu-contraseña-segura
```

### 2. Cómo Configurar en Producción

#### Opción A: Archivo `.env` (Vercel, Netlify, etc.)

Si usas Vercel, Netlify o similar:

1. Ve al panel de control de tu proyecto
2. Busca la sección de "Environment Variables" o "Variables de Entorno"
3. Agrega:
   - `ADMIN_EMAIL` = tu email de administrador
   - `ADMIN_PASSWORD` = tu contraseña de administrador

#### Opción B: Docker / VPS

Si usas Docker o un VPS, crea o edita el archivo `.env`:

```bash
# En el directorio raíz del proyecto
nano .env
```

Agrega estas líneas:

```env
ADMIN_EMAIL=admin@alareja.com
ADMIN_PASSWORD=TuContraseñaSegura123!
```

Luego reinicia tu aplicación:

```bash
# Si usas Docker
docker-compose down
docker-compose up -d

# Si usas PM2
pm2 restart all
```

### 3. Verificar la Configuración

Para verificar que las variables están configuradas correctamente, revisa los logs de tu aplicación cuando intentes iniciar sesión:

```bash
# Docker
docker-compose logs -f frontend

# PM2
pm2 logs
```

Deberías ver algo como:

```
[NextAuth] Login attempt for: admin@alareja.com
[NextAuth] ADMIN_EMAIL is set: true
[NextAuth] ADMIN_PASSWORD is set: true
[NextAuth] Admin login successful
```

### 4. Credenciales por Defecto para Desarrollo

Para desarrollo local, puedes usar:

```env
ADMIN_EMAIL=admin@alareja.com
ADMIN_PASSWORD=Admin123!
```

### 5. Seguridad

⚠️ **IMPORTANTE:**

- **NUNCA** subas el archivo `.env` con credenciales reales a GitHub
- Usa contraseñas fuertes para producción
- Las credenciales de desarrollo y producción deben ser diferentes
- El archivo `.env` debe estar en `.gitignore`

### 6. Código Relacionado

El código de autenticación del administrador está en [`auth.ts`](auth.ts#L30-L60):

```typescript
// Credenciales del administrador (leídas en tiempo de ejecución)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Verificar si es el administrador
if (
  ADMIN_EMAIL &&
  ADMIN_PASSWORD &&
  timingSafeStringEqual(String(credentials.email), ADMIN_EMAIL) &&
  timingSafeStringEqual(String(credentials.password), ADMIN_PASSWORD)
) {
  // Login exitoso como admin
}
```

### 7. Troubleshooting

#### No funciona después de configurar las variables

1. **Reinicia la aplicación** - Las variables de entorno se leen al iniciar
2. **Verifica los logs** - Usa los comandos de logs mencionados arriba
3. **Verifica el archivo `.env`** - No debe tener espacios extra o comillas
4. **Verifica la ortografía** - El email y contraseña deben coincidir exactamente

#### Variables no se cargan

Si usas Next.js en producción, asegúrate de que las variables NO tengan el prefijo `NEXT_PUBLIC_` (ese prefijo es solo para variables que deben estar disponibles en el cliente).

```env
# ✅ Correcto
ADMIN_EMAIL=admin@alareja.com

# ❌ Incorrecto (esto expondría las credenciales al navegador)
NEXT_PUBLIC_ADMIN_EMAIL=admin@alareja.com
```

## Resumen

1. Configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` en tu servidor de producción
2. Reinicia la aplicación
3. Intenta iniciar sesión con esas credenciales
4. Revisa los logs si hay problemas
