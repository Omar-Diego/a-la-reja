#!/usr/bin/env node

/**
 * Script para verificar la configuración de variables de entorno
 * Uso: node check-env.js
 */

require("dotenv").config();

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkVar(name, required = true, shouldBeSecret = false) {
  const value = process.env[name];
  const exists = !!value;

  if (required && !exists) {
    log(`  ❌ ${name}: NO CONFIGURADA (REQUERIDA)`, colors.red);
    return false;
  } else if (!required && !exists) {
    log(`  ⚠️  ${name}: No configurada (opcional)`, colors.yellow);
    return true;
  } else {
    if (shouldBeSecret) {
      const preview =
        value.length > 4
          ? `${value.substring(0, 4)}${"*".repeat(value.length - 4)}`
          : "****";
      log(`  ✅ ${name}: ${preview}`, colors.green);
    } else {
      log(`  ✅ ${name}: ${value}`, colors.green);
    }
    return true;
  }
}

log("\n==========================================", colors.blue + colors.bold);
log("  Verificación de Variables de Entorno", colors.blue + colors.bold);
log("  A La Reja - Sistema de Reservaciones", colors.blue + colors.bold);
log("==========================================\n", colors.blue + colors.bold);

let allValid = true;

// Frontend
log("📱 FRONTEND (Next.js):", colors.bold);
allValid &= checkVar("NEXT_PUBLIC_API_URL");
allValid &= checkVar("AUTH_SECRET", true, true);
allValid &= checkVar("NEXTAUTH_URL", false);

// Administrador
log("\n👤 ADMINISTRADOR:", colors.bold);
allValid &= checkVar("ADMIN_EMAIL");
allValid &= checkVar("ADMIN_PASSWORD", true, true);

// Base de datos
log("\n🗄️  BASE DE DATOS:", colors.bold);
allValid &= checkVar("MYSQL_ROOT_PASSWORD", true, true);
allValid &= checkVar("DB_NAME");
allValid &= checkVar("DB_USER");
allValid &= checkVar("DB_PASSWORD", true, true);
allValid &= checkVar("DB_HOST", false);
allValid &= checkVar("DB_PORT", false);

// Backend
log("\n⚙️  BACKEND:", colors.bold);
allValid &= checkVar("JWT_SECRET", true, true);
allValid &= checkVar("FRONTEND_URL");
allValid &= checkVar("PORT", false);
allValid &= checkVar("NODE_ENV", false);

// Resultado final
log("\n==========================================", colors.blue + colors.bold);
if (allValid) {
  log(
    "  ✅ TODAS LAS VARIABLES ESTÁN CONFIGURADAS",
    colors.green + colors.bold,
  );
  log(
    "==========================================\n",
    colors.blue + colors.bold,
  );
  log("✨ Tu configuración está lista!", colors.green);
  log("\nPuedes iniciar la aplicación con:", colors.reset);
  log("  npm run dev     (desarrollo)", colors.blue);
  log("  npm run build   (producción)", colors.blue);
} else {
  log("  ❌ FALTAN VARIABLES REQUERIDAS", colors.red + colors.bold);
  log(
    "==========================================\n",
    colors.blue + colors.bold,
  );
  log("⚠️  Por favor configura las variables faltantes", colors.yellow);
  log("\nPasos:", colors.reset);
  log("  1. Copia .env.example a .env:", colors.reset);
  log("     cp .env.example .env", colors.blue);
  log("  2. Edita .env con tus valores:", colors.reset);
  log("     nano .env", colors.blue);
  log("  3. Vuelve a ejecutar este script:", colors.reset);
  log("     node check-env.js", colors.blue);
  process.exit(1);
}

// Advertencias de seguridad
log("\n🔒 RECORDATORIOS DE SEGURIDAD:", colors.yellow + colors.bold);
log("  • NUNCA subas el archivo .env a GitHub", colors.yellow);
log("  • Usa contraseñas diferentes en producción", colors.yellow);
log("  • Genera secretos seguros con: openssl rand -base64 32", colors.yellow);
log("");
