# 🔧 Solución: "Error al cargar el panel" en Admin

## 🎯 Problema

Después de iniciar sesión como administrador en producción, ves:

```
Error al cargar el panel
Error al cargar los datos del panel. Intenta recargar la página.
```

## 🔍 Causa

El **frontend (Vercel) y el backend (tu servidor) usan diferentes valores de `JWT_SECRET`**.

Cuando el administrador inicia sesión:

1. ✅ NextAuth autentica al admin correctamente
2. ✅ NextAuth genera un token JWT usando el `JWT_SECRET` de Vercel
3. ❌ El frontend envía este token al backend
4. ❌ El backend intenta validar el token con **su propio** `JWT_SECRET`
5. ❌ Los secretos no coinciden → Token inválido → Error 401

## ✅ Solución

El `JWT_SECRET` debe ser **exactamente el mismo** en:

- Frontend (Vercel)
- Backend (tu servidor)

### Paso 1: Obtener el JWT_SECRET del Backend

Conéctate a tu servidor y obtén el valor actual:

```bash
# Si usas Docker
docker exec a_la_reja_backend printenv JWT_SECRET

# Si usas archivo .env directamente
ssh usuario@82.180.163.31
cat /ruta/al/proyecto/backend/.env | grep JWT_SECRET
```

Copia el valor completo que obtengas.

### Paso 2: Configurar el Mismo Valor en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto `a-la-reja`
3. **Settings** → **Environment Variables**
4. Busca `JWT_SECRET`
5. Si ya existe:
   - Click en los tres puntos **"..."**
   - Click en **"Edit"**
   - Reemplaza el valor con el del backend
   - Click en **"Save"**
6. Si no existe:
   - Click en **"Add New"**
   - Key: `JWT_SECRET`
   - Value: (el valor que copiaste del backend)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click en **"Save"**

### Paso 3: Redeploy

```bash
# Desde tu terminal local
git commit --allow-empty -m "fix: sync JWT_SECRET with backend"
git push
```

O desde Vercel Dashboard:

- **Deployments** → último deployment → **"..."** → **Redeploy**

### Paso 4: Verificar

Después del redespliegue (2-3 minutos):

1. Ve a `https://a-la-reja.vercel.app/admin`
2. Inicia sesión con las credenciales de admin
3. Deberías ver el dashboard cargando correctamente

## 🔒 Alternativa: Generar Nuevo JWT_SECRET para Ambos

Si prefieres usar un secreto nuevo y más seguro:

### 1. Generar un nuevo secreto

```bash
openssl rand -base64 32
```

Esto generará algo como:

```
kX9mPqR7sT2vW5yZ8aB3cD6eF9gH1jK4lM7nO0pQ3rS6
```

### 2. Actualizar el Backend

En tu servidor:

```bash
# Editar el archivo .env del backend
nano /ruta/al/backend/.env
```

Cambia la línea:

```env
JWT_SECRET=el-nuevo-secreto-generado
```

Guarda y reinicia el backend:

```bash
# Si usas Docker
docker-compose restart backend

# Si usas PM2
pm2 restart backend
```

### 3. Actualizar Vercel

Sigue los pasos del "Paso 2" de arriba, usando el nuevo secreto.

### 4. Redeploy Vercel

```bash
git commit --allow-empty -m "fix: update JWT_SECRET"
git push
```

## 🐛 Debugging

Si aún no funciona después de sincronizar los secretos:

### Ver logs del frontend (Vercel)

1. Vercel Dashboard → Deployments → último deployment
2. Click en **"View Function Logs"**
3. Busca errores relacionados con autenticación

Deberías ver:

```
✅ [AdminDashboard] Fetching data from: https://82-180-163-31.sslip.io
✅ [AdminDashboard] Token present: true
✅ [AdminDashboard] Response status: { usuarios: 200, reservaciones: 200, canchas: 200 }
```

Si ves:

```
❌ [AdminDashboard] Response status: { usuarios: 401, reservaciones: 401, canchas: 401 }
```

Significa que el token aún es inválido → verifica que el JWT_SECRET sea idéntico en ambos lados.

### Ver logs del backend

```bash
# Si usas Docker
docker-compose logs -f backend

# Si usas PM2
pm2 logs backend
```

Busca errores como:

```
❌ Token inválido
❌ jwt malformed
❌ invalid signature
```

### Verificar que los secretos son idénticos

En tu máquina local, ejecuta:

```bash
# Crear script temporal
cat > verify-jwt.sh << 'EOF'
#!/bin/bash
echo "Backend JWT_SECRET:"
ssh usuario@82.180.163.31 "docker exec a_la_reja_backend printenv JWT_SECRET"

echo ""
echo "Vercel JWT_SECRET (lo configuraste):"
echo "Ve a Vercel Dashboard → Settings → Environment Variables → JWT_SECRET"
EOF

chmod +x verify-jwt.sh
./verify-jwt.sh
```

Los valores deben ser **exactamente iguales** (sin espacios extra, sin comillas, sin saltos de línea).

## ✅ Checklist

- [ ] Obtuve el `JWT_SECRET` del backend
- [ ] Configuré el mismo valor en Vercel
- [ ] Hice redeploy en Vercel
- [ ] Esperé 2-3 minutos para que termine el despliegue
- [ ] Probé el login de admin
- [ ] Revisé los logs si hay errores

## 📚 Referencias

- [VERCEL_SETUP.md](VERCEL_SETUP.md) - Configuración completa de Vercel
- [ADMIN_SETUP.md](ADMIN_SETUP.md) - Cómo funciona el sistema de admin
- [test-backend.js](test-backend.js) - Script para probar la conexión con el backend
